#include <Wire.h>
#include "MS5837.h"
#include <ESP32Servo.h>
#include <TinyGPSPlus.h>
#include <HardwareSerial.h>

// ===================== PINS =====================
// I2C (Bar30)
static const int I2C_SDA = 41;
static const int I2C_SCL = 42;

// Turbidity (analog)
static const int TURB_PIN = 4;

// GPS (UART1)
static const int GPS_RX = 48;   // ESP32 RX  <- GPS TX
static const int GPS_TX = -1;   // not used

// Actuators
static const int RELAY_PIN = 26; // air valve relay IN
static const int SERVO_PIN = 19; // motor (servo signal)

// ===================== USER SETTINGS =====================
// Trigger when depth >= this value (meters). Change this anytime.
static const float DEPTH_TRIGGER_M = -0.10; // e.g. 0.30 = 30cm, 1.00 = 1m

// Valve ON -> wait 3s -> motor ON
static const unsigned long VALVE_TO_MOTOR_DELAY_MS = 3000;

// Turbidity averaging
static const int AVG_N = 20;

// ===================== OBJECTS =====================
MS5837 ms;
Servo samplerServo;

TinyGPSPlus gps;
HardwareSerial GPSSerial(1);

// ===================== TURBIDITY BUFFER =====================
int  turbBuf[AVG_N];
int  turbIdx = 0;
long turbSum = 0;
bool turbFilled = false;

// ===================== STATE MACHINE =====================
enum State { IDLE, WAIT_FOR_DEPTH, VALVE_ON_WAIT, DONE };
State state = IDLE;

unsigned long valveStartTime = 0;

// ===================== HELPERS =====================
void valveOn()  { digitalWrite(RELAY_PIN, HIGH); }
void valveOff() { digitalWrite(RELAY_PIN, LOW);  }

void motorOn()  { samplerServo.write(90); }  // adjust angle as needed
void motorOff() { samplerServo.write(0);  }  // safe position

float adcToVoltage(int raw) {
  return (raw / 4095.0f) * 3.3f; // ESP32 default ADC full-scale is 4095
}

// Simple/rough NTU estimate (placeholder). Real NTU needs calibration.
float estimateNTU(float vAvg) {
  float ntu = (3.3f - vAvg) * 1000.0f;
  if (ntu < 0) ntu = 0;
  return ntu;
}

void updateTurbidity() {
  int raw = analogRead(TURB_PIN);

  turbSum -= turbBuf[turbIdx];
  turbBuf[turbIdx] = raw;
  turbSum += raw;

  turbIdx++;
  if (turbIdx >= AVG_N) {
    turbIdx = 0;
    turbFilled = true;
  }
}

void printHelp() {
  Serial.println("Commands:");
  Serial.println("  s = start (arm depth trigger)");
  Serial.println("  r = reset (valve OFF + motor OFF + IDLE)");
  Serial.println("  ? = help");
}

void resetSystem(const char* msg) {
  valveOff();
  motorOff();
  state = IDLE;
  valveStartTime = 0;
  if (msg) Serial.println(msg);
}

// ===================== SETUP =====================
void setup() {
  Serial.begin(115200);
  delay(800);

  // Relay
  pinMode(RELAY_PIN, OUTPUT);
  valveOff();

  // Servo (motor)
  samplerServo.setPeriodHertz(50);
  samplerServo.attach(SERVO_PIN, 500, 2500);
  motorOff();

  // I2C + Bar30
  Wire.begin(I2C_SDA, I2C_SCL);
  if (!ms.init()) {
    Serial.println("ERROR: MS5837 init failed. Check I2C pins/wiring/power.");
    while (1) delay(1000);
  }
  ms.setModel(MS5837::MS5837_30BA);
  ms.setFluidDensity(997); // freshwater; use ~1029 for seawater

  // Turbidity ADC config
  analogReadResolution(12);
  analogSetAttenuation(ADC_11db); // allows ~0-3.3V range (board-dependent)
  for (int i = 0; i < AVG_N; i++) turbBuf[i] = 0;

  // GPS UART
  GPSSerial.begin(9600, SERIAL_8N1, GPS_RX, GPS_TX);

  Serial.println("✅ Integrated sensor monitor + depth trigger test");
  Serial.print("Depth trigger: depth >= ");
  Serial.print(DEPTH_TRIGGER_M, 2);
  Serial.println(" m");
  Serial.println("Action: Valve ON -> wait 3s -> Motor ON (servo 90).");
  printHelp();
}

// ===================== LOOP =====================
void loop() {
  unsigned long now = millis();

  // ---- GPS parsing (non-blocking) ----
  while (GPSSerial.available()) {
    gps.encode(GPSSerial.read());
  }

  // ---- Read sensors ----
  ms.read();
  float depth_m        = ms.depth();
  float temp_c         = ms.temperature();
  float pressure_mbar  = ms.pressure();

  updateTurbidity();

  // Turbidity values
  int count = turbFilled ? AVG_N : turbIdx;
  float rawAvg = (count > 0) ? (turbSum / (float)count) : 0.0f;
  float vAvg   = adcToVoltage((int)rawAvg);
  float ntuEst = estimateNTU(vAvg);

  // GPS status
  bool fix = gps.location.isValid() && gps.location.age() < 3000;
  int sats = gps.satellites.isValid() ? gps.satellites.value() : 0;

  // ---- Serial commands ----
  while (Serial.available()) {
    char c = Serial.read();
    if (c == 's') {
      if (state == IDLE) {
        Serial.println("Start: waiting for depth threshold...");
        state = WAIT_FOR_DEPTH;
      } else {
        Serial.println("Already running. Use 'r' to reset.");
      }
    } else if (c == 'r') {
      resetSystem("Reset -> Valve OFF + Motor OFF + IDLE.");
    } else if (c == '?') {
      printHelp();
    }
  }

  // ---- Trigger logic ----
  if (state == WAIT_FOR_DEPTH) {
    if (depth_m >= DEPTH_TRIGGER_M) {
      Serial.print("DEPTH TRIGGERED: depth=");
      Serial.print(depth_m, 3);
      Serial.println(" m -> Valve ON");

      valveOn();
      valveStartTime = now;
      state = VALVE_ON_WAIT;
    }
  }
  else if (state == VALVE_ON_WAIT) {
    if (now - valveStartTime >= VALVE_TO_MOTOR_DELAY_MS) {
      Serial.println("Motor ON (servo 90) after 3 seconds.");
      motorOn();
      state = DONE;
    }
  }
  // DONE stays DONE until you press 'r'

  // ---- Print status (1Hz) ----
  static unsigned long lastPrint = 0;
  if (now - lastPrint >= 1000) {
    lastPrint = now;

    Serial.print("Depth: "); Serial.print(depth_m, 3); Serial.print(" m");
    Serial.print(" | Temp: "); Serial.print(temp_c, 2); Serial.print(" C");
    Serial.print(" | P: "); Serial.print(pressure_mbar, 1); Serial.print(" mbar");

    Serial.print(" | Turb(Vavg): "); Serial.print(vAvg, 3); Serial.print(" V");
    Serial.print(" | NTU(est): "); Serial.print(ntuEst, 1);

    Serial.print(" | GPS: ");
    if (fix) {
      Serial.print(gps.location.lat(), 6);
      Serial.print(",");
      Serial.print(gps.location.lng(), 6);
    } else {
      Serial.print("NO FIX");
    }
    Serial.print(" | Sats: "); Serial.print(sats);

    Serial.print(" | Valve: "); Serial.print(digitalRead(RELAY_PIN) ? "ON" : "OFF");
    Serial.print(" | State: ");
    if (state == IDLE) Serial.println("IDLE");
    else if (state == WAIT_FOR_DEPTH) Serial.println("WAIT_FOR_DEPTH");
    else if (state == VALVE_ON_WAIT) Serial.println("VALVE_ON_WAIT");
    else Serial.println("DONE");
  }

  delay(20);
}

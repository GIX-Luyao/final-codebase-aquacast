#include <Wire.h>
#include "MS5837.h"
#include <ESP32Servo.h>
#include <TinyGPSPlus.h>
#include <HardwareSerial.h>

// ===================== PINS =====================
static const int I2C_SDA = 41;
static const int I2C_SCL = 42;

static const int TURB_PIN  = 4;
static const int GPS_RX   = 47;
static const int GPS_TX   = 48;

static const int RELAY_PIN = 26;
static const int SERVO_PIN = 19;

// ===================== OBJECTS =====================
MS5837 ms;
Servo samplerServo;

TinyGPSPlus gps;
HardwareSerial GPSSerial(1);

// ===================== SETTINGS =====================
static const bool RELAY_ACTIVE_LOW = false;

// Servo angles (based on 2*n/5*360)
int samplerAngle(int n) {
  int angle = (int)(2.0 * n / 5.0 * 360.0);
  return angle % 360;   // keep readable
}

// ===================== STATE =====================
enum State {
  IDLE,
  LOGGING,
  S1,
  S3,
  S5,
  VALVE_ON,
  S4,
  S2,
  DONE
};

State state = IDLE;
unsigned long seqStartTime = 0;
bool sequenceRunning = false;

// ===================== HELPERS =====================
void valveOn()  { digitalWrite(RELAY_PIN, RELAY_ACTIVE_LOW ? LOW : HIGH); }
void valveOff() { digitalWrite(RELAY_PIN, RELAY_ACTIVE_LOW ? HIGH : LOW); }

float adcToVoltage(int raw) {
  return (raw / 4095.0f) * 3.3f;
}

// ===================== SETUP =====================
void setup() {
  Serial.begin(115200);
  delay(1000);

  pinMode(RELAY_PIN, OUTPUT);
  valveOff();

  samplerServo.setPeriodHertz(50);
  samplerServo.attach(SERVO_PIN, 500, 2500);
  samplerServo.write(0);

  Wire.begin(I2C_SDA, I2C_SCL);
  if (!ms.init()) {
    Serial.println("❌ MS5837 init failed");
    while (1);
  }
  ms.setModel(MS5837::MS5837_30BA);
  ms.setFluidDensity(997);

  analogReadResolution(12);
  analogSetAttenuation(ADC_11db);

  GPSSerial.begin(9600, SERIAL_8N1, GPS_RX, GPS_TX);

  Serial.println("Ready. Type 's' to start sequence.");
}

// ===================== LOOP =====================
void loop() {
  unsigned long now = millis();

  // --- GPS update ---
  while (GPSSerial.available()) {
    gps.encode(GPSSerial.read());
  }

  // --- Read sensors ---
  ms.read();
  float depth_m = ms.depth();
  float temp_c  = ms.temperature();
  float pressure_mbar = ms.pressure();

  int turbRaw = analogRead(TURB_PIN);
  float turbV = adcToVoltage(turbRaw);

  // --- Serial trigger ---
  if (Serial.available()) {
    char c = Serial.read();
    if (c == 's' && !sequenceRunning) {
      sequenceRunning = true;
      seqStartTime = now;
      state = LOGGING;
      Serial.println("=== SEQUENCE START ===");
    }
  }

  if (!sequenceRunning) return;

  unsigned long t = now - seqStartTime;

  // --- Continuous logging ---
  Serial.print("[LOG] t=");
  Serial.print(t / 1000);
  Serial.print("s | Depth=");
  Serial.print(depth_m, 2);
  Serial.print(" m | Temp=");
  Serial.print(temp_c, 2);
  Serial.print(" C | Turb=");
  Serial.print(turbV, 3);
  Serial.print(" V | GPS=");
  if (gps.location.isValid()) {
    Serial.print(gps.location.lat(), 6);
    Serial.print(",");
    Serial.print(gps.location.lng(), 6);
  } else {
    Serial.print("NO FIX");
  }
  Serial.println();

  // --- Time-driven sequence ---
  if (t >= 5000 && state == LOGGING) {
    Serial.println("Sampler 1 CLOSE (1m)");
    samplerServo.write(samplerAngle(1));
    state = S1;
  }
  else if (t >= 10000 && state == S1) {
    Serial.println("Sampler 3 CLOSE (3m)");
    samplerServo.write(samplerAngle(3));
    state = S3;
  }
  else if (t >= 15000 && state == S3) {
    Serial.println("Sampler 5 CLOSE (5m)");
    samplerServo.write(samplerAngle(5));
    Serial.println("Air Valve ON");
    valveOn();
    state = VALVE_ON;
  }
  else if (t >= 20000 && state == VALVE_ON) {
    Serial.println("Sampler 4 CLOSE (4m)");
    samplerServo.write(samplerAngle(4));
    state = S4;
  }
  else if (t >= 25000 && state == S4) {
    Serial.println("Sampler 2 CLOSE (2m)");
    samplerServo.write(samplerAngle(2));
    state = S2;
  }
  else if (t >= 30000 && state == S2) {
    Serial.println("=== SEQUENCE DONE ===");
    Serial.println("Sending data to drone team...");
    valveOff();
    sequenceRunning = false;
    state = DONE;
  }

  delay(100);
}

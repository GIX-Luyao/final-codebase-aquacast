#include <Wire.h>
#include "MS5837.h"
#include <ESP32Servo.h>
#include <TinyGPSPlus.h>
#include <HardwareSerial.h>
#include <SPI.h>
#include <SD.h>

// ============================================================
// PIN DEFINITIONS
// ============================================================
static const int I2C_SDA   = 41;
static const int I2C_SCL   = 42;
static const int TURB_PIN  = 4;
static const int GPS_RX    = 47;
static const int GPS_TX    = 48;
static const int RELAY_PIN = 26;
static const int SERVO_PIN = 19;
static const int SD_CS     = 5;

// ============================================================
// OBJECTS
// ============================================================
MS5837 ms;
Servo samplerServo;
TinyGPSPlus gps;
HardwareSerial GPSSerial(1);
File dataFile;

// ============================================================
// MODE SETTINGS
// ============================================================
bool airTestMode = true;      // true = air testing
float descentRate = 0.3;      // meters per second
float fakeDepth = 0.0;

// ============================================================
// TARGET DEPTHS
// ============================================================
float targetDepths[5] = {1,2,3,4,5};
int sampleCount = 3;

// ============================================================
// STATE MACHINE
// ============================================================
enum State { IDLE, RUNNING, DONE };
State state = IDLE;

unsigned long seqStartMs = 0;
unsigned long lastLogMs = 0;

bool samplerTriggered[5] = {false,false,false,false,false};

bool valveIsOpen = false;
unsigned long valveOpenStartMs = 0;
static const unsigned long VALVE_OPEN_DURATION_MS = 10000;

bool sdOk = false;
String currentFileName = "";

// ============================================================
// HELPER FUNCTIONS
// ============================================================

String getNextMissionFileName() {
  int missionNumber = 1;
  while (true) {
    char name[32];
    sprintf(name, "/mission_%03d.csv", missionNumber);
    if (!SD.exists(name)) return String(name);
    missionNumber++;
    if (missionNumber > 999) return "/mission_999.csv";
  }
}

void valveOpen() {
  digitalWrite(RELAY_PIN, HIGH);
  valveIsOpen = true;
  valveOpenStartMs = millis();
}

void valveClose() {
  digitalWrite(RELAY_PIN, LOW);
  valveIsOpen = false;
}

float readTurbidity() {
  int raw = analogRead(TURB_PIN);
  return (raw / 4095.0f) * 3.3f;
}

void logData(String type, int samplerIndex,
             float triggerDepth,
             float realDepth,
             float temp,
             float turb) {

  if (!sdOk) return;

  File f = SD.open(currentFileName, FILE_APPEND);
  if (!f) return;

  f.print(millis());
  f.print(",");
  f.print(type);
  f.print(",");

  f.print(triggerDepth,3);   // fake or real used for trigger
  f.print(",");

  if (isnan(realDepth)) f.print("NA");
  else f.print(realDepth,3);
  f.print(",");

  if (isnan(temp)) f.print("NA");
  else f.print(temp,3);
  f.print(",");

  f.print(turb,3);
  f.print(",");

  f.print(valveIsOpen ? "OPEN" : "CLOSED");
  f.print(",");

  if (samplerIndex == -1) f.print("NA");
  else f.print(samplerIndex);
  f.print(",");

  if (gps.location.isValid()) {
    f.print(gps.location.lat(), 6);
    f.print(",");
    f.print(gps.location.lng(), 6);
  } else {
    f.print("NA,NA");
  }

  f.println();
  f.flush();
  f.close();
}

// ============================================================
// SETUP
// ============================================================

void setup() {

  Serial.begin(115200);
  delay(1500);

  pinMode(RELAY_PIN, OUTPUT);
  valveClose();

  samplerServo.setPeriodHertz(50);
  samplerServo.attach(SERVO_PIN, 500, 2500);
  samplerServo.write(0);

  Wire.begin(I2C_SDA, I2C_SCL);
  ms.init();

  GPSSerial.begin(9600, SERIAL_8N1, GPS_RX, GPS_TX);

  // SD INIT
  if (!SD.begin(SD_CS)) {
    Serial.println("❌ SD Mount Failed");
    sdOk = false;
  } else {
    sdOk = true;
    currentFileName = getNextMissionFileName();

    File f = SD.open(currentFileName, FILE_WRITE);
    if (f) {
      f.println("timestamp_ms,type,trigger_depth_m,real_depth_m,temp_c,turbidity_v,valve_state,sampler_index,gps_lat,gps_lng");
      f.close();
    }
  }

  Serial.println("Commands:");
  Serial.println("n = set sample count");
  Serial.println("d = set depths");
  Serial.println("s = start mission");
}

// ============================================================
// LOOP
// ============================================================

void loop() {

  unsigned long now = millis();

  while (GPSSerial.available()) {
    gps.encode(GPSSerial.read());
  }

  float realDepth = NAN;
  float realTemp  = NAN;

  if (ms.read()) {
    realDepth = ms.depth();
    realTemp  = ms.temperature();
  }

  float turb = readTurbidity();

  while (Serial.available()) {
    char c = Serial.read();

    if (c == 'n') {
      sampleCount = constrain(Serial.parseInt(),1,5);
      Serial.println("Sample count set.");
    }

    if (c == 'd') {
      for (int i=0;i<sampleCount;i++) {
        targetDepths[i] = Serial.parseFloat();
      }
      Serial.println("Depths updated.");
    }

    if (c == 's' && state == IDLE) {
      state = RUNNING;
      seqStartMs = now;
      fakeDepth = 0;
      for (int i=0;i<5;i++) samplerTriggered[i] = false;
      Serial.println("MISSION START");
    }
  }

  if (state != RUNNING) return;

  unsigned long t = now - seqStartMs;

  if (airTestMode) {
    fakeDepth = (t / 1000.0) * descentRate;
  }

  float triggerDepth = airTestMode ? fakeDepth : realDepth;

  for (int i=0;i<sampleCount;i++) {

    if (!samplerTriggered[i] &&
        !isnan(triggerDepth) &&
        triggerDepth >= targetDepths[i]) {

      samplerServo.write(30 + i*30);
      samplerTriggered[i] = true;

      logData("EVENT", i+1,
              triggerDepth,
              realDepth,
              realTemp,
              turb);

      if (i == sampleCount-1) {
        valveOpen();
      }
    }
  }

  if (valveIsOpen &&
      (now - valveOpenStartMs >= VALVE_OPEN_DURATION_MS)) {
    valveClose();
  }

  if (now - lastLogMs >= 1000) {
    lastLogMs = now;

    logData("DATA", -1,
            triggerDepth,
            realDepth,
            realTemp,
            turb);
  }

  bool allDone = true;
  for (int i=0;i<sampleCount;i++)
    if (!samplerTriggered[i]) allDone = false;

  if (allDone && !valveIsOpen) {
    Serial.println("MISSION COMPLETE");
    state = DONE;
  }
}

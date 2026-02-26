#include <Wire.h>
#include "MS5837.h"
#include <ESP32Servo.h>
#include <TinyGPSPlus.h>
#include <HardwareSerial.h>
#include <SPI.h>
#include <SD.h>

// ================= PIN =================
static const int I2C_SDA   = 41;
static const int I2C_SCL   = 42;
static const int TURB_PIN  = 4;
static const int GPS_RX    = 47;
static const int GPS_TX    = 48;
static const int RELAY_PIN = 26;
static const int SERVO_PIN = 19;

// ================= SD =================
static const int SD_SCK  = 21;
static const int SD_MOSI = 20;
static const int SD_MISO = 37;
static const int SD_CS   = 5;

SPIClass sdSPI(SPI);
bool sdOk = false;
String missionFile = "";

// ================= OBJECTS =================
MS5837 ms;
Servo samplerServo;
TinyGPSPlus gps;
HardwareSerial GPSSerial(1);

// ================= SETTINGS =================
static const bool RELAY_ACTIVE_LOW = false;
static const unsigned long VALVE_OPEN_DURATION_MS = 20000;
static const unsigned long SAMPLE_INTERVAL_MS = 5000;
static const unsigned long LOG_INTERVAL_MS = 1000;

static const int SERVO_STOP = 90;
static const int SERVO_FORWARD = 180;
static const unsigned long FULL_720_TIME = 2700;  // 720° = 2700ms

#define MAX_SAMPLES 5

// ================= STATE =================
enum State {
  SELECT_MODE,
  ENTER_SAMPLE_COUNT,
  ENTER_DEPTHS,
  READY,
  RUNNING,
  DONE
};

State state = SELECT_MODE;

bool airMode = true;
int sampleCount = 0;
int depthIndex = 0;
float targetDepths[MAX_SAMPLES];
bool triggered[MAX_SAMPLES];

unsigned long seqStartMs = 0;
unsigned long valveOpenStartMs = 0;
unsigned long lastLogMs = 0;

bool valveIsOpen = false;
float maxDepthReached = 0;

// ================= SD FUNCTIONS =================
String getNextMissionFile() {
  int num = 1;
  while (true) {
    char name[32];
    sprintf(name, "/mission_%03d.csv", num);
    if (!SD.exists(name)) return String(name);
    num++;
  }
}

void logToSD(String timeStr, float depth, float temp, float turb) {
  if (!sdOk) return;

  File f = SD.open(missionFile, FILE_APPEND);
  if (!f) return;

  f.print(timeStr); f.print(",");
  f.print(airMode ? "AIR" : "REAL"); f.print(",");
  f.print(depth, 2); f.print(",");
  f.print(temp, 2); f.print(",");
  f.print(turb, 2); f.print(",");

  if (gps.location.isValid()) {
    f.print(gps.location.lat(), 6); f.print(",");
    f.print(gps.location.lng(), 6);
  } else {
    f.print("NA,NA");
  }

  f.print(",");
  f.print(valveIsOpen ? "OPEN" : "CLOSED");
  f.println();

  f.close();
}

// ================= RELAY =================
void relayOn()  { digitalWrite(RELAY_PIN, RELAY_ACTIVE_LOW ? LOW : HIGH); }
void relayOff() { digitalWrite(RELAY_PIN, RELAY_ACTIVE_LOW ? HIGH : LOW); }

void valveOpen() {
  relayOff();
  valveIsOpen = true;
  valveOpenStartMs = millis();
}

void valveClose() {
  relayOn();
  valveIsOpen = false;
}

// ================= GPS TIME =================
String getSeattleTimeFromGPS() {

  if (!gps.time.isValid() || !gps.date.isValid())
    return "NO_TIME";

  int hour = gps.time.hour() - 8;
  if (hour < 0) hour += 24;

  char buffer[30];
  sprintf(buffer, "%04d-%02d-%02d %02d:%02d:%02d",
          gps.date.year(),
          gps.date.month(),
          gps.date.day(),
          hour,
          gps.time.minute(),
          gps.time.second());

  return String(buffer);
}

// ================= INPUT =================
String readLine() {
  while (true) {
    if (Serial.available()) {
      String s = Serial.readStringUntil('\n');
      s.trim();
      if (s.length() > 0) return s;
    }
    delay(10);
  }
}

// ================= SETUP =================
void setup() {

  Serial.begin(115200);
  delay(1000);

  Serial.println("\n=================================");
  Serial.println("       AquaCast System Start     ");
  Serial.println("=================================");

  pinMode(RELAY_PIN, OUTPUT);
  valveClose();

  samplerServo.setPeriodHertz(50);
  samplerServo.attach(SERVO_PIN, 500, 2500);
  samplerServo.write(SERVO_STOP);

  Wire.begin(I2C_SDA, I2C_SCL);
  ms.init();
  ms.setModel(MS5837::MS5837_30BA);
  ms.setFluidDensity(997);

  GPSSerial.begin(9600, SERIAL_8N1, GPS_RX, GPS_TX);

  sdSPI.begin(SD_SCK, SD_MISO, SD_MOSI, SD_CS);

  if (SD.begin(SD_CS, sdSPI)) {
    sdOk = true;
    missionFile = getNextMissionFile();
    File f = SD.open(missionFile, FILE_WRITE);
    if (f) {
      f.println("time,mode,depth,temp,turb,gps_lat,gps_lng,valve");
      f.close();
    }
    Serial.print("SD Ready. File: ");
    Serial.println(missionFile);
  } else {
    Serial.println("SD Mount Failed");
  }

  Serial.println("\nSelect Mode:");
  Serial.println("Type AIR  for Air Test");
  Serial.println("Type REAL for Real Water\n");
}

// ================= LOOP =================
void loop() {

  unsigned long now = millis();

  while (GPSSerial.available())
    gps.encode(GPSSerial.read());

  if (state == SELECT_MODE) {

    String input = readLine();

    if (input.equalsIgnoreCase("AIR")) {
      airMode = true;
      Serial.println("Air Test Mode Selected");
    }
    else if (input.equalsIgnoreCase("REAL")) {
      airMode = false;
      Serial.println("Real Water Mode Selected");
    }
    else {
      Serial.println("Please type AIR or REAL.");
      return;
    }

    Serial.println("---------------------------------");
    Serial.println("Enter number of samples (1-5):");
    state = ENTER_SAMPLE_COUNT;
  }

  else if (state == ENTER_SAMPLE_COUNT) {

    String input = readLine();
    sampleCount = input.toInt();

    if (sampleCount < 1 || sampleCount > 5) {
      Serial.println("Invalid number. Enter 1-5.");
      return;
    }

    Serial.print("Sample Count: ");
    Serial.println(sampleCount);

    depthIndex = 0;
    state = ENTER_DEPTHS;
    Serial.print("Enter depth for Sample 1 (m): ");
  }

  else if (state == ENTER_DEPTHS) {

    String input = readLine();
    targetDepths[depthIndex] = input.toFloat();
    triggered[depthIndex] = false;

    Serial.print("Depth ");
    Serial.print(depthIndex + 1);
    Serial.print(" set to ");
    Serial.println(targetDepths[depthIndex]);

    depthIndex++;

    if (depthIndex >= sampleCount) {
      Serial.println("---------------------------------");
      Serial.println("Press S to start the mission");
      state = READY;
    }
    else {
      Serial.print("Enter depth for Sample ");
      Serial.print(depthIndex + 1);
      Serial.print(" (m): ");
    }
  }

  else if (state == READY) {

    String input = readLine();

    if (input.equalsIgnoreCase("S")) {

      Serial.println("\n========== SD CARD CHECK ==========");
      if (sdOk) {
        Serial.print("SD Status: OK | Logging to ");
        Serial.println(missionFile);
      } else {
        Serial.println("SD Status: NOT DETECTED");
      }
      Serial.println("====================================\n");

      state = RUNNING;
      seqStartMs = millis();
      Serial.println("MISSION STARTED");
    }
  }

  else if (state == RUNNING) {

    // ===== UPDATED MOTOR LOGIC (NON-ACCUMULATED) =====
    for (int i = 0; i < sampleCount; i++) {

      if (!triggered[i]) {

        bool trigger = false;

        if (airMode) {
          if (millis() - seqStartMs >= targetDepths[i] * SAMPLE_INTERVAL_MS)
            trigger = true;
        } else {
          ms.read();
          if (ms.depth() >= targetDepths[i])
            trigger = true;
        }

        if (trigger) {

          float ratio = targetDepths[i] / 5.0;
          unsigned long rotateTime = FULL_720_TIME * ratio;

          Serial.print("\n>>> Sample ");
          Serial.print(i + 1);
          Serial.print(" Triggered -> Rotating to ");
          Serial.print(2.0 * ratio * 360.0);
          Serial.println(" degrees");

          samplerServo.write(SERVO_FORWARD);
          delay(rotateTime);
          samplerServo.write(SERVO_STOP);

          triggered[i] = true;

          if (i == sampleCount - 1) {
            maxDepthReached = targetDepths[i];
            Serial.println(">>> Opening Air Valve (20s)");
            valveOpen();
          }
        }
      }
    }

    // ===== AUTO CLOSE VALVE =====
    if (valveIsOpen && millis() - valveOpenStartMs >= VALVE_OPEN_DURATION_MS) {

      valveClose();

      Serial.println("\n==============================");
      Serial.println("       MISSION COMPLETE       ");
      Serial.println("==============================");

      if (sdOk) {
        Serial.print("CSV File Created: ");
        Serial.println(missionFile);
        Serial.println("All data successfully saved.");
      } else {
        Serial.println("WARNING: SD Card Not Available.");
      }

      Serial.println("==============================\n");

      state = DONE;
    }

    // ===== STATUS =====
    if (now - lastLogMs >= LOG_INTERVAL_MS) {

      lastLogMs = now;

      ms.read();

      float depth;

      if (airMode) {
        if (!valveIsOpen)
          depth = (millis() - seqStartMs) / (float)SAMPLE_INTERVAL_MS;
        else {
          float ascentTime = (millis() - valveOpenStartMs) / (float)SAMPLE_INTERVAL_MS;
          depth = maxDepthReached - ascentTime;
          if (depth < 0) depth = 0;
        }
      } else {
        depth = ms.depth();
      }

      float temp = ms.temperature();
      float turb = analogRead(TURB_PIN) * 3.3 / 4095.0;

      Serial.print("[STATUS] ");
      Serial.print(getSeattleTimeFromGPS());
      Serial.print(" | Mode=");
      Serial.print(airMode ? "AIR" : "REAL");
      Serial.print(" | Depth=");
      Serial.print(depth, 2);
      Serial.print(" | Temp=");
      Serial.print(temp, 2);
      Serial.print(" | Turb=");
      Serial.print(turb, 2);
      Serial.print(" | GPS=");

      if (gps.location.isValid()) {
        Serial.print(gps.location.lat(), 6);
        Serial.print(",");
        Serial.print(gps.location.lng(), 6);
      } else {
        Serial.print("NO FIX");
      }

      Serial.print(" | Valve=");
      Serial.println(valveIsOpen ? "OPEN" : "CLOSED");

      logToSD(getSeattleTimeFromGPS(), depth, temp, turb);
    }
  }
}
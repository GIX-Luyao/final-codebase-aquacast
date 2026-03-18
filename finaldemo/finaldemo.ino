#include <Wire.h>
#include "MS5837.h"
#include <ESP32Servo.h>
#include <TinyGPSPlus.h>
#include <HardwareSerial.h>
#include <SPI.h>
#include <SD.h>
#include <WiFi.h>
#include <WebServer.h>

// ================= WIFI =================
const char* ssid = "Joyce iPhone";
const char* password = "12345678";

WebServer server(80);

// ================= PIN =================
static const int I2C_SDA = 41;
static const int I2C_SCL = 42;
static const int TURB_PIN = 4;
static const int GPS_RX = 47;
static const int GPS_TX = 48;
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
static const unsigned long VALVE_OPEN_DURATION_MS = 20000;
static const unsigned long SAMPLE_INTERVAL_MS = 5000;
static const unsigned long LOG_INTERVAL_MS = 1000;

static const int SERVO_STOP = 90;
static const int SERVO_FORWARD = 180;
static const unsigned long FULL_720_TIME = 990;

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
int sampleCount = 3;
float targetDepths[MAX_SAMPLES];
bool triggered[MAX_SAMPLES];

unsigned long seqStartMs = 0;
unsigned long valveOpenStartMs = 0;
unsigned long lastLogMs = 0;

bool valveIsOpen = false;

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
  f.print(depth, 2); f.print(",");
  f.print(temp, 2); f.print(",");
  f.print(turb, 2); f.println();

  f.close();
}

String getTime() {
  return String(millis());
}

// ================= RELAY =================
void relayOn() { digitalWrite(RELAY_PIN, HIGH); }
void relayOff() { digitalWrite(RELAY_PIN, LOW); }

void valveOpen() {
  relayOff();
  valveIsOpen = true;
  valveOpenStartMs = millis();
}

void valveClose() {
  relayOn();
  valveIsOpen = false;
}

// ================= WEB =================
void setupRoutes() {

  server.on("/reset", []() {
    for (int i = 0; i < MAX_SAMPLES; i++) {
      triggered[i] = false;
    }
    valveClose();
    server.send(200, "text/plain", "RESET DONE");
  });

  server.on("/download", []() {
    File file = SD.open(missionFile);
    server.streamFile(file, "text/csv");
    file.close();
  });

  server.on("/trigger", []() {
    int id = server.arg("id").toInt();

    int angle = 240 * id;
    unsigned long rotateTime = (FULL_720_TIME * angle) / 720;

    samplerServo.write(SERVO_FORWARD);
    delay(rotateTime);
    samplerServo.write(SERVO_STOP);

    triggered[id - 1] = true;

    if (id == 3) valveOpen();

    server.send(200, "text/plain", "OK");
  });

  // ===== AIR VALVE (NEW) =====
  server.on("/valve", []() {
    valveOpen();
    server.send(200, "text/plain", "VALVE OPEN");
  });

  // ================= UI =================
  server.on("/", []() {

String html = R"rawliteral(
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1">

<style>
body {
  font-family: -apple-system, BlinkMacSystemFont;
  background: #f2f2f7;
  padding: 20px;
  color: #1c1c1e;
}

h2 {
  font-size: 28px;
  font-weight: 600;
  margin-bottom: 16px;
}

.card {
  background: white;
  border-radius: 18px;
  padding: 18px;
  margin-bottom: 16px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.06);
}

.card h3 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 10px;
  color: #6e6e73;
}

.status-text {
  font-size: 14px;
  line-height: 1.5;
}

.btn {
  width: 100%;
  padding: 14px;
  margin-top: 8px;
  border-radius: 12px;
  border: none;
  font-size: 16px;
  font-weight: 500;
}

.primary {
  background: black;
  color: white;
}

.secondary {
  background: #e5e5ea;
}

.segment {
  display: flex;
  background: #e5e5ea;
  border-radius: 12px;
  padding: 4px;
}

.segment button {
  flex: 1;
  padding: 10px;
  border-radius: 10px;
  border: none;
  background: transparent;
  font-weight: 500;
}

.segment .active {
  background: white;
}

.hidden {
  display: none;
}
</style>
</head>

<body>

<h2>AquaCast</h2>

<div class="card">
  <h3>Connected Device</h3>
  <div class="status-text">
    WiFi: connected<br>
    SD Card: <span id="file"></span>
  </div>
</div>

<div class="card">
  <h3>Mode</h3>
  <div class="segment">
    <button id="demoBtn" class="active" onclick="setMode('demo')">Demo</button>
    <button id="realBtn" onclick="setMode('real')">Real</button>
  </div>
</div>

<div id="demoUI">

<div class="card">
  <h3>Status</h3>
  <div class="status-text" id="status"></div>
</div>

<div class="card">
  <h3>Control</h3>
  <button class="btn secondary" onclick="trigger(1)">Close Sampler #1</button>
  <button class="btn secondary" onclick="trigger(2)">Close Sampler #2</button>
  <button class="btn secondary" onclick="trigger(3)">Close Sampler #3</button>
  <button class="btn secondary" onclick="openValve()">Open Air Valve</button>
  <button class="btn primary" onclick="reset()">Reset</button>
</div>

</div>

<div id="realUI" class="hidden">

<div class="card">
  <h3>Location</h3>
  <div class="status-text">
    12280 NE District Wy<br>
    Bellevue, WA
  </div>
</div>

<div class="card">
  <h3>Depth Setup</h3>
  <div class="status-text">
    Depth 1<br>
    Depth 2<br>
    Depth 3
  </div>
  <button class="btn primary">Start Mission</button>
</div>

<div class="card">
  <h3>Status</h3>
  <div class="status-text">
    Sampler 1 closed at 1m<br>
    Sampler 2 closed at 3m<br>
    Sampler 3 closed at 5m
  </div>
</div>

</div>

<script>

function setMode(m){
  document.getElementById("demoUI").classList.toggle("hidden", m!="demo");
  document.getElementById("realUI").classList.toggle("hidden", m!="real");

  document.getElementById("demoBtn").classList.toggle("active", m=="demo");
  document.getElementById("realBtn").classList.toggle("active", m=="real");
}

function trigger(i){
  fetch(`/trigger?id=${i}`);
}

function openValve(){
  fetch("/valve");
}

function reset(){
  fetch("/reset");
}

async function update(){
  let r = await fetch("/status");
  let d = await r.json();

  document.getElementById("status").innerText =
`Depth: ${d.depth}
Temp: ${d.temp}
Turb: ${d.turb}

WiFi: ${d.wifi}
SD: ${d.sd}`;

  document.getElementById("file").innerText = d.file;
}

setInterval(update,1000);

</script>
</body>
</html>
)rawliteral";

    server.send(200, "text/html", html);
  });

  server.on("/status", []() {

    ms.read();

    float depth = ms.depth();
    float temp = ms.temperature();
    float turb = analogRead(TURB_PIN) * 3.3 / 4095.0;

    String json = "{";
    json += "\"depth\":" + String(depth,2) + ",";
    json += "\"temp\":" + String(temp,2) + ",";
    json += "\"turb\":" + String(turb,2) + ",";
    json += "\"wifi\":\"connected\",";
    json += "\"sd\":\"logging\",";
    json += "\"file\":\"" + missionFile + "\"";
    json += "}";

    server.send(200, "application/json", json);
  });
}

// ================= SETUP =================
void setup() {

  Serial.begin(115200);

  pinMode(RELAY_PIN, OUTPUT);
  valveClose();

  samplerServo.attach(SERVO_PIN);
  samplerServo.write(SERVO_STOP);

  Wire.begin(I2C_SDA, I2C_SCL);
  ms.init();

  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) delay(500);

  sdSPI.begin(SD_SCK, SD_MISO, SD_MOSI, SD_CS);
  SD.begin(SD_CS, sdSPI);

  missionFile = getNextMissionFile();
  File f = SD.open(missionFile, FILE_WRITE);
  f.println("time,depth,temp,turb");
  f.close();

  setupRoutes();
  server.begin();
}

// ================= LOOP =================
void loop() {

  server.handleClient();

  float depth = ms.depth();
  float temp = ms.temperature();
  float turb = analogRead(TURB_PIN) * 3.3 / 4095.0;

  unsigned long now = millis();
  if (now - lastLogMs >= LOG_INTERVAL_MS) {
    lastLogMs = now;
    logToSD(getTime(), depth, temp, turb);
  }

  // ===== AUTO CLOSE VALVE AFTER 15s =====
  if (valveIsOpen && millis() - valveOpenStartMs >= 15000) {
    valveClose();
  }
}
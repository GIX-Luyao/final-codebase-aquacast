#include <HardwareSerial.h>
#include <TinyGPSPlus.h>

TinyGPSPlus gps;

// XIAO ESP32S3: use Serial1
// We will use:
//   GPS TX -> XIAO D7  (GPIO44)  <-- ESP RX
//   (GPS RX optional)  XIAO D6  (GPIO43)  <-- ESP TX (not required)
HardwareSerial GPSSerial(1);

static const int GPS_RX_GPIO = 44; // D7
static const int GPS_TX_GPIO = 43; // D6 (optional, can be left unconnected)

unsigned long lastPrint = 0;

void setup() {
  Serial.begin(115200);
  delay(800);

  Serial.println();
  Serial.println("=== XIAO ESP32S3 + GPS TEST ===");
  Serial.println("Wiring: GPS VCC->5V, GND->GND, TX->D7");

  // GPS default baud is usually 9600
  GPSSerial.begin(9600, SERIAL_8N1, GPS_RX_GPIO, GPS_TX_GPIO);

  Serial.print("GPS UART started @9600, RX=");
  Serial.print(GPS_RX_GPIO);
  Serial.print(" (D7), TX=");
  Serial.print(GPS_TX_GPIO);
  Serial.println(" (D6, optional)");
}

void loop() {
  // Read GPS bytes
  while (GPSSerial.available()) {
    gps.encode(GPSSerial.read());
  }

  // Print once per second
  if (millis() - lastPrint >= 1000) {
    lastPrint = millis();

    Serial.print("chars=");
    Serial.print(gps.charsProcessed());

    Serial.print(" | Fix=");
    Serial.print(gps.location.isValid() ? "YES" : "NO");

    Serial.print(" | Sats=");
    Serial.print(gps.satellites.isValid() ? gps.satellites.value() : 0);

    Serial.print(" | Lat=");
    if (gps.location.isValid()) Serial.print(gps.location.lat(), 6);
    else Serial.print("N/A");

    Serial.print(" | Lng=");
    if (gps.location.isValid()) Serial.println(gps.location.lng(), 6);
    else Serial.println("N/A");
  }
}

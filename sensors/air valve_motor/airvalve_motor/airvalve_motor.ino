#include <ESP32Servo.h>

const int RELAY_PIN = 26;
const int SERVO_PIN = 19;

Servo samplerServo;

bool running = false;
bool motorTriggered = false;
unsigned long valveStartTime = 0;

void setup() {
  Serial.begin(115200);

  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, LOW); // valve OFF

  samplerServo.setPeriodHertz(50);
  samplerServo.attach(SERVO_PIN, 500, 2500);
  samplerServo.write(0); // safe position

  Serial.println("Ready. Type 't' to trigger valve->3s->motor.");
}

void loop() {
  // manual trigger
  if (Serial.available()) {
    char c = Serial.read();
    if (c == 't' && !running) {
      Serial.println("Trigger: Valve ON");
      digitalWrite(RELAY_PIN, HIGH);
      valveStartTime = millis();
      running = true;
      motorTriggered = false;
    }
    if (c == 'o') {
      Serial.println("Valve OFF");
      digitalWrite(RELAY_PIN, LOW);
      running = false;
      motorTriggered = false;
    }
  }

  // 3-second protection delay
  if (running && !motorTriggered && millis() - valveStartTime >= 3000) {
    Serial.println("Motor ON (after 3s)");
    samplerServo.write(90);      // close sampler (adjust angle)
    motorTriggered = true;
  }
}

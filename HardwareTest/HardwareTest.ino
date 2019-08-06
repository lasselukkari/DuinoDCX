/*
  Link the male RS232 connector pins 2 and 3 with a standard jumper cable. It is
  important that you test the whole connection chain including any possible
  cables or adatpers as they may change the outcome.

  Optionally link the pins 7 and 8 to verify that the flow control is working.

  If you see errors with the RX/TX line your setup can not work.
  If you see errors with the RTS/CTS line do not enable hardware flow control.
*/

int txPin = 17;
int rxPin = 16;

int rtsPin = 21;
int ctsPin = 22;

void setup() {
  Serial.begin(115200);
  pinMode(txPin, OUTPUT);
  pinMode(rxPin, INPUT);
  pinMode(rtsPin, OUTPUT);
  pinMode(ctsPin, INPUT);
}

void loop() {
  delay(1000);
  digitalWrite(txPin, LOW);
  if (!digitalRead(rxPin)) {
    Serial.println("RX/TX circuit LOW: ERROR");
  } else {
    Serial.println("RX/TX circuit LOW: OK");
  }

  delay(1000);
  digitalWrite(txPin, HIGH);
  if (digitalRead(rxPin)) {
    Serial.println("RX/TX circuit HIGH: ERROR");
  } else {
    Serial.println("RX/TX circuit HIGH: OK");
  }

  delay(1000);
  digitalWrite(rtsPin, LOW);
  if (!digitalRead(ctsPin)) {
    Serial.println("RTS/CTS circuit LOW: ERROR");
  } else {
    Serial.println("RTS/CTS circuit LOW: OK");
  }

  delay(1000);
  digitalWrite(rtsPin, HIGH);
  if (digitalRead(ctsPin)) {
    Serial.println("RTS/CTSX circuit HIGH: ERROR");
  } else {
    Serial.println("RTS/CTS circuit HIGH: OK");
  }
}

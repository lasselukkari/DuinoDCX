// Link the male RS232 connector pins 2 (RXD) and 3 (TXD) with a standard jumper 
// cable. It is important that you test the whole connection chain including 
// any possible cables or adatpers as they may change the outcome.

// The serial port logging verifies that the loop is working properly but the
// polarity of the signals may still be wrong. Set your multimeter to 20V DC 
// and take a measurement between the RS232 pins 5 (GND) and 3 (TXD). The 
// reading should fluctuate between -5V and 5V. If you instead get the expected
// result between the 5 (GND) and 2 (RXD) the polarity is the wrong way around.
  
int txPin = 17;
int rxPin = 16;

void setup() {
  Serial.begin(115200);
  pinMode(txPin, OUTPUT);
  pinMode(rxPin, INPUT_PULLUP);
}

void loop() {
  digitalWrite(txPin, LOW);
  delay(1000);
  
  if(digitalRead(rxPin)) {
    Serial.println("Error");
  } else {
    Serial.println("OK");
  }
  
  digitalWrite(txPin, HIGH);
  delay(1000);
}

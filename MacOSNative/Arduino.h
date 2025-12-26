/*
  Arduino.h - Arduino compatibility layer for macOS

  This file provides the necessary shims to use the ArduinoCore-API
  on macOS/POSIX systems. It includes the official Arduino headers
  and provides platform-specific implementations.
*/

#ifndef ARDUINO_H_
#define ARDUINO_H_

// Include system headers FIRST using full path to avoid String.h conflict
#include <stdio.h>
#include <stdlib.h>
#include <sys/time.h>

#include "/Library/Developer/CommandLineTools/SDKs/MacOSX.sdk/usr/include/string.h"

// Define HOST to avoid Arduino's main() weak declaration
#define HOST

#ifdef __cplusplus
extern "C" {
#endif

// Platform-specific implementations (declared extern "C" to match Common.h)

// millis() - returns milliseconds since program start
unsigned long millis(void);

// micros() - returns microseconds since program start
unsigned long micros(void);

// delay() - delay in milliseconds
void delay(unsigned long ms);

// yield() - allow other processes to run
void yield(void);

// itoa family - integer to ASCII conversion
char *itoa(int value, char *buffer, int base);
char *ltoa(long value, char *buffer, int base);
char *utoa(unsigned value, char *buffer, int base);
char *ultoa(unsigned long value, char *buffer, int base);

#ifdef __cplusplus
}
#endif

// Now include the Arduino Core API headers (order matters!)
#include "Client.h"
#include "Common.h"
#include "IPAddress.h"
#include "Print.h"
#include "Printable.h"
#include "Stream.h"
#include "WString.h" // String class - must come first

// Bring Arduino classes into global namespace for aWOT compatibility
using arduino::Client;
using arduino::IPAddress;
using arduino::Print;
using arduino::Stream;

// Undefine system INADDR_NONE to avoid conflict with arduino::INADDR_NONE
#ifdef INADDR_NONE
#undef INADDR_NONE
#endif

// HardwareSerial stub class (for Ultradrive which uses HardwareSerial*)
class HardwareSerial : public Stream {
public:
  virtual void begin(unsigned long) {}
  virtual void end() {}
  virtual void setPins(int, int) {}
  virtual size_t write(uint8_t) override { return 0; }
  virtual size_t write(const uint8_t *, size_t) override { return 0; }
  virtual int available() override { return 0; }
  virtual int read() override { return -1; }
  virtual int peek() override { return -1; }
};

// Serial console output for macOS
class SerialClass : public Stream {
public:
  void begin(unsigned long) {}
  void end() {}

  size_t write(uint8_t c) override;
  size_t write(const uint8_t *buffer, size_t size) override;
  int available() override { return 0; }
  int read() override { return -1; }
  int peek() override { return -1; }
};

extern SerialClass Serial;

#endif

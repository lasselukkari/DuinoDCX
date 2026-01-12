/*
  MacOSSerial.h - Serial port wrapper for macOS with Arduino HardwareSerial-like
  API
*/

#ifndef MACOSSERIAL_H_
#define MACOSSERIAL_H_

#include "Arduino.h"

// Default serial port path
#define DEFAULT_SERIAL_PORT "/dev/cu.usbserial-1430"

class MacOSSerial : public HardwareSerial {
private:
  int _fd;
  const char *_devicePath;
  unsigned long _baudRate;
  bool _opened;

public:
  MacOSSerial(const char *devicePath = DEFAULT_SERIAL_PORT);
  // Arduino HardwareSerial compatibility (uses env var for port)
  MacOSSerial(int uartNum);
  ~MacOSSerial();

  // HardwareSerial-like interface
  void begin(unsigned long baudRate);
  void end();

  // Optional: for ESP32 compatibility (ignored on macOS)
  void setPins(int rxPin, int txPin) {
    (void)rxPin;
    (void)txPin;
  }

  // Stream interface implementation
  int available() override;
  int read() override;
  int peek() override;

  // Print interface implementation
  size_t write(uint8_t byte) override;
  size_t write(const uint8_t *buf, size_t size) override;

  void flush() override;

  // Check if port is open
  operator bool() const { return _opened; }

  // Get the underlying file descriptor (for debugging)
  int getFd() const { return _fd; }
};

#endif

/*
  MacOSSerial.cpp - Serial port implementation for macOS using termios
*/

#include "MacOSSerial.h"

#include <errno.h>
#include <fcntl.h>
#include <iostream>
#include <sys/ioctl.h>
#include <termios.h>
#include <unistd.h>

MacOSSerial::MacOSSerial(const char *devicePath)
    : _fd(-1), _devicePath(devicePath), _baudRate(0), _opened(false) {}

// Arduino HardwareSerial compatibility - uses env var for port path
MacOSSerial::MacOSSerial(int uartNum) : _fd(-1), _baudRate(0), _opened(false) {
  (void)uartNum; // Ignored on macOS
  const char *envPort = getenv("DUINODCX_SERIAL_PORT");
  _devicePath = envPort ? envPort : DEFAULT_SERIAL_PORT;
}

MacOSSerial::~MacOSSerial() { end(); }

void MacOSSerial::begin(unsigned long baudRate) {
  _baudRate = baudRate;

  // Open the serial port
  _fd = open(_devicePath, O_RDWR | O_NOCTTY | O_NONBLOCK);
  if (_fd < 0) {
    std::cerr << "Error opening serial port " << _devicePath << ": "
              << strerror(errno) << std::endl;
    return;
  }

  // Configure the serial port
  struct termios options;
  if (tcgetattr(_fd, &options) < 0) {
    std::cerr << "Error getting serial attributes: " << strerror(errno)
              << std::endl;
    close(_fd);
    _fd = -1;
    return;
  }

  // Set baud rate
  speed_t speed;
  switch (baudRate) {
  case 9600:
    speed = B9600;
    break;
  case 19200:
    speed = B19200;
    break;
  case 38400:
    speed = B38400;
    break;
  case 57600:
    speed = B57600;
    break;
  case 115200:
    speed = B115200;
    break;
  case 230400:
    speed = B230400;
    break;
  default:
    std::cerr << "Unsupported baud rate: " << baudRate << ", using 38400"
              << std::endl;
    speed = B38400;
    break;
  }
  cfsetispeed(&options, speed);
  cfsetospeed(&options, speed);

  // 8N1 configuration
  options.c_cflag &= ~PARENB; // No parity
  options.c_cflag &= ~CSTOPB; // 1 stop bit
  options.c_cflag &= ~CSIZE;
  options.c_cflag |= CS8; // 8 data bits

  // No hardware flow control
  options.c_cflag &= ~CRTSCTS;

  // Enable receiver, ignore modem control lines
  options.c_cflag |= CREAD | CLOCAL;

  // Raw input mode
  options.c_lflag &= ~(ICANON | ECHO | ECHOE | ECHONL | ISIG);

  // Disable software flow control
  options.c_iflag &= ~(IXON | IXOFF | IXANY);

  // No input processing
  options.c_iflag &=
      ~(IGNBRK | BRKINT | PARMRK | ISTRIP | INLCR | IGNCR | ICRNL);

  // Raw output mode
  options.c_oflag &= ~OPOST;
  options.c_oflag &= ~ONLCR;

  // Read settings: non-blocking
  options.c_cc[VMIN] = 0;
  options.c_cc[VTIME] = 0;

  // Apply settings
  if (tcsetattr(_fd, TCSANOW, &options) < 0) {
    std::cerr << "Error setting serial attributes: " << strerror(errno)
              << std::endl;
    close(_fd);
    _fd = -1;
    return;
  }

  // Flush any pending data
  tcflush(_fd, TCIOFLUSH);

  _opened = true;
  std::cout << "Serial port " << _devicePath << " opened at " << baudRate
            << " baud" << std::endl;
}

void MacOSSerial::end() {
  if (_fd >= 0) {
    close(_fd);
    _fd = -1;
  }
  _opened = false;
}

int MacOSSerial::available() {
  if (_fd < 0)
    return 0;

  int bytes = 0;
  if (ioctl(_fd, FIONREAD, &bytes) < 0) {
    return 0;
  }
  return bytes;
}

int MacOSSerial::read() {
  if (_fd < 0)
    return -1;

  uint8_t byte;
  ssize_t result = ::read(_fd, &byte, 1);
  if (result <= 0) {
    return -1;
  }
  return byte;
}

int MacOSSerial::peek() {
  if (_fd < 0)
    return -1;

  // Check if data available first
  if (available() <= 0)
    return -1;

  // Save current position, read a byte, then seek back
  // Note: This is a simplified implementation - for proper peek on a serial
  // port, we'd need to buffer the byte ourselves
  uint8_t byte;
  ssize_t result = ::read(_fd, &byte, 1);
  if (result <= 0) {
    return -1;
  }

  // For serial ports we can't seek back, so we need a buffer
  // For now, this won't work correctly if bytes are actually peeked
  // The Ultradrive code doesn't seem to use peek() extensively
  return byte;
}

size_t MacOSSerial::write(uint8_t byte) { return write(&byte, 1); }

size_t MacOSSerial::write(const uint8_t *buf, size_t size) {
  if (_fd < 0)
    return 0;

  ssize_t result = ::write(_fd, buf, size);
  if (result < 0) {
    if (errno == EAGAIN || errno == EWOULDBLOCK) {
      return 0;
    }
    std::cerr << "Serial write error: " << strerror(errno) << std::endl;
    return 0;
  }
  return static_cast<size_t>(result);
}

void MacOSSerial::flush() {
  if (_fd >= 0) {
    tcdrain(_fd);
  }
}

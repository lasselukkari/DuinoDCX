/*
  MacOSSocket.cpp - BSD socket implementation for macOS
*/

#include "MacOSSocket.h"

#include <iostream>
#include <poll.h>
#include <sys/ioctl.h>

// ============================================================================
// SerialClass implementation (from Arduino.h)
// ============================================================================

SerialClass Serial;

size_t SerialClass::write(uint8_t c) {
  std::cout << (char)c;
  return 1;
}

size_t SerialClass::write(const uint8_t *buffer, size_t size) {
  std::cout.write((const char *)buffer, size);
  return size;
}

// ============================================================================
// Platform function implementations (extern "C" from Arduino.h)
// ============================================================================

extern "C" {

unsigned long millis(void) {
  static unsigned long start = 0;
  struct timeval tv;
  gettimeofday(&tv, NULL);
  unsigned long now = (tv.tv_sec * 1000) + (tv.tv_usec / 1000);
  if (start == 0)
    start = now;
  return now - start;
}

unsigned long micros(void) {
  static unsigned long start = 0;
  struct timeval tv;
  gettimeofday(&tv, NULL);
  unsigned long now = (tv.tv_sec * 1000000) + tv.tv_usec;
  if (start == 0)
    start = now;
  return now - start;
}

void delay(unsigned long ms) {
  unsigned long start_time = millis();
  while (millis() - start_time < ms)
    ;
}

void yield(void) {
  // No-op on macOS
}

char *itoa(int value, char *buffer, int base) {
  if (base == 10) {
    snprintf(buffer, 32, "%d", value);
  } else if (base == 16) {
    snprintf(buffer, 32, "%x", (unsigned)value);
  } else if (base == 8) {
    snprintf(buffer, 32, "%o", (unsigned)value);
  } else {
    snprintf(buffer, 32, "%d", value);
  }
  return buffer;
}

char *ltoa(long value, char *buffer, int base) {
  if (base == 10) {
    snprintf(buffer, 32, "%ld", value);
  } else if (base == 16) {
    snprintf(buffer, 32, "%lx", (unsigned long)value);
  } else {
    snprintf(buffer, 32, "%ld", value);
  }
  return buffer;
}

char *utoa(unsigned value, char *buffer, int base) {
  if (base == 10) {
    snprintf(buffer, 32, "%u", value);
  } else if (base == 16) {
    snprintf(buffer, 32, "%x", value);
  } else {
    snprintf(buffer, 32, "%u", value);
  }
  return buffer;
}

char *ultoa(unsigned long value, char *buffer, int base) {
  if (base == 10) {
    snprintf(buffer, 32, "%lu", value);
  } else if (base == 16) {
    snprintf(buffer, 32, "%lx", value);
  } else {
    snprintf(buffer, 32, "%lu", value);
  }
  return buffer;
}

char *dtostrf(double value, signed char width, unsigned char precision,
              char *buffer) {
  snprintf(buffer, 32, "%*.*f", width, precision, value);
  return buffer;
}

// GPIO stubs (no-op on macOS, used by Ultradrive for flow control)
void pinMode(pin_size_t pinNumber, PinMode mode) {
  (void)pinNumber;
  (void)mode;
}

void digitalWrite(pin_size_t pinNumber, PinStatus status) {
  (void)pinNumber;
  (void)status;
}

PinStatus digitalRead(pin_size_t pinNumber) {
  (void)pinNumber;
  return HIGH; // Always return HIGH (CTS ready) for flow control
}

} // extern "C"

// ============================================================================
// MacOSClient implementation
// ============================================================================

int MacOSClient::connect(IPAddress ip, uint16_t port) {
  // Clean up any existing connection
  if (_state) {
    _state->release();
    _state = nullptr;
  }

  int sock = socket(AF_INET, SOCK_STREAM, 0);
  if (sock < 0) {
    return 0;
  }

  struct sockaddr_in addr;
  memset(&addr, 0, sizeof(addr));
  addr.sin_family = AF_INET;
  addr.sin_port = htons(port);
  addr.sin_addr.s_addr = htonl((uint32_t)ip);

  if (::connect(sock, (struct sockaddr *)&addr, sizeof(addr)) < 0) {
    close(sock);
    return 0;
  }

  _state = new SocketState(sock);
  return 1;
}

int MacOSClient::connect(const char *host, uint16_t port) {
  // Simple implementation - just try to parse as IP address
  // For a full implementation, you'd use getaddrinfo()
  struct in_addr addr;
  if (inet_aton(host, &addr)) {
    return connect(IPAddress((uint32_t)ntohl(addr.s_addr)), port);
  }
  return 0;
}

size_t MacOSClient::write(uint8_t byte) { return write(&byte, 1); }

size_t MacOSClient::write(const uint8_t *buf, size_t size) {
  if (!_state || _state->socket < 0)
    return 0;

  ssize_t result = send(_state->socket, buf, size, 0);
  if (result < 0) {
    return 0;
  }
  return (size_t)result;
}

int MacOSClient::available() {
  if (!_state || _state->socket < 0)
    return 0;

  // Use FIONREAD to get actual number of bytes available
  int bytesAvailable = 0;
  if (ioctl(_state->socket, FIONREAD, &bytesAvailable) < 0) {
    return 0;
  }
  return bytesAvailable;
}

int MacOSClient::read() {
  if (!_state || _state->socket < 0)
    return -1;

  uint8_t b;
  ssize_t result = recv(_state->socket, &b, 1, 0);
  if (result <= 0) {
    return -1;
  }
  return b;
}

int MacOSClient::read(uint8_t *buf, size_t size) {
  if (!_state || _state->socket < 0)
    return 0;

  ssize_t result = recv(_state->socket, buf, size, 0);
  if (result < 0)
    return 0;
  return (int)result;
}

int MacOSClient::peek() {
  if (!_state || _state->socket < 0)
    return -1;

  uint8_t b;
  ssize_t result = recv(_state->socket, &b, 1, MSG_PEEK);
  if (result <= 0) {
    return -1;
  }
  return b;
}

void MacOSClient::flush() {
  // Nothing to flush for sockets - data is sent immediately
}

void MacOSClient::stop() {
  if (_state) {
    if (_state->socket >= 0) {
      close(_state->socket);
      _state->socket = -1;
    }
  }
}

uint8_t MacOSClient::connected() {
  if (!_state || _state->socket < 0) {
    return 0;
  }

  // Use poll() to check socket state without consuming data
  struct pollfd pfd;
  pfd.fd = _state->socket;
  pfd.events = POLLIN;
  pfd.revents = 0;

  int ret = poll(&pfd, 1, 0); // non-blocking poll

  if (ret < 0) {
    // Poll error
    return 0;
  }

  // Check for errors first (but NOT POLLHUP with data available)
  if (pfd.revents & (POLLERR | POLLNVAL)) {
    // Actual socket error
    return 0;
  }

  // If there's data available, connection is still usable (even with POLLHUP)
  if (pfd.revents & POLLIN) {
    // Data available - check if it's EOF (peer closed) with MSG_PEEK
    uint8_t buf;
    int result = recv(_state->socket, &buf, 1, MSG_PEEK | MSG_DONTWAIT);
    if (result == 0) {
      // recv returned 0 = peer closed AND no more data
      return 0;
    }
    // result > 0 means data available - connection still usable
    // result < 0 with EAGAIN is fine (no data right now)
    return 1;
  }

  // No data available - now check if POLLHUP alone
  if (pfd.revents & POLLHUP) {
    // Connection closed with no pending data
    return 0;
  }

  // Socket appears connected (no flags = idle but connected)
  return 1;
}

// ============================================================================
// MacOSServer implementation
// ============================================================================

bool MacOSServer::begin() {
  _socket = socket(AF_INET, SOCK_STREAM, 0);
  if (_socket < 0) {
    Serial.println("Error creating socket");
    return false;
  }

  // Allow address reuse for quick restarts
  int opt = 1;
  setsockopt(_socket, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt));

  struct sockaddr_in addr;
  memset(&addr, 0, sizeof(addr));
  addr.sin_family = AF_INET;
  addr.sin_addr.s_addr = INADDR_ANY;
  addr.sin_port = htons(_port);

  if (bind(_socket, (struct sockaddr *)&addr, sizeof(addr)) < 0) {
    Serial.println("Error binding socket");
    close(_socket);
    _socket = -1;
    return false;
  }

  if (listen(_socket, 5) < 0) {
    Serial.println("Error listening on socket");
    close(_socket);
    _socket = -1;
    return false;
  }

  // Set non-blocking for accept
  int flags = fcntl(_socket, F_GETFL, 0);
  fcntl(_socket, F_SETFL, flags | O_NONBLOCK);

  return true;
}

MacOSClient MacOSServer::available() {
  if (_socket < 0) {
    return MacOSClient();
  }

  struct sockaddr_in clientAddr;
  socklen_t clientLen = sizeof(clientAddr);

  int clientSocket =
      accept(_socket, (struct sockaddr *)&clientAddr, &clientLen);

  if (clientSocket < 0) {
    if (errno == EAGAIN || errno == EWOULDBLOCK) {
      // No connection waiting, return empty client
      return MacOSClient();
    }
    // Real error
    return MacOSClient();
  }

  // Set client socket to blocking mode
  int flags = fcntl(clientSocket, F_GETFL, 0);
  fcntl(clientSocket, F_SETFL, flags & ~O_NONBLOCK);

  return MacOSClient(clientSocket);
}

/*
  MacOSSocket.h - BSD socket wrapper for macOS with Arduino Client/Server API
*/

#ifndef MACOSSOCKET_H_
#define MACOSSOCKET_H_

#include <arpa/inet.h>
#include <errno.h>
#include <fcntl.h>
#include <netinet/in.h>
#include <sys/select.h>
#include <sys/socket.h>
#include <unistd.h>

// Undef system macro to avoid conflict with arduino::INADDR_NONE
#ifdef INADDR_NONE
#undef INADDR_NONE
#endif

#include "Arduino.h"
#include "Client.h"

// Reference-counted socket state - enables copy semantics like WiFiClient
struct SocketState {
  int socket;
  int refCount;

  SocketState(int s) : socket(s), refCount(1) {}

  void addRef() { ++refCount; }

  void release() {
    if (--refCount == 0) {
      if (socket >= 0) {
        close(socket);
      }
      delete this;
    }
  }
};

class MacOSClient : public Client {
private:
  SocketState *_state;

  void attach(SocketState *state) {
    _state = state;
    if (_state)
      _state->addRef();
  }

  void detach() {
    if (_state) {
      _state->release();
      _state = nullptr;
    }
  }

public:
  // Default constructor - no socket
  MacOSClient() : _state(nullptr) {}

  // Constructor from socket fd - takes ownership
  MacOSClient(int socket)
      : _state(socket >= 0 ? new SocketState(socket) : nullptr) {}

  // Copy constructor - share socket (like WiFiClient)
  MacOSClient(const MacOSClient &other) : _state(nullptr) {
    attach(other._state);
  }

  // Copy assignment - share socket
  MacOSClient &operator=(const MacOSClient &other) {
    if (this != &other) {
      detach();
      attach(other._state);
    }
    return *this;
  }

  // Move constructor
  MacOSClient(MacOSClient &&other) noexcept : _state(other._state) {
    other._state = nullptr;
  }

  // Move assignment
  MacOSClient &operator=(MacOSClient &&other) noexcept {
    if (this != &other) {
      detach();
      _state = other._state;
      other._state = nullptr;
    }
    return *this;
  }

  // Destructor - release reference
  ~MacOSClient() { detach(); }

  // Client interface implementation
  int connect(IPAddress ip, uint16_t port) override;
  int connect(const char *host, uint16_t port) override;
  size_t write(uint8_t byte) override;
  size_t write(const uint8_t *buf, size_t size) override;
  int available() override;
  int read() override;
  int read(uint8_t *buf, size_t size) override;
  int peek() override;
  void flush() override;
  void stop() override;
  uint8_t connected() override;
  operator bool() override { return _state && _state->socket >= 0; }

  // Get the underlying socket
  int getSocket() const { return _state ? _state->socket : -1; }
};

class MacOSServer {
private:
  uint16_t _port;
  int _socket;

public:
  MacOSServer(uint16_t port) : _port(port), _socket(-1) {}

  bool begin();
  MacOSClient available();

  uint16_t port() const { return _port; }
};

#endif

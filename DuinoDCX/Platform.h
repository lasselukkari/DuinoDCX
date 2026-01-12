/*
  Platform.h - Platform abstraction for DuinoDCX

  This header detects the target platform and includes the appropriate
  platform-specific types and functions. This allows the same DuinoDCX.ino
  to compile for both ESP32 Arduino and macOS/Linux native.
*/

#ifndef PLATFORM_H
#define PLATFORM_H

// ============================================================================
// Platform Detection
// ============================================================================

#if defined(ESP32) || defined(ESP8266)
#define PLATFORM_ARDUINO
#elif defined(__APPLE__) || defined(__linux__)
#define PLATFORM_NATIVE
#else
#error "Unsupported platform - define ESP32, ESP8266, __APPLE__, or __linux__"
#endif

// ============================================================================
// Platform-Specific Includes and Type Aliases
// ============================================================================

#ifdef PLATFORM_ARDUINO
// ESP32 Arduino platform
#include <ESPmDNS.h>
#include <Preferences.h>
#include <Update.h>
#include <WiFi.h>
#include <esp_wifi.h>

// Type aliases for platform abstraction
typedef WiFiServer PlatformServer;
typedef WiFiClient PlatformClient;
typedef HardwareSerial PlatformSerial;

// HTTP port
#define HTTP_PORT 80

#endif // PLATFORM_ARDUINO

#ifdef PLATFORM_NATIVE
// macOS/Linux native platform
#include "MacOSSerial.h"
#include "MacOSSocket.h"
#include <csignal>
#include <cstring>
#include <fstream>
#include <iostream>
#include <map>
#include <sstream>
#include <string>
#include <sys/stat.h>
#include <unistd.h>

// Type aliases matching Arduino API
typedef MacOSServer PlatformServer;
typedef MacOSClient PlatformClient;
typedef MacOSSerial PlatformSerial;

// HTTP port (different from Arduino to avoid needing sudo)
#define HTTP_PORT 3000

// Signal handling for graceful shutdown
extern volatile bool shouldExit;
void setupSignalHandlers();

// Update stub - OTA doesn't make sense on desktop, but handler can be shared
class UpdateClass {
public:
  bool begin(size_t size) {
    (void)size;
    _finished = false;
    return true;
  }

  template <typename T> size_t writeStream(T &stream) {
    // Consume all data from stream (simulating successful write)
    size_t total = 0;
    while (stream.available()) {
      uint8_t buf[256];
      int n = stream.read(buf, sizeof(buf));
      if (n > 0)
        total += n;
    }
    return total;
  }

  bool end() {
    _finished = true;
    return true;
  }

  bool isFinished() { return _finished; }

private:
  bool _finished = false;
};

// Global Update instance (matches ESP32 convention)
static UpdateClass Update;

// WiFi status constants
#define WL_CONNECTED 3
#define WL_DISCONNECTED 6

// WiFi stub - desktop has no WiFi but handlers can be shared
class WiFiClass {
public:
  int scanNetworks() { return 0; } // No networks on desktop

  String SSID(int i) {
    (void)i;
    return String("");
  }

  String SSID() { return String("localhost"); }

  IPAddress localIP() { return IPAddress(127, 0, 0, 1); }

  bool disconnect(bool wifiOff = false, bool eraseAp = false) {
    (void)wifiOff;
    (void)eraseAp;
    return true;
  }

  void begin(const char *ssid = nullptr, const char *password = nullptr) {
    (void)ssid;
    (void)password;
    // No-op on desktop
  }

  int status() { return WL_CONNECTED; } // Always "connected" on desktop

  void softAP(const char *ssid, const char *password = nullptr) {
    (void)ssid;
    (void)password;
  }
};

// Global WiFi instance
static WiFiClass WiFi;

// ESP stub - ESP-specific functions
class ESPClass {
public:
  void restart() {
    extern volatile bool shouldExit;
    shouldExit = true; // Trigger graceful exit instead of restart
  }
};

// Global ESP instance
static ESPClass ESP;

// MDNS stub - mDNS hostname not implemented on macOS (use localhost:3000)
class MDNSClass {
public:
  bool begin(const char *hostname) {
    (void)hostname;
    return true;
  }
  void addService(const char *service, const char *proto, uint16_t port) {
    (void)service;
    (void)proto;
    (void)port;
  }
};

// Global MDNS instance
static MDNSClass MDNS;

// File-based Preferences implementation matching ESP32 API
class Preferences {
public:
  Preferences() : _opened(false) {}

  bool begin(const char *name, bool readOnly = false) {
    _namespace = name;
    _readOnly = readOnly;
    _opened = true;

    // Create preferences directory if needed
    const char *home = getenv("HOME");
    if (home) {
      _filePath = std::string(home) + "/.duinodcx";
      mkdir(_filePath.c_str(), 0755);
      _filePath += "/preferences_" + _namespace + ".txt";
    } else {
      _filePath = "/tmp/duinodcx_preferences_" + _namespace + ".txt";
    }

    // Load existing preferences
    _data.clear();
    std::ifstream file(_filePath);
    if (file.is_open()) {
      std::string line;
      while (std::getline(file, line)) {
        size_t pos = line.find('=');
        if (pos != std::string::npos) {
          std::string key = line.substr(0, pos);
          std::string value = line.substr(pos + 1);
          _data[key] = value;
        }
      }
    }
    return true;
  }

  void end() {
    if (_opened && !_readOnly) {
      _save();
    }
    _opened = false;
  }

  bool clear() {
    _data.clear();
    return true;
  }

  size_t getString(const char *key, char *value, size_t maxLen) {
    auto it = _data.find(key);
    if (it == _data.end()) {
      return 0;
    }
    strncpy(value, it->second.c_str(), maxLen - 1);
    value[maxLen - 1] = '\0';
    return it->second.length();
  }

  bool getBool(const char *key, bool defaultValue = false) {
    auto it = _data.find(key);
    if (it == _data.end()) {
      return defaultValue;
    }
    return it->second == "1" || it->second == "true";
  }

  size_t putString(const char *key, const char *value) {
    _data[key] = value;
    return strlen(value);
  }

  size_t putBool(const char *key, bool value) {
    _data[key] = value ? "1" : "0";
    return 1;
  }

private:
  void _save() {
    std::ofstream file(_filePath);
    if (file.is_open()) {
      for (const auto &kv : _data) {
        file << kv.first << "=" << kv.second << "\n";
      }
    }
  }

  std::string _namespace;
  std::string _filePath;
  std::map<std::string, std::string> _data;
  bool _readOnly;
  bool _opened;
};

#endif // PLATFORM_NATIVE

#endif // PLATFORM_H

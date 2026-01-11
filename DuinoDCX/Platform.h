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
// HardwareSerial is already defined by Arduino

// HTTP port
#define HTTP_PORT 80

#endif // PLATFORM_ARDUINO

#ifdef PLATFORM_NATIVE
// macOS/Linux native platform
#include "MacOSSerial.h"
#include "MacOSSocket.h"
#include <csignal>
#include <iostream>
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

#endif // PLATFORM_NATIVE

#endif // PLATFORM_H

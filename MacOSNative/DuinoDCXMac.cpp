/*
  DuinoDCXMac.cpp - macOS native application for DuinoDCX

  This runs the DuinoDCX HTTP server and Ultradrive serial communication
  on macOS without Arduino hardware.

  Build: make
  Run:   ./DuinoDCXMac [serial-port]
         ./DuinoDCXMac /dev/cu.usbserial-1430
*/

#include "MacOSSerial.h"
#include "MacOSSocket.h"
#include "Ultradrive.h"
#include "aWOT.h"

// Define P macro for StaticFiles.h (PROGMEM compatibility)

#include "RouteHandlers.h"
#include "StaticFiles.h"
#include <csignal>
#include <iostream>
#include <thread>

// Default configuration
#define HTTP_PORT 3000
#define SERIAL_BAUD 38400

// Global instances
MacOSServer httpServer(HTTP_PORT);
MacOSSerial *ultradriveSerial = nullptr;
Ultradrive *deviceManagerPtr = nullptr;
App app;
Router apiRouter;

// Request buffers
char authBuffer[256];
unsigned long requestStart;

// SSE client sockets
struct SseClient {
  int socket;
  char clientId[40];
};

#define MAX_SSE_CLIENTS 4
SseClient sseClients[MAX_SSE_CLIENTS] = {
    {-1, ""}, {-1, ""}, {-1, ""}, {-1, ""}};

// SSE client management for macOS
void storeSseClientSocket(int socket, const char *clientId) {
  for (int i = 0; i < MAX_SSE_CLIENTS; i++) {
    if (sseClients[i].socket < 0) {
      sseClients[i].socket = socket;
      if (clientId && strlen(clientId) > 0) {
        strncpy(sseClients[i].clientId, clientId, 39);
        sseClients[i].clientId[39] = '\0';
      } else {
        sseClients[i].clientId[0] = '\0';
      }
      std::cout << "SSE client connected (slot " << i << ", socket " << socket
                << ", id " << sseClients[i].clientId << ")" << std::endl;
      break;
    }
  }
}

int countSseClients() {
  int count = 0;
  for (int i = 0; i < MAX_SSE_CLIENTS; i++) {
    if (sseClients[i].socket >= 0)
      count++;
  }
  return count;
}

void sendToSseClients(const uint8_t *data, size_t length,
                      const char *targetClientId) {
  for (int i = 0; i < MAX_SSE_CLIENTS; i++) {
    int sock = sseClients[i].socket;
    if (sock >= 0) {
      // If targetClientId is specified, check for match
      if (targetClientId && targetClientId[0] != '\0') {
        // If stored ID is empty, should we skip? Let's assume yes.
        // If stored ID doesn't match target, skip.
        if (strcmp(sseClients[i].clientId, targetClientId) != 0) {
          continue;
        }
      }

      // Build SSE message: "data: <hex>\n\n"
      std::string message;
      message.reserve(length * 2 + 8);
      message += "data: ";

      const char hexChars[] = "0123456789ABCDEF";
      for (size_t j = 0; j < length; j++) {
        message += hexChars[(data[j] >> 4) & 0xF];
        message += hexChars[data[j] & 0xF];
      }
      message += "\n\n";

      // Send chunked (transfer encoding is chunked)
      char chunkHeader[16];
      snprintf(chunkHeader, sizeof(chunkHeader), "%zx\r\n", message.size());

      ssize_t sent = send(sock, chunkHeader, strlen(chunkHeader), MSG_NOSIGNAL);
      if (sent > 0) {
        sent = send(sock, message.c_str(), message.size(), MSG_NOSIGNAL);
      }
      if (sent > 0) {
        sent = send(sock, "\r\n", 2, MSG_NOSIGNAL);
      }

      if (sent <= 0) {
        // Client disconnected
        std::cout << "SSE client disconnected (slot " << i << ")" << std::endl;
        close(sock);
        sseClients[i].socket = -1;
        sseClients[i].clientId[0] = '\0';
      }
    }
  }
}

// Signal handling
volatile bool shouldExit = false;

void signalHandler(int sig) {
  (void)sig;
  std::cout << "\nShutting down..." << std::endl;
  shouldExit = true;
}

// ============================================================================
// Request handlers (adapted from DuinoDCX.ino)
// ============================================================================

void handleSpa(Request &req, Response &res) { static_index(req, res); }

void logRequestStart(Request &req, Response &res) {
  (void)res;
  unsigned long now = millis();
  Serial.print(now);
  Serial.print(": HTTP ");

  switch (req.method()) {
  case Request::GET:
    Serial.print("GET ");
    break;
  case Request::POST:
    Serial.print("POST ");
    break;
  case Request::PUT:
    Serial.print("PUT ");
    break;
  case Request::PATCH:
    Serial.print("PATCH ");
    break;
  case Request::DELETE:
    Serial.print("DELETE ");
    break;
  default:
    break;
  }

  Serial.print(req.path());
  Serial.print(" ");
  requestStart = micros();
  req.next();
}

void logRequestEnd(Request &req, Response &res) {
  (void)req;
  float delta = (micros() - requestStart) / 1000.0;
  Serial.print(res.bytesSent());
  Serial.print(" b ");
  Serial.print(delta);
  Serial.println(" ms");
}

void getVersion(Request &req, Response &res) {
  (void)req;
  res.set("Content-Type", "application/json");
  res.print("{");
  res.print("\"version\":");
  res.print("\"macOS-native\", ");
  res.print("\"buildDate\":");
  res.print("\"");
  res.print(__DATE__);
  res.print("\"");
  res.print("}");
}

// Simple health check endpoint
void healthCheck(Request &req, Response &res) {
  (void)req;
  res.set("Content-Type", "application/json");
  res.print("{\"status\":\"ok\",\"platform\":\"macOS\"}");
}

void getNetworks(Request &req, Response &res) {
  (void)req;
  res.set("Content-Type", "application/json");
  res.print("[\"MacOS-WiFi\",\"Mock-Network\"]");
}

void getConnection(Request &req, Response &res) {
  (void)req;
  res.set("Content-Type", "application/json");
  res.print("{\"status\":\"connected\",\"ip\":\"127.0.0.1\",\"subnet\":\"255.0."
            "0.0\",\"gateway\":\"127.0.0.1\",\"mac\":\"00:00:00:00:00:00\","
            "\"current\":\"MacOS-WiFi\"}");
}

// ============================================================================
// Main functions
// ============================================================================

bool setupHttpServer() {
  // API routes
  setupApiRoutes(apiRouter);
  apiRouter.get("/version", &getVersion);
  apiRouter.get("/networks", &getNetworks);
  apiRouter.get("/connection", &getConnection);

  // Middleware and routes
  app.use(&logRequestStart);
  app.use("/api", &apiRouter);
  app.use("/", staticFiles());
  app.get(handleSpa);
  app.get("/health", &healthCheck);
  app.use(&logRequestEnd);

  return httpServer.begin();
}

void processWebServer() {
  MacOSClient client = httpServer.available();

  if (client.connected()) {
    // Get socket FD before processing (we need it for SSE)
    int socketFd = client.getSocket();

    App::ProcessResult result = app.process(&client);

    // If this was an SSE request, store socket and don't close
    if (result.responseOpen) {
      storeSseClientSocket(socketFd, pendingClientId);
      // Don't stop - let it stay open
      return;
    }
    client.stop();
  }
}

int main() {
  // Get serial port from environment variable or use default
  const char *serialPort = getenv("DUINODCX_SERIAL_PORT");
  if (!serialPort) {
    serialPort = DEFAULT_SERIAL_PORT;
  }

  // Set up signal handlers
  signal(SIGINT, signalHandler);
  signal(SIGTERM, signalHandler);

  std::cout << "DuinoDCX macOS Native" << std::endl;
  std::cout << "=====================" << std::endl;
  std::cout << "Serial port: " << serialPort << std::endl;
  std::cout << "  (set DUINODCX_SERIAL_PORT env var to change)" << std::endl;
  std::cout << "HTTP port:   " << HTTP_PORT << std::endl;
  std::cout << std::endl;

  // Initialize serial
  ultradriveSerial = new MacOSSerial(serialPort);
  ultradriveSerial->begin(SERIAL_BAUD);

  if (!(*ultradriveSerial)) {
    std::cerr << "Failed to open serial port. Exiting." << std::endl;
    delete ultradriveSerial;
    return 1;
  }

  // Initialize Ultradrive manager (no flow control pins on macOS)
  deviceManagerPtr = new Ultradrive((HardwareSerial *)ultradriveSerial, 0, 0);

  // Initialize HTTP server
  if (!setupHttpServer()) {
    std::cerr << "Failed to start HTTP server" << std::endl;
    delete deviceManagerPtr;
    delete ultradriveSerial;
    return 1;
  }
  std::cout << "HTTP server started on http://localhost:" << HTTP_PORT
            << std::endl;
  std::cout << "Press Ctrl+C to exit" << std::endl;
  std::cout << std::endl;

  // Main loop
  while (!shouldExit) {
    unsigned long now = millis();
    deviceManagerPtr->processIncoming(now);
    processWebServer();

    // Small delay to prevent CPU spinning
    usleep(1000); // 1ms
  }

  // Cleanup
  ultradriveSerial->end();
  delete deviceManagerPtr;
  delete ultradriveSerial;

  std::cout << "Goodbye!" << std::endl;
  return 0;
}

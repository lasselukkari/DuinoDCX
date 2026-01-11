/*
  DuinoDCX - ESP32 and macOS web server for Behringer DCX2496 Ultradrive

  This file compiles for both:
  - ESP32 Arduino (WiFi, mDNS, OTA updates, Preferences storage)
  - macOS/Linux native (BSD sockets, POSIX serial)

  Platform detection and type aliases are handled by Platform.h
*/

#include "Config.h"
#include "Platform.h"
#include "RouteHandlers.h"
#include "StaticFiles.h"
#include "Ultradrive.h"
#include "aWOT.h"

// ============================================================================
// Platform-Specific Globals
// ============================================================================

#ifdef PLATFORM_ARDUINO

Preferences preferences;
WiFiServer httpServer(80);
HardwareSerial UltradriveSerial(2);
Ultradrive deviceManager(&UltradriveSerial, RTS_PIN, CTS_PIN);
Ultradrive *deviceManagerPtr = &deviceManager;

char basicAuth[BASIC_AUTH_LENGTH];
char softApSsid[SOFT_AP_SSID_LENGTH];
char softApPassword[SOFT_AP_PASSWORD_LENGTH];
char mdnsName[MDDNS_NAME_LENGTH];
bool flowControl;
bool autoDisableAP;

char authBuffer[AUTH_BUFFER_LENGHT];
Request::HeaderNode authHeader = {"Authorization", authBuffer,
                                  AUTH_BUFFER_LENGHT, nullptr};
char ssidBuffer[SSID_MAX_LENGTH];
char passwordBuffer[PASSWORD_MAX_LENGHT];
unsigned long lastReconnect;
bool shouldRestart = false;

#endif // PLATFORM_ARDUINO

#ifdef PLATFORM_NATIVE

PlatformServer httpServer(HTTP_PORT);
PlatformSerial *ultradriveSerial = nullptr;
Ultradrive *deviceManagerPtr = nullptr;
volatile bool shouldExit = false;

void signalHandler(int sig) {
  (void)sig;
  std::cout << "\nShutting down..." << std::endl;
  shouldExit = true;
}

void setupSignalHandlers() {
  signal(SIGINT, signalHandler);
  signal(SIGTERM, signalHandler);
}

#endif // PLATFORM_NATIVE

// ============================================================================
// Shared Globals
// ============================================================================

App app;
Router apiRouter;
unsigned long requestStart;

// ============================================================================
// Shared Request Handlers
// ============================================================================

void logRequestStart(Request &req, Response &res) {
  unsigned long now = millis();
  Serial.print(now);
  Serial.print(": HTTP ");

  switch (req.method()) {
  case Request::GET: {
    Serial.print("GET ");
    break;
  }
  case Request::POST: {
    Serial.print("POST ");
    break;
  }
  case Request::PUT: {
    Serial.print("PUT ");
    break;
  }
  case Request::PATCH: {
    Serial.print("PATCH ");
    break;
  }
  case Request::DELETE: {
    Serial.print("DELETE ");
    break;
  }
  default: {
  }
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

void handleSpa(Request &req, Response &res) { static_index(req, res); }

void getVersion(Request &req, Response &res) {
  (void)req;
  res.set("Content-Type", "application/json");
  res.print("{");

  res.print("\"version\":");
  res.print("\"");
  res.print(VERSION);
  res.print("\", ");
  res.print("\"buildDate\":");
  res.print("\"");
  res.print(BUILD_DATE);
  res.print("\"");

  res.print("}");
}

// ============================================================================
// ESP32 Arduino-Specific Handlers
// ============================================================================

#ifdef PLATFORM_ARDUINO

void auth(Request &req, Response &res) {
  char *authHeaderValue = req.get("Authorization");

  if (strcmp(authHeaderValue, basicAuth) != 0) {
    res.set("WWW-Authenticate", "Basic realm=\"Ultradrive\"");
    res.sendStatus(401);
    res.end();
  } else {
    req.next();
  }
}

void update(Request &req, Response &res) {
  int contentLength = req.left();

  if (!Update.begin(contentLength)) {
    return res.sendStatus(500);
  }

  if (Update.writeStream(req) != contentLength) {
    return res.sendStatus(500);
  }

  if (!Update.end()) {
    return res.sendStatus(500);
  }

  if (!Update.isFinished()) {
    return res.sendStatus(500);
  }

  shouldRestart = true;
  res.sendStatus(204);
}

void getNetworks(Request &req, Response &res) {
  (void)req;
  int n = WiFi.scanNetworks();
  res.set("Content-Type", "application/json");

  res.print("[");
  for (int i = 0; i < n; ++i) {
    res.print('"');
    res.print(WiFi.SSID(i));
    res.print('"');
    if (i < n - 1) {
      res.print(",");
    }
  }
  res.print("]");
}

void getSettings(Request &req, Response &res) {
  (void)req;
  res.set("Content-Type", "application/json");
  res.print("{");

  res.print("\"" SOFT_AP_SSID_KEY "\":");
  res.print("\"");
  res.print(softApSsid);
  res.print("\", ");

  res.print("\"" SOFT_AP_PASSWORD_KEY "\":");
  res.print("\"");
  res.print(softApPassword);
  res.print("\", ");

  res.print("\"" AUTH_KEY "\":");
  res.print("\"");
  res.print(basicAuth);
  res.print("\", ");

  res.print("\"" MDNS_HOST_KEY "\":");
  res.print("\"");
  res.print(mdnsName);
  res.print("\", ");

  res.print("\"" FLOW_CONTROL_KEY "\":");
  res.print("\"");
  res.print(flowControl);
  res.print("\", ");

  res.print("\"" AUTO_DISABLE_AP_KEY "\":");
  res.print("\"");
  res.print(autoDisableAP);
  res.print("\"");

  res.print("}");
}

void updateSettings(Request &req, Response &res) {
  char name[15];
  char value[BASIC_AUTH_LENGTH];
  preferences.begin("duinodcx", false);

  while (req.left()) {
    req.form(name, 15, value, BASIC_AUTH_LENGTH);
    if (strcmp(name, AUTH_KEY) == 0) {
      preferences.putString(AUTH_KEY, value);
    } else if (strcmp(name, SOFT_AP_SSID_KEY) == 0) {
      preferences.putString(SOFT_AP_SSID_KEY, value);
    } else if (strcmp(name, SOFT_AP_PASSWORD_KEY) == 0) {
      preferences.putString(SOFT_AP_PASSWORD_KEY, value);
    } else if (strcmp(name, MDNS_HOST_KEY) == 0) {
      preferences.putString(MDNS_HOST_KEY, value);
    } else if (strcmp(name, FLOW_CONTROL_KEY) == 0) {
      bool isEnabled = (value[0] != '0');
      preferences.putBool(FLOW_CONTROL_KEY, isEnabled);
    } else if (strcmp(name, AUTO_DISABLE_AP_KEY) == 0) {
      bool isEnabled = (value[0] != '0');
      preferences.putBool(AUTO_DISABLE_AP_KEY, isEnabled);
    } else {
      preferences.end();
      return res.sendStatus(400);
    }
  }

  preferences.end();
  res.sendStatus(204);

  shouldRestart = true;
}

void getConnection(Request &req, Response &res) {
  (void)req;
  res.set("Content-Type", "application/json");
  res.print("{");

  res.print("\"current\":");
  res.print("\"");
  res.print(WiFi.SSID());
  res.print("\",");

  res.print("\"ip\":");
  res.print("\"");
  res.print(WiFi.localIP());
  res.print("\"");

  res.print("}");
}

void updateConnection(Request &req, Response &res) {
  char name[10];
  char value[PASSWORD_MAX_LENGHT];
  unsigned long timeout;

  while (req.left()) {
    req.form(name, 10, value, PASSWORD_MAX_LENGHT);
    if (strcmp(name, POST_PARAM_SSID_KEY) == 0) {
      strcpy(ssidBuffer, value);
    } else if (strcmp(name, POST_PARAM_PASSWORD_KEY) == 0) {
      strcpy(passwordBuffer, value);
    } else {
      return res.sendStatus(400);
    }
  }

  WiFi.disconnect(false, true);

  WiFi.begin(ssidBuffer, passwordBuffer);

  timeout = millis() + CONNECTION_TIMEOUT;
  while (WiFi.status() != WL_CONNECTED && millis() < timeout) {
    delay(1000);
  }

  if (WiFi.status() != WL_CONNECTED) {
    WiFi.disconnect(false, true);
    return res.sendStatus(400);
  }

  return getConnection(req, res);
}

void removeConnection(Request &req, Response &res) {
  (void)req;
  if (!WiFi.disconnect(false, true)) {
    return res.sendStatus(500);
  }

  res.sendStatus(204);
}

void loadPreferences() {
  pinMode(RESET_PIN, INPUT_PULLUP);

  preferences.begin("duinodcx", false);

  unsigned long now = millis();
  while (!digitalRead(RESET_PIN)) {
    if (millis() - now > 1000) {
      preferences.clear();
      break;
    }
  }

  if (!preferences.getString(AUTH_KEY, basicAuth, BASIC_AUTH_LENGTH)) {
    strcpy(basicAuth, DEFAULT_AUTH);
  }

  if (!preferences.getString(SOFT_AP_SSID_KEY, softApSsid,
                             SOFT_AP_SSID_LENGTH)) {
    strcpy(softApSsid, DEFAULT_SOFT_AP_SSID);
  }

  if (!preferences.getString(SOFT_AP_PASSWORD_KEY, softApPassword,
                             SOFT_AP_PASSWORD_LENGTH)) {
    strcpy(softApPassword, DEFAULT_SOFT_AP_PASSWORD);
  }

  if (!preferences.getString(MDNS_HOST_KEY, mdnsName, MDDNS_NAME_LENGTH)) {
    strcpy(mdnsName, DEFAULT_MDNS_NAME);
  }

  flowControl = preferences.getBool(FLOW_CONTROL_KEY, DEFAULT_FLOW_CONTROL);

  autoDisableAP =
      preferences.getBool(AUTO_DISABLE_AP_KEY, DEFAULT_AUTO_DISABLE_AP);

  preferences.end();
}

void restartIfNeeded() {
  if (shouldRestart) {
    delay(5000);
    ESP.restart();
  }
}

#endif // PLATFORM_ARDUINO

// ============================================================================
// macOS/Linux Native-Specific Handlers
// ============================================================================

#ifdef PLATFORM_NATIVE

void getNetworks(Request &req, Response &res) {
  (void)req;
  res.set("Content-Type", "application/json");
  res.print("[]"); // No WiFi scanning on desktop
}

void getConnection(Request &req, Response &res) {
  (void)req;
  res.set("Content-Type", "application/json");
  res.print("{\"current\":\"localhost\",\"ip\":\"127.0.0.1\"}");
}

#endif // PLATFORM_NATIVE

// ============================================================================
// Web Server Processing (Shared with platform differences)
// ============================================================================

#ifdef PLATFORM_ARDUINO

void processWebServer() {
  WiFiClient client = httpServer.available();

  if (client.connected()) {
    App::ProcessOptions options;
    options.headers = &authHeader;
    options.headerCount = 1;
    App::ProcessResult result = app.process(&client, options);

    // If this was an SSE request, store the client for later
    if (result.responseOpen) {
      storeSseClient(client);
    }
  }
}

#endif // PLATFORM_ARDUINO

#ifdef PLATFORM_NATIVE

// SSE client management for macOS
struct SseClientSlot {
  int socket;
  char clientId[40];
};

#define MAX_SSE_SLOTS 4
SseClientSlot sseSlots[MAX_SSE_SLOTS] = {
    {-1, ""}, {-1, ""}, {-1, ""}, {-1, ""}};

void storeSseClientSocket(int socket, const char *clientId) {
  for (int i = 0; i < MAX_SSE_SLOTS; i++) {
    if (sseSlots[i].socket < 0) {
      sseSlots[i].socket = socket;
      if (clientId && strlen(clientId) > 0) {
        strncpy(sseSlots[i].clientId, clientId, 39);
        sseSlots[i].clientId[39] = '\0';
      } else {
        sseSlots[i].clientId[0] = '\0';
      }
      std::cout << "SSE client connected (slot " << i << ", socket " << socket
                << ", id " << sseSlots[i].clientId << ")" << std::endl;
      break;
    }
  }
}

int countSseClients() {
  int count = 0;
  for (int i = 0; i < MAX_SSE_SLOTS; i++) {
    if (sseSlots[i].socket >= 0)
      count++;
  }
  return count;
}

void sendToSseClients(const uint8_t *data, size_t length,
                      const char *targetClientId) {
  for (int i = 0; i < MAX_SSE_SLOTS; i++) {
    int sock = sseSlots[i].socket;
    if (sock >= 0) {
      // If targetClientId is specified, check for match
      if (targetClientId && targetClientId[0] != '\0') {
        if (strcmp(sseSlots[i].clientId, targetClientId) != 0) {
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
        sseSlots[i].socket = -1;
        sseSlots[i].clientId[0] = '\0';
      }
    }
  }
}

void processWebServer() {
  PlatformClient client = httpServer.available();

  if (client.connected()) {
    int socketFd = client.getSocket();
    App::ProcessResult result = app.process(&client);

    // If this was an SSE request, store socket and don't close
    if (result.responseOpen) {
      storeSseClientSocket(socketFd, pendingClientId);
      return;
    }
    client.stop();
  }
}

#endif // PLATFORM_NATIVE

// ============================================================================
// HTTP Server Setup
// ============================================================================

void setupHttpServer() {
  setupApiRoutes(apiRouter);

#ifdef PLATFORM_ARDUINO
  apiRouter.get("/connection", &getConnection);
  apiRouter.patch("/connection", &updateConnection);
  apiRouter.del("/connection", &removeConnection);
  apiRouter.get("/settings", &getSettings);
  apiRouter.patch("/settings", &updateSettings);
  apiRouter.get("/networks", &getNetworks);
  apiRouter.post("/update", &update);
#endif

#ifdef PLATFORM_NATIVE
  apiRouter.get("/networks", &getNetworks);
  apiRouter.get("/connection", &getConnection);
#endif

  apiRouter.get("/version", &getVersion);

  app.use(&logRequestStart);

#ifdef PLATFORM_ARDUINO
  app.use(&auth);
#endif

  app.use("/api", &apiRouter);
  app.use("/", staticFiles());
  app.get(handleSpa);

  app.use(&logRequestEnd);

  httpServer.begin();
}

// ============================================================================
// Arduino Entry Points
// ============================================================================

#ifdef PLATFORM_ARDUINO

void setup() {
  Serial.begin(38400);
  UltradriveSerial.setPins(RX2_PIN, TX2_PIN);
  UltradriveSerial.begin(38400);

  loadPreferences();

  if (flowControl) {
    deviceManager.enableFlowControl(true);
    pinMode(RTS_PIN, OUTPUT);
    pinMode(CTS_PIN, INPUT_PULLUP);
  }

  WiFi.begin();
  unsigned long timeout = millis() + CONNECTION_TIMEOUT;
  while (WiFi.status() != WL_CONNECTED && millis() < timeout) {
    delay(1000);
  }

  if (WiFi.status() != WL_CONNECTED) {
    WiFi.disconnect(false, false);
  }

  if (WiFi.status() != WL_CONNECTED || autoDisableAP == false) {
    WiFi.softAP(softApSsid, softApPassword);
  }

  setupHttpServer();

  MDNS.begin(mdnsName);
  MDNS.addService("http", "tcp", 80);
}

void loop() {
  unsigned long now = millis();
  deviceManager.processIncoming(now);
  processWebServer();
  restartIfNeeded();
}

#endif // PLATFORM_ARDUINO

// ============================================================================
// macOS/Linux Entry Point
// ============================================================================

#ifdef PLATFORM_NATIVE

int main() {
  // Get serial port from environment variable or use default
  const char *serialPort = getenv("DUINODCX_SERIAL_PORT");
  if (!serialPort) {
    serialPort = DEFAULT_SERIAL_PORT;
  }

  // Set up signal handlers
  setupSignalHandlers();

  std::cout << "DuinoDCX macOS Native" << std::endl;
  std::cout << "=====================" << std::endl;
  std::cout << "Serial port: " << serialPort << std::endl;
  std::cout << "  (set DUINODCX_SERIAL_PORT env var to change)" << std::endl;
  std::cout << "HTTP port:   " << HTTP_PORT << std::endl;
  std::cout << std::endl;

  // Initialize serial
  ultradriveSerial = new PlatformSerial(serialPort);
  ultradriveSerial->begin(38400);

  if (!(*ultradriveSerial)) {
    std::cerr << "Failed to open serial port. Exiting." << std::endl;
    delete ultradriveSerial;
    return 1;
  }

  // Initialize Ultradrive manager (no flow control pins on macOS)
  deviceManagerPtr = new Ultradrive((HardwareSerial *)ultradriveSerial, 0, 0);

  // Initialize HTTP server
  setupHttpServer();
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

#endif // PLATFORM_NATIVE

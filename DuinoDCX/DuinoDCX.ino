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
#include "aWOT.h"

bool shouldRestart = false;

#ifdef PLATFORM_ARDUINO

void restartIfNeeded() {
  if (shouldRestart) {
    delay(5000);
    ESP.restart();
  }
}

#endif

#ifdef PLATFORM_NATIVE

volatile bool shouldExit = false;

void signalHandler(int sig) {
  (void)sig;
  std::cout << "\nShutting down..." << std::endl;
  shouldExit = true;
}

void setupSignalHandlers() {
  signal(SIGINT, signalHandler);
  signal(SIGTERM, signalHandler);
  signal(SIGPIPE, SIG_IGN); // Ignore SIGPIPE - handle write errors gracefully
}

#endif

// Serial port globals for RouteHandlers
PlatformSerial *serialPort = nullptr;
int rtsPin = RTS_PIN;
int ctsPin = CTS_PIN;
bool flowControl = false;

Preferences preferences;
char basicAuth[BASIC_AUTH_LENGTH];
char softApSsid[SOFT_AP_SSID_LENGTH];
char softApPassword[SOFT_AP_PASSWORD_LENGTH];
char mdnsName[MDDNS_NAME_LENGTH];
bool autoDisableAP;

char authBuffer[AUTH_BUFFER_LENGHT];
char wsKeyBuffer[32]; // Buffer for Sec-WebSocket-Key header

// Headers MUST be an array - aWOT accesses them via array index, not linked
// list
// Sec-WebSocket-Key header for WebSocket upgrade
Request::HeaderNode requestHeaders[] = {
    {"Sec-WebSocket-Key", wsKeyBuffer, sizeof(wsKeyBuffer), nullptr},
    {"Authorization", authBuffer, AUTH_BUFFER_LENGHT, nullptr}};

PlatformServer httpServer(HTTP_PORT);

App app;
Router apiRouter;
unsigned long requestStart;

char ssidBuffer[SSID_MAX_LENGTH];
char passwordBuffer[PASSWORD_MAX_LENGHT];

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

  if (Update.writeStream(req) != (size_t)contentLength) {
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

void processWebServer() {
  PlatformClient client = httpServer.available();

  if (client.connected()) {
    App::ProcessOptions options;
    options.headers = requestHeaders;
    options.headerCount = 2;
    App::ProcessResult result = app.process(&client, options);

    Serial.print("[processWebServer] responseOpen=");
    Serial.println(result.responseOpen ? "true" : "false");

    if (!result.responseOpen) {
      Serial.println("[processWebServer] Calling client.stop()");
      client.stop();
    }
  }
}

void setupHttpServer() {
  setupApiRoutes(apiRouter);

  // WebSocket endpoint - registered before auth since browsers can't send
  // Basic Auth headers during WebSocket upgrade handshake
  app.get("/api/ws", &wsUpgradeHandler);

  apiRouter.get("/connection", &getConnection);
  apiRouter.patch("/connection", &updateConnection);
  apiRouter.del("/connection", &removeConnection);
  apiRouter.get("/settings", &getSettings);
  apiRouter.patch("/settings", &updateSettings);
  apiRouter.get("/networks", &getNetworks);
  apiRouter.post("/update", &update);
  apiRouter.get("/version", &getVersion);
  app.use(&logRequestStart);
  app.use(&auth);
  app.use("/api", &apiRouter);
  app.use("/", staticFiles());
  app.get(handleSpa);
  app.use(&logRequestEnd);

  httpServer.begin();
}

void setup() {
  Serial.begin(38400);
  serialPort = new PlatformSerial(2);
  serialPort->setPins(RX2_PIN, TX2_PIN); // No-op on macOS
  serialPort->begin(38400);
  loadPreferences();
  if (flowControl) {
    pinMode(rtsPin, OUTPUT);
    pinMode(ctsPin, INPUT_PULLUP);
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

  // mDNS (stubbed on native)
  MDNS.begin(mdnsName);
  MDNS.addService("http", "tcp", HTTP_PORT);
}

void loop() {
  processSerialToWs(); // Forward serial → WebSocket
  ws.poll();           // Poll WebSocket for incoming messages
  processWebServer();
#ifdef PLATFORM_ARDUINO
  restartIfNeeded();
#endif
}

#ifdef PLATFORM_NATIVE

int main() {
  setupSignalHandlers();
  setup();
  if (!serialPort) {
    return 1;
  }

  std::cout << "HTTP server started on http://localhost:" << HTTP_PORT
            << std::endl;
  std::cout << "Press Ctrl+C to exit" << std::endl;
  std::cout << std::endl;
  while (!shouldExit) {
    loop();
    usleep(1000);
  }

  serialPort->end();
  delete serialPort;

  std::cout << "Goodbye!" << std::endl;
  return 0;
}

#endif // PLATFORM_NATIVE

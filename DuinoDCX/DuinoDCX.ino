#include <esp_wifi.h>
#include <WiFi.h>
#include <ESPmDNS.h>
#include <Update.h>
#include <Preferences.h>
#include "aWOT.h"
#include "StaticFiles.h"
#include "Ultradrive.h"
#include "Config.h"

Preferences preferences;
WiFiServer httpServer(80);
HardwareSerial UltradriveSerial(2);
Ultradrive deviceManager(&UltradriveSerial, RTS_PIN, CTS_PIN);
Application app;
Router apiRouter("/api");

char basicAuth[BASIC_AUTH_LENGTH];
char softApSsid[SOFT_AP_SSID_LENGTH];
char softApPassword[SOFT_AP_PASSWORD_LENGTH];
char mdnsName[MDDNS_NAME_LENGTH];
bool flowControl;
bool autoDisableAP;

char authBuffer[AUTH_BUFFER_LENGHT];
char ssidBuffer[SSID_MAX_LENGTH];
char passwordBuffer[PASSWORD_MAX_LENGHT];
unsigned long lastReconnect;
bool shouldRestart = false;
unsigned long requestStart;

void logRequestStart(Request &req, Response &res) {
  unsigned long now = millis();
  Serial.print(now);
  Serial.print(": HTTP ");

  switch (req.method()) {
    case  Request::GET: {
        Serial.print("GET ");
        break;
      }
    case  Request::POST: {
        Serial.print("POST ");
        break;
      }
    case  Request::PUT: {
        Serial.print("PUT ");
        break;
      }
    case  Request::PATCH: {
        Serial.print("GET ");
        break;
      }
    case  Request::DELETE: {
        Serial.print("DELETE ");
        break;
      }
    default: {}
  }

  Serial.print(req.path());
  Serial.print(" ");
  requestStart = micros();
}

void logRequestEnd(Request &req, Response &res) {
  float delta = (micros() - requestStart) / 1000.0;
  Serial.print(res.bytesSent());
  Serial.print(" b ");
  Serial.print(delta);
  Serial.println(" ms");
}

void auth(Request &req, Response &res) {
  char * authHeader = req.get("Authorization");

  if (strcmp(authHeader, basicAuth) != 0) {
    res.set("WWW-Authenticate", "Basic realm=\"Ultradrive\"");
    res.sendStatus(401);
    res.end();
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

void getVersion(Request &req, Response &res) {
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
      strcpy (ssidBuffer, value);
    } else if (strcmp(name, POST_PARAM_PASSWORD_KEY) == 0) {
      strcpy (passwordBuffer, value);
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
  if (!WiFi.disconnect(false, true)) {
    return res.sendStatus(500);
  }

  res.sendStatus(204);
}

void getDevice(Request &req, Response &res) {
  res.set("Content-Type", "application/binary");
  deviceManager.writeDevice(&res);
}

void getStatus(Request &req, Response &res) {
  res.set("Content-Type", "application/binary");
  deviceManager.writeDeviceStatus(&res);
}

void selectDevice(Request &req, Response &res) {
  byte buffer[100];

  if (!req.readBytes(buffer, 100)) {
    return res.sendStatus(400);
  }

  int id = atoi((const char *)buffer);
  deviceManager.setSelected(id);
}

void getState(Request &req, Response &res) {
  res.set("Content-Type", "application/binary");
  res.write(deviceManager.getSelected());
  deviceManager.writeDevice(&res);
  deviceManager.writeDevices(&res);
}

void createDirectCommand(Request &req, Response &res) {
  while (req.left()) {
    deviceManager.processOutgoing(&req);
  }

  res.sendStatus(204);
}

void processWebServer() {
  WiFiClient client = httpServer.available();

  if (client.connected()) {
    app.process(&client);
  }
}

void restartIfNeeded() {
  if (shouldRestart) {
    delay(5000);
    ESP.restart();
  }
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

  if (!preferences.getString(SOFT_AP_SSID_KEY, softApSsid, SOFT_AP_SSID_LENGTH)) {
    strcpy(softApSsid, DEFAULT_SOFT_AP_SSID);
  }

  if (!preferences.getString(SOFT_AP_PASSWORD_KEY, softApPassword, SOFT_AP_PASSWORD_LENGTH)) {
    strcpy(softApPassword, DEFAULT_SOFT_AP_PASSWORD);
  }

  if (!preferences.getString(MDNS_HOST_KEY, mdnsName, MDDNS_NAME_LENGTH)) {
    strcpy(mdnsName, DEFAULT_MDNS_NAME);
  }

  flowControl = preferences.getBool(FLOW_CONTROL_KEY, DEFAULT_FLOW_CONTROL);

  autoDisableAP = preferences.getBool(AUTO_DISABLE_AP_KEY, DEFAULT_AUTO_DISABLE_AP);

  preferences.end();
}

void setupHttpServer() {
  app.header("Authorization", authBuffer, AUTH_BUFFER_LENGHT);

  apiRouter.get("/state", &getState);
  apiRouter.get("/status", &getStatus);
  apiRouter.put("/selected", &selectDevice);
  apiRouter.post("/commands", &createDirectCommand);
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
  app.route(&apiRouter);
  app.route(staticFiles());
  app.use(&logRequestEnd);

  httpServer.begin();
}

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

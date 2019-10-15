#include <esp_wifi.h>
#include <WiFi.h>
#include <ESPmDNS.h>
#include <Update.h>
#include <Preferences.h>
#include "aWOT.h"
#include "StaticFiles.h"
#include "Ultradrive.h"

#define VERSION "v0.0.30"
#define BUILD_DATE __DATE__ " " __TIME__

#define DEFAULT_AUTH "Basic RENYMjQ5NjpVbHRyYWRyaXZl" // DCX2496:Ultradrive in base64
#define DEFAULT_SOFT_AP_SSID "DCX2496"
#define DEFAULT_SOFT_AP_PASSWORD "Ultradrive"
#define DEFAULT_MDNS_NAME "ultradrive"
#define DEFAULT_FLOW_CONTROL false

#define RTS_PIN 21
#define CTS_PIN 22

#define RESET_PIN 13

#define WIFI_HOST_NAME "ultradrive"
#define AUTH_KEY "auth"
#define SOFT_AP_PASSWORD_KEY "apPassword"
#define SOFT_AP_SSID_KEY "apSsid"
#define MDNS_HOST_KEY "mdnsHost"
#define FLOW_CONTROL_KEY "flowControl"

#define AUTH_BUFFER_LENGHT 200
#define MAX_DEVICES 16
#define POST_PARAM_SSID_KEY "ssid"
#define POST_PARAM_PASSWORD_KEY "password"
#define SSID_MAX_LENGTH 33
#define PASSWORD_MAX_LENGHT 65
#define CONNECTION_TIMEOUT 10000
#define RECONNECT_INTERVAL 20000
#define BASIC_AUTH_LENGTH 200
#define SOFT_AP_SSID_LENGTH 65
#define SOFT_AP_PASSWORD_LENGTH 65
#define MDDNS_NAME_LENGTH 65

Preferences preferences;
WiFiServer httpServer(80);
HardwareSerial UltradriveSerial(2);
Ultradrive deviceManager(&UltradriveSerial, RTS_PIN, CTS_PIN);
Application app;
Router apiRouter("/api");
Router logEndRouter("");

char basicAuth[BASIC_AUTH_LENGTH];
char softApSsid[SOFT_AP_SSID_LENGTH];
char softApPassword[SOFT_AP_PASSWORD_LENGTH];
char mdnsName[MDDNS_NAME_LENGTH];
bool flowControl;

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

  if (!req.body(buffer, 100)) {
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
  logEndRouter.use(&logRequestEnd);

  app.use(&logRequestStart);
  app.use(&auth);
  app.route(&apiRouter);
  app.route(staticFiles());
  app.route(&logEndRouter);

  httpServer.begin();
}

void setup() {
  Serial.begin(38400);
  UltradriveSerial.begin(38400);

  loadPreferences();

  if (flowControl) {
    deviceManager.enableFlowControl(true);
    pinMode(RTS_PIN, OUTPUT);
    pinMode(CTS_PIN, INPUT);
  }

  WiFi.softAP(softApSsid, softApPassword);

  MDNS.begin(mdnsName);
  MDNS.addService("http", "tcp", 80);

  setupHttpServer();
  WiFi.begin();
  unsigned long timeout = millis() + CONNECTION_TIMEOUT;
  while (WiFi.status() != WL_CONNECTED && millis() < timeout) {
    delay(1000);
  }

  if (WiFi.status() != WL_CONNECTED) {
    WiFi.disconnect(false, false);
  }
}

void loop() {
  unsigned long now = millis();
  deviceManager.processIncoming(now);
  processWebServer();
  restartIfNeeded();
}

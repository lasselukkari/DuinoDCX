#include <esp_wifi.h>
#include <WiFi.h>
#include <ESPmDNS.h>
#include <Update.h>
#include <Preferences.h>
#include "aWOT.h"
#include "Ultradrive.h"

#define VERSION "v0.0.17"
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
WebApp app;
Router apiRouter("/api");

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

void auth(Request &req, Response &res) {
  char * authHeader = req.header("Authorization");

  if (strcmp(authHeader, basicAuth) != 0) {
    res.set("WWW-Authenticate", "Basic realm=\"Ultradrive\"");
    res.unauthorized();
    res.end();
  }
}

void update(Request &req, Response &res) {
  int contentLength = req.contentLeft();

  if (!Update.begin(contentLength)) {
    return res.fail();
  }

  if (Update.writeStream(req) != contentLength) {
    return res.fail();
  }

  if (!Update.end()) {
    return res.fail();
  }

  if (!Update.isFinished()) {
    return res.fail();
  }

  shouldRestart = true;
  res.noContent();
}

void getNetworks(Request &req, Response &res) {
  int n = WiFi.scanNetworks();
  res.success("application/json");

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
  res.success("application/json");
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
  res.success("application/json");
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

  while (req.contentLeft()) {
    req.postParam(name, 15, value, BASIC_AUTH_LENGTH);
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
      return res.fail();
    }
  }

  preferences.end();
  res.noContent();

  shouldRestart = true;
}

void getConnection(Request &req, Response &res) {
  res.success("application/json");
  res.print("{");

  res.print("\"current\":");
  res.print("\"");
  res.print(WiFi.SSID());
  res.print("\",");

  res.print("\"ip\":");
  res.print("\"");
  res.print(WiFi.localIP());
  res.print("\", ");

  res.print("\"hostname\":");
  res.print("\"");
  res.print(mdnsName);
  res.print(".local");
  res.print("\"");

  res.print("}");
}

void updateConnection(Request &req, Response &res) {
  char name[10];
  char value[PASSWORD_MAX_LENGHT];
  unsigned long timeout;

  while (req.contentLeft()) {
    req.postParam(name, 10, value, PASSWORD_MAX_LENGHT);
    if (strcmp(name, POST_PARAM_SSID_KEY) == 0) {
      strcpy (ssidBuffer, value);
    } else if (strcmp(name, POST_PARAM_PASSWORD_KEY) == 0) {
      strcpy (passwordBuffer, value);
    } else {
      return res.fail();
    }
  }

  esp_wifi_disconnect();

  WiFi.begin(ssidBuffer, passwordBuffer);

  timeout = millis() + CONNECTION_TIMEOUT;
  while (WiFi.status() != WL_CONNECTED && millis() < timeout) {
    delay(1000);
  }

  if (WiFi.status() != WL_CONNECTED) {
    return res.fail();
  }

  return getConnection(req, res);
}

void getDevice(Request &req, Response &res) {
  char idBuffer[64];
  req.route("id", idBuffer, 64);
  int id = atoi(idBuffer);

  if (id < 0 || id > MAX_DEVICES - 1) {
    return res.fail();
  }

  res.success("application/binary");
  deviceManager.writeDevice(&res, id);
}

void getDevices(Request &req, Response &res) {
  res.success("application/binary");
  deviceManager.writeDevices(&res);
}

void createDirectCommand(Request &req, Response &res) {
  while (req.contentLeft()) {
    deviceManager.processOutgoing(&req);
  }

  res.noContent();
}

void checkWifi(unsigned long now) {
  if (WiFi.status() != WL_CONNECTED && (now - lastReconnect >= RECONNECT_INTERVAL)) {
    WiFi.begin();
    WiFi.setHostname(WIFI_HOST_NAME);
    lastReconnect = now;
  }
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
  app.readHeader("Authorization", authBuffer, AUTH_BUFFER_LENGHT);

  apiRouter.get("/devices", &getDevices);
  apiRouter.get("/devices/:id", &getDevice);
  apiRouter.post("/commands", &createDirectCommand);
  apiRouter.get("/connection", &getConnection);
  apiRouter.patch("/connection", &updateConnection);
  apiRouter.get("/settings", &getSettings);
  apiRouter.patch("/settings", &updateSettings);
  apiRouter.get("/networks", &getNetworks);
  apiRouter.post("/update", &update);
  apiRouter.get("/version", &getVersion);

  app.use(&auth);
  app.use(&apiRouter);
  app.use(staticFiles());

  httpServer.begin();
}

void setup() {
  UltradriveSerial.begin(38400);

  loadPreferences();

  if (flowControl) {
    deviceManager.enableFlowControl(true);
    pinMode(RTS_PIN, OUTPUT);
    pinMode(CTS_PIN, INPUT);
  }

  WiFi.softAP(softApSsid, softApPassword);
  WiFi.setAutoReconnect(false);

  MDNS.begin(mdnsName);
  MDNS.addService("http", "tcp", 80);

  setupHttpServer();
  checkWifi(RECONNECT_INTERVAL);
}

void loop() {
  unsigned long now = millis();
  deviceManager.processIncoming(now);
  checkWifi(now);
  processWebServer();
  restartIfNeeded();
}

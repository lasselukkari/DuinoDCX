#include <esp_wifi.h>
#include <WiFi.h>
#include <ESPmDNS.h>
#include <ArduinoOTA.h>
#include "aWOT.h"
#include "Ultradrive.h"
#include "StaticFiles.h"

#define MAX_DEVICES 16
#define SOFT_AP_SSID "DuinoDCX"
#define SOFT_AP_PASSWORD "Ultradrive"
#define MDNS_NAME "ultradrive"
#define OTA_PASSWORD "Ultradrive"
#define DNS_PORT 53
#define POST_PARAM_SSID_KEY "ssid"
#define POST_PARAM_PASSWORD_KEY "password"
#define SSID_MAX_LENGTH 33
#define PASSWORD_MAX_LENGHT 65
#define CONNECTION_TIMEOUT 10000
#define RECONNECT_INTERVAL 20000

WiFiServer httpServer(80);
HardwareSerial UltradriveSerial(2);
Ultradrive deviceManager(&UltradriveSerial);
WebApp app;
Router apiRouter("/api");

char ssidBuffer[SSID_MAX_LENGTH];
char passwordBuffer[PASSWORD_MAX_LENGHT];
unsigned long lastReconnect;

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
  res.print(MDNS_NAME ".local");
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
    lastReconnect = now;
  }
}

void processWebServer() {
  WiFiClient client = httpServer.available();

  if (client.connected()) {
    app.process(&client);
  }
}

void setup() {
  Serial.begin(115200);
  UltradriveSerial.begin(38400);

  WiFi.softAP(SOFT_AP_SSID, SOFT_AP_PASSWORD);
  IPAddress apIP = WiFi.softAPIP();
  Serial.print("AP IP address: ");
  Serial.println(apIP);

  ArduinoOTA.setPassword(OTA_PASSWORD);
  ArduinoOTA.begin();

  httpServer.begin();

  apiRouter.get("/devices", &getDevices);
  apiRouter.get("/devices/:id", &getDevice);
  apiRouter.post("/commands", &createDirectCommand);
  apiRouter.get("/connection", &getConnection);
  apiRouter.patch("/connection", &updateConnection);
  apiRouter.get("/networks", &getNetworks);
  app.use(&apiRouter);

  ServeStatic(&app);
  checkWifi(RECONNECT_INTERVAL);
  MDNS.begin(MDNS_NAME);
  MDNS.addService("http", "tcp", 80);
}

void loop() {
  unsigned long now = millis();
  deviceManager.processIncoming(now);
  checkWifi(now);
  processWebServer();
  ArduinoOTA.handle();
}


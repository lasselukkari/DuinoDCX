#include <esp_wifi.h>
#include <WiFi.h>
#include <ESPmDNS.h>
#include <WiFiUdp.h>
#include <ArduinoOTA.h>
#include <DNSServer.h>
#include "aWOT.h"
#include "StaticFiles.h"
#include "DataLocations.h"

#define SOFT_AP_SSID "DuinoDCX"
#define SOFT_AP_PASSWORD "Ultradrive"
#define MDNS_NAME "duinodcx"

#define OTA_PASSWORD "Ultradrive"

#define DNS_PORT 53

#define MAX_DEVICES 16
#define POST_PARAM_SSID_KEY "ssid"
#define POST_PARAM_PASSWORD_KEY "password"

#define SSID_MAX_LENGTH 33
#define PASSWORD_MAX_LENGHT 65
#define SEARCH_RESPONSE_LENGTH 26
#define PING_RESPONSE_LENGTH 25
#define PART_0_LENGTH 1015
#define PART_1_LENGTH 911

#define SEARCH_RESPONSE 0
#define PING_RESPONSE 4
#define DUMP_RESPONSE 16
#define DIRECT_COMMAND 32

#define ID_BYTE 4
#define COMMAND_BYTE 6
#define PARAM_COUNT_BYTE 7
#define CHANNEL_BYTE 8
#define PARAM_BYTE 9
#define DUMP_PART_BYTE 9
#define VALUE_HI_BYTE 10
#define VALUE_LOW_BYTE 11
#define PART_BYTE 12

#define COMMAND_START 240
#define TERMINATOR 247

#define PING_INTEVAL 1000
#define TIMEOUT_TIME 10000
#define SEARCH_INTEVAL 10000
#define RESYNC_INTEVAL 10000
#define CONNECT_TIMEOUT 10000
#define RECONNECT_INTERVAL 20000

WiFiServer httpServer(80);
DNSServer dnsServer;
WebApp app;
Router apiRouter("/api");
HardwareSerial Ultradrive(2);

byte vendorHeader[] = {0xF0, 0x00, 0x20, 0x32, 0x00};
byte searchCommand[] = {0xF0, 0x00, 0x20, 0x32, 0x20, 0x0E, 0x40, TERMINATOR};
byte transmitModeCommand[] = {0xF0, 0x00, 0x20, 0x32, 0x00, 0x0E, 0x3F, 0x0C, 0x00, TERMINATOR};
byte dumpCommand[] = {0xF0, 0x00, 0x20, 0x32, 0x00, 0x0E, 0x50, 0x01, 0x00, 0x00, TERMINATOR};
byte pingCommand[] = {0xF0, 0x00, 0x20, 0x32, 0x00, 0x0E, 0x44, 0x00, 0x00, TERMINATOR};

byte serialBuffer[PART_0_LENGTH];
byte serverBuffer[PART_0_LENGTH];
byte dumps0[MAX_DEVICES][PART_0_LENGTH];
byte dumps1[MAX_DEVICES][PART_1_LENGTH];
byte searchResponses[MAX_DEVICES][SEARCH_RESPONSE_LENGTH];
byte pingResponses[MAX_DEVICES][PING_RESPONSE_LENGTH];

char ssidBuffer[SSID_MAX_LENGTH];
char passwordBuffer[PASSWORD_MAX_LENGHT];

long nextSearch;
long nextReconnect;
long ttls[MAX_DEVICES];
long pingTimes[MAX_DEVICES];
long resyncTimes[MAX_DEVICES];

int serialRead;

bool readingCommand;
bool mdnsStarted;
bool shouldRestart;
bool wasConnected;

void readCommands(Request &req) {
  if (int bytesRead = req.readBytesUntil(TERMINATOR, serverBuffer, PART_0_LENGTH)) {
    serverBuffer[bytesRead++] = TERMINATOR;

    if (!memcmp(serverBuffer, vendorHeader, 5)) {
      int deviceId = serverBuffer[ID_BYTE];
      int command = serverBuffer[COMMAND_BYTE];

      if (command == DIRECT_COMMAND) {
        int count = serverBuffer[PARAM_COUNT_BYTE];

        for (int i = 0; i < count; i++) {
          int offset = (4 * i);
          int channel = serverBuffer[CHANNEL_BYTE + offset];
          int param = serverBuffer[PARAM_BYTE + offset];
          int valueHigh = serverBuffer[VALUE_HI_BYTE + offset];
          int valueLow = serverBuffer[VALUE_LOW_BYTE + offset];

          if (!channel) {
            patchBuffer(deviceId, valueLow, valueHigh, setupLocations[param - (param <= 11 ? 2 : 10)]);
          } else if (channel <= 4) {
            patchBuffer(deviceId, valueLow, valueHigh, inputLocations[channel - 1][param - 2]);
          } else if (channel <= 10) {
            patchBuffer(deviceId, valueLow, valueHigh, outputLocations[channel - 5][param - 2]);
          }
        }

        Ultradrive.write(serverBuffer, bytesRead);
      }
    }
  }
}

// Webserver handler that procecesses incoming comannds from the client
void createDirectCommand(Request &req, Response &res) {
  while (req.contentLeft()) {
    readCommands(req);
  }

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

  if (mdnsStarted) {
    res.print("\"hostname\":");
    res.print("\"");
    res.print(MDNS_NAME ".local");
    res.print("\"");
  }

  res.print("}");
}

void updateConnection(Request &req, Response &res) {
  char name[10];
  char value[PASSWORD_MAX_LENGHT];
  long timeout;

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

  wasConnected = false;
  WiFi.begin(ssidBuffer, passwordBuffer);

  timeout = millis() + CONNECT_TIMEOUT;
  while (WiFi.status() != WL_CONNECTED && millis() < timeout) {
    delay(1000);
  }

  if (WiFi.status() != WL_CONNECTED) {
    return res.fail();
  }

  wasConnected = true;
  mdnsStarted = MDNS.begin(MDNS_NAME);
  getConnection(req, res);
}

// Webserver handler that that resets the device
void getRestart(Request &req, Response &res) {
  shouldRestart = true;
  res.success("text/plain");
  res.print("Restarting now.");
}

// Webserver handler that that returns the state of a singe device
void getDevice(Request &req, Response &res) {
  char idBuffer[64];
  req.route("id", idBuffer, 64);
  int id = atoi(idBuffer);

  if (id < 0 || id > MAX_DEVICES - 1) {
    return res.fail();
  }

  res.success("application/binary");
  res.write(dumps0[id], PART_0_LENGTH);
  res.write(dumps1[id], PART_1_LENGTH);
  res.write(pingResponses[id], PING_RESPONSE_LENGTH);
}

// Webserver handler that that returns the short descripition of all devices
void getDevices(Request &req, Response &res) {
  long now = millis();

  res.success("application/binary");
  for (int i = 0; i < MAX_DEVICES; i++) {
    if (ttls[i] > now) {
      res.write(searchResponses[i], SEARCH_RESPONSE_LENGTH);
    }
  }
}

// Sends the search command to the device to device serial port
void search() {
  Ultradrive.write(searchCommand, sizeof(searchCommand));
}

// Sends a command that sets the trasmit mode to two way sync
void setTransmitMode(int deviceId) {
  transmitModeCommand[ID_BYTE] = deviceId;
  Ultradrive.write(transmitModeCommand, sizeof(transmitModeCommand));
}

// Instructs the device to dump the part of it's memory
void dump(int deviceId, int part) {
  dumpCommand[ID_BYTE] = deviceId;
  dumpCommand[DUMP_PART_BYTE] = part;
  Ultradrive.write(dumpCommand, sizeof(dumpCommand));
}

// Pings the device. Device responds with a message that contains current channgel levels
void ping(int deviceId) {
  pingCommand[ID_BYTE] = deviceId;
  Ultradrive.write(pingCommand, sizeof(pingCommand));
}

// Patches the state of single command param in in the stored memory dumps
void patchBuffer(int id, int low, int high, DataLocation l) {
  if (l.low.part == 0) {
    dumps0[id][l.low.byte] = low;
  } else if (l.low.part == 1) {
    dumps1[id][l.low.byte] = low;
  }

  if (l.middle.byte > 0) {
    if (l.middle.part == 0) {
      if (high & 1) {
        dumps0[id][l.middle.byte] |= (1u << l.middle.index);
      } else {
        dumps0[id][l.middle.byte] &= ~(1u << l.middle.index);
      }
    } else if (l.middle.part == 1) {
      if (high & 1) {
        dumps1[id][l.middle.byte] |= (1u << l.middle.index);
      } else {
        dumps1[id][l.middle.byte] &= ~(1u << l.middle.index);
      }
    }
  }

  if (l.high.byte > 0) {
    int highByte = high >> 1;
    if (l.high.part == 0) {
      dumps0[id][l.high.byte] = highByte;
    } else if (l.high.part == 1) {
      dumps1[id][l.high.byte] = highByte;
    }
  }
}

// Read the commands from the serial port in a non blocking loop until the terminator is received
void readCommands() {
  byte b = Ultradrive.read();

  if (b == COMMAND_START) {
    readingCommand = true;
    serialRead = 0;
  }

  if (readingCommand && (serialRead < PART_0_LENGTH)) {
    serialBuffer[serialRead++] = b;
  }

  if (b == TERMINATOR) {
    readingCommand = false;

    if (!memcmp(serialBuffer, vendorHeader, 5)) {
      int deviceId = serialBuffer[ID_BYTE];
      int command = serialBuffer[COMMAND_BYTE];

      switch (command) {
        case SEARCH_RESPONSE: {
            if (serialRead == SEARCH_RESPONSE_LENGTH) {
              memcpy(&searchResponses[deviceId], serialBuffer, SEARCH_RESPONSE_LENGTH);

              if (!ttls[deviceId]) {
                resyncTimes[deviceId] = (millis() + RESYNC_INTEVAL);
                setTransmitMode(deviceId);
                dump(deviceId, 0);
              }
            }

            break;
          }
        case DUMP_RESPONSE: {
            int part = serialBuffer[PART_BYTE];

            if (part == 0) {
              if (serialRead == PART_0_LENGTH) {
                memcpy(&dumps0[deviceId], serialBuffer, PART_0_LENGTH);
                dump(deviceId, 1);
              }
            } else if (part == 1) {
              if (serialRead == PART_1_LENGTH) {
                memcpy(&dumps1[deviceId], serialBuffer, PART_1_LENGTH);
                ping(deviceId);
              }
            }

            break;
          }
        case PING_RESPONSE: {
            if (serialRead == PING_RESPONSE_LENGTH) {
              memcpy(&pingResponses[deviceId], serialBuffer, PING_RESPONSE_LENGTH);
              ttls[deviceId] = millis() + TIMEOUT_TIME;
            }

            break;
          }
        case DIRECT_COMMAND: {
            int count = serialBuffer[PARAM_COUNT_BYTE];

            for (int i = 0; i < count; i++) {
              int offset = (4 * i);
              int channel = serialBuffer[CHANNEL_BYTE + offset];
              int param = serialBuffer[PARAM_BYTE + offset];
              int valueHigh = serialBuffer[VALUE_HI_BYTE + offset];
              int valueLow = serialBuffer[VALUE_LOW_BYTE + offset];

              if (!channel) {
                patchBuffer(deviceId, valueLow, valueHigh, setupLocations[param - (param <= 11 ? 2 : 10)]);
              } else if (channel <= 4) {
                patchBuffer(deviceId, valueLow, valueHigh, inputLocations[channel - 1][param - 2]);
              } else if (channel <= 10) {
                patchBuffer(deviceId, valueLow, valueHigh, outputLocations[channel - 5][param - 2]);
              }
            }

            break;
          }
        default: {}
      }
    }
  }
}

void setup() {
  Serial.begin(115200);
  Ultradrive.begin(38400);

  WiFi.begin();

  long abortConnect = millis() + CONNECT_TIMEOUT;
  while (WiFi.status() != WL_CONNECTED && millis() < abortConnect) {
    delay(500);
    Serial.print(".");
  }

  if (WiFi.status() ==  WL_CONNECTED) {
    wasConnected = true;
  }

  Serial.println("");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());

  mdnsStarted = MDNS.begin(MDNS_NAME);

  WiFi.softAP(SOFT_AP_SSID, SOFT_AP_PASSWORD);

  IPAddress apIP = WiFi.softAPIP();
  Serial.print("AP IP address: ");
  Serial.println(apIP);

  ArduinoOTA.setPassword(OTA_PASSWORD);
  ArduinoOTA.begin();

  dnsServer.start(DNS_PORT, "*", apIP);

  httpServer.begin();

  apiRouter.get("/devices", &getDevices);
  apiRouter.get("/devices/:id", &getDevice);
  apiRouter.post("/commands", &createDirectCommand);
  apiRouter.get("/connection", &getConnection);
  apiRouter.patch("/connection", &updateConnection);
  apiRouter.get("/networks", &getNetworks);
  apiRouter.get("/reset", &getRestart);
  app.use(&apiRouter);

  ServeStatic(&app);
}

void loop() {
  if (Ultradrive.available()) {
    readCommands();
  }

  long now = millis();
  for (int i = 0; i < MAX_DEVICES; i++) {
    if (ttls[i]) {
      if (pingTimes[i] < now) {
        pingTimes[i] = (now + PING_INTEVAL);
        ping(i);

      } else if (resyncTimes[i] < now) {
        resyncTimes[i] = (now + RESYNC_INTEVAL);
        dump(i, 0);
      }
    }

    if (ttls[i] < now) {
      ttls[i] = 0;
    }
  }

  if (nextSearch < now) {
    search();
    nextSearch = now + SEARCH_INTEVAL;
  }

  WiFiClient client = httpServer.available();

  if (client.connected()) {
    app.process(&client);
  }

  if (shouldRestart) {
    ESP.restart();
  }

  if (WiFi.status() != WL_CONNECTED && wasConnected && nextReconnect < now) {
    WiFi.begin();
    nextReconnect = now + RECONNECT_INTERVAL;
  }

  ArduinoOTA.handle();
  dnsServer.processNextRequest();
}


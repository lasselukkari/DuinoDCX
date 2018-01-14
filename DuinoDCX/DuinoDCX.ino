#include <Preferences.h>
#include <SPI.h>
#include <WiFi.h>
#include <ESPmDNS.h>
#include "aWOT.h"
#include "StaticFiles.h"
#include "DataLocations.h"

#define SOFT_AP_SSID "DuinoDCX"
#define SOFT_AP_PASSWORD "Ultradrive"
#define MDNS_NAME "duinodcx"

#define MAX_DEVICES 16
#define PREFERENCES_ID "DuinoDCX"
#define PREFERENCES_SSID_KEY "ssid"
#define PREFERENCES_PASSWORD_KEY "password"

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
#define VALUE_HI_BYTE 10
#define VALUE_LOW_BYTE 11
#define PART_BYTE 12

#define PING_INTEVAL 1000
#define TIMEOUT_TIME 10000
#define SEARCH_INTEVAL 10000
#define RESYNC_INTEVAL 100000

Preferences preferences;
WiFiServer server(80);
WebApp app;
HardwareSerial Ultradrive(2);

byte vendorHeader[] = {0xF0, 0x00, 0x20, 0x32, 0x00};
byte searchCommand[] = {0xF0, 0x00, 0x20, 0x32, 0x20, 0x0E, 0x40, 0xF7};
byte transmitModeCommand[] = {0xF0, 0x00, 0x20, 0x32, 0x00, 0x0E, 0x3F, 0x0C, 0x00, 0xF7};
byte dumpPart0Command[] = {0xF0, 0x00, 0x20, 0x32, 0x00, 0x0E, 0x50, 0x01, 0x00, 0x00, 0xF7};
byte dumpPart1Command[] = {0xF0, 0x00, 0x20, 0x32, 0x00, 0x0E, 0x50, 0x01, 0x00, 0x01, 0xF7};
byte pingCommand[] = {0xF0, 0x00, 0x20, 0x32, 0x00, 0x0E, 0x44, 0x00, 0x00, 0xF7};

byte serialBuffer[PART_0_LENGTH];
byte serverBuffer[PART_0_LENGTH];
byte dumps0[MAX_DEVICES][PART_0_LENGTH];
byte dumps1[MAX_DEVICES][PART_1_LENGTH];
byte searchResponses[MAX_DEVICES][SEARCH_RESPONSE_LENGTH];
byte pingResponses[MAX_DEVICES][PING_RESPONSE_LENGTH];

char ssidBuffer[SSID_MAX_LENGTH];
char passwordBuffer[PASSWORD_MAX_LENGHT];

long nextSearch;
long ttls[MAX_DEVICES];
long pingTimes[MAX_DEVICES];
long resyncTimes[MAX_DEVICES];

int serialRead;

bool readingCommand;
bool mdnsStarted;
bool shouldRestart;

// Webserver handler that procecesses incoming comannds from the client
void createDirectCommand(Request &req, Response &res) {
  if (int bytesRead = req.readBytesUntil(0xF7, serverBuffer, PART_0_LENGTH)) {
    serverBuffer[bytesRead++] = 0xF7;

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
        Serial.println("Direct command sent");
      }
    }
  }

  res.noContent();
}

// Webserver handler that that connects the device to a wifi access point
void createConnection(Request &req, Response &res) {
  char name[10];
  char value[PASSWORD_MAX_LENGHT];

  req.postParam(name, 10, value, PASSWORD_MAX_LENGHT);
  if (strcmp(name, PREFERENCES_SSID_KEY) == 0) {
    preferences.putString(PREFERENCES_SSID_KEY, value);
  } else if (strcmp(name, PREFERENCES_PASSWORD_KEY) == 0) {
    preferences.putString(PREFERENCES_PASSWORD_KEY, value);
  } else {
    return res.fail();
  }

  req.postParam(name, 10, value, PASSWORD_MAX_LENGHT);
  if (strcmp(name, PREFERENCES_SSID_KEY) == 0) {
    preferences.putString(PREFERENCES_SSID_KEY, value);
  } else if (strcmp(name, PREFERENCES_PASSWORD_KEY) == 0) {
    preferences.putString(PREFERENCES_PASSWORD_KEY, value);
  } else {
    return res.fail();
  }

  preferences.getString(PREFERENCES_SSID_KEY, ssidBuffer, SSID_MAX_LENGTH);
  preferences.getString(PREFERENCES_PASSWORD_KEY, passwordBuffer, PASSWORD_MAX_LENGHT);

  WiFi.begin(ssidBuffer, passwordBuffer);

  long abortConnect = millis() + 10000;
  while (WiFi.status() != WL_CONNECTED && millis() < abortConnect) {
    delay(500);
    Serial.print(".");
  }

  if (WiFi.status() != WL_CONNECTED) {
    res.print("Could not connect.");
  } else {
    mdnsStarted = MDNS.begin(MDNS_NAME);
    res.seeOther("/ip");
  }
}

// Webserver handler that that dispays the client mdns address and local ip if they are available
void getIp(Request &req, Response &res) {
  res.success("text/plain");
  if (mdnsStarted) {
    res.print(MDNS_NAME ".local ");
  }

  res.print(WiFi.localIP());
}

// Webserver handler that that resets the device
void getRestart(Request &req, Response &res) {
   shouldRestart = true;
  res.success("text/plain");
  res.print("Restarting now.");
}

// Webserver handler that that returns the state of a singe device
void getDevice(Request &req, Response &res) {
  char buffer [17];
  int id = atoi(req.route("id"));
  int contentLength = PART_0_LENGTH + PART_1_LENGTH + PING_RESPONSE_LENGTH;
  res.set("Content-Length", itoa(contentLength, buffer, 10));
  res.success("application/binary");
  res.write(dumps0[id], PART_0_LENGTH);
  res.write(dumps1[id], PART_1_LENGTH);
  res.write(pingResponses[id], PING_RESPONSE_LENGTH);
}

// Webserver handler that that returns the short descripition of all devices
void getDevices(Request &req, Response &res) {
  char buffer [17];
  int contentLength = 0;
  long now = millis();

  for (int i = 0; i < MAX_DEVICES; i++) {
    if (ttls[i] > now) {
      contentLength += SEARCH_RESPONSE_LENGTH;
    }
  }

  res.set("Content-Length", itoa(contentLength, buffer, 10));

  res.success("application/binary");
  for (int i = 0; i < MAX_DEVICES; i++) {
    if (ttls[i] > now) {
      res.write(searchResponses[i], SEARCH_RESPONSE_LENGTH);
    }
  }
}

// Sends the search command to the device to device serial port
void search() {
  Ultradrive.write(searchCommand, 10);
  Serial.println("Search command sent");
}

// Sends a command that sets the trasmit mode to two way sync
void setTransmitMode(int deviceId) {
  transmitModeCommand[ID_BYTE] = deviceId;
  Ultradrive.write(transmitModeCommand, 10);
  Serial.println("Transmit mode command sent");
}

// Instructs the device to dump the first part off full memory dump
void dumpPart0(int deviceId) {
  dumpPart0Command[ID_BYTE] = deviceId;
  Ultradrive.write(dumpPart0Command, 11);
  Serial.println("Dump part 0 command sent");
}

// Instructs the device to dump the second part off full memory dump
void dumpPart1(int deviceId) {
  dumpPart1Command[ID_BYTE] = deviceId;
  Ultradrive.write(dumpPart1Command, 11);
  Serial.println("Dump part 1 command sent");
}

// Pings the device. Device responds with a message that contains current channgel levels
void ping(int deviceId) {
  pingCommand[ID_BYTE] = deviceId;
  Ultradrive.write(pingCommand, 11);
  Serial.println("Ping command sent");
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
    Serial.println(l.high.byte);
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

  if (b == 0xF0) {
    readingCommand = true;
    serialRead = 0;
  }

  if (readingCommand && (serialRead < PART_0_LENGTH)) {
    serialBuffer[serialRead++] = b;
  }

  if (b == 0xF7) {
    readingCommand = false;

    if (!memcmp(serialBuffer, vendorHeader, 5)) {
      int deviceId = serialBuffer[ID_BYTE];
      int command = serialBuffer[COMMAND_BYTE];

      switch (command) {
        case SEARCH_RESPONSE: {
            if (serialRead == SEARCH_RESPONSE_LENGTH) {
              Serial.println("Search response received");
              memcpy(&searchResponses[deviceId], serialBuffer, SEARCH_RESPONSE_LENGTH);

              if (!ttls[deviceId]) {
                resyncTimes[deviceId] = (millis() + RESYNC_INTEVAL);
                setTransmitMode(deviceId);
                dumpPart0(deviceId);
              }
            }

            break;
          }
        case DUMP_RESPONSE: {
            int part = serialBuffer[PART_BYTE];

            if (part == 0) {
              if (serialRead == PART_0_LENGTH) {
                Serial.println("Dump part 0  response received");
                memcpy(&dumps0[deviceId], serialBuffer, PART_0_LENGTH);
                dumpPart1(deviceId);
              }
            } else if (part == 1) {
              if (serialRead == PART_1_LENGTH) {
                Serial.println("Dump part 1 response received");
                memcpy(&dumps1[deviceId], serialBuffer, PART_1_LENGTH);
                ping(deviceId);
              }
            }

            break;
          }
        case PING_RESPONSE: {
            if (serialRead == PING_RESPONSE_LENGTH) {
              Serial.println("Ping response received");
              memcpy(&pingResponses[deviceId], serialBuffer, PING_RESPONSE_LENGTH);
              ttls[deviceId] = millis() + TIMEOUT_TIME;
            }

            break;
          }
        case DIRECT_COMMAND: {
            Serial.println("Direct command received");
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

  preferences.begin(PREFERENCES_ID, false);
  preferences.getString(PREFERENCES_SSID_KEY, ssidBuffer, SSID_MAX_LENGTH);
  preferences.getString(PREFERENCES_PASSWORD_KEY, passwordBuffer, PASSWORD_MAX_LENGHT);

  WiFi.begin(ssidBuffer, passwordBuffer);

  long abortConnect = millis() + 10000;
  while (WiFi.status() != WL_CONNECTED && millis() < abortConnect) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());

  mdnsStarted = MDNS.begin(MDNS_NAME);

  WiFi.softAP(SOFT_AP_SSID, SOFT_AP_PASSWORD);

  IPAddress ip = WiFi.softAPIP();
  Serial.print("AP IP address: ");
  Serial.println(ip);

  server.begin();
  
  app.get("/api/devices", &getDevices);
  app.get("/api/devices/:id", &getDevice);
  app.post("/api/commands", &createDirectCommand);
  app.post("/connect.html", &createConnection);
  app.get("/ip", &getIp);
  app.get("/reset", &getRestart);
  
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
        dumpPart0(i);

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

  WiFiClient client = server.available();

  if (client.connected()) {
    app.process(&client);
  }

  if(shouldRestart){
  ESP.restart();
  }
}


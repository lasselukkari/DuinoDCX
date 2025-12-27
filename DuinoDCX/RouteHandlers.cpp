#include "RouteHandlers.h"

// SSE client storage - platform-specific
// On Arduino/ESP32: WiFiClient sseClients[MAX_SSE_CLIENTS];
// On macOS: we need a different approach with Client pointers
#if defined(ESP32) || defined(ESP8266)
#include <WiFi.h>
WiFiClient sseClients[MAX_SSE_CLIENTS];
#else
// macOS native: use Client pointers stored elsewhere
// The main loop will handle client storage
#endif

void getDevice(Request &req, Response &res) {
  res.set("Content-Type", "application/binary");
  deviceManagerPtr->writeDevice(&res);
}

void getStatus(Request &req, Response &res) {
  res.set("Content-Type", "application/binary");
  deviceManagerPtr->writeDeviceStatus(&res);
}

void selectDevice(Request &req, Response &res) {
  byte buffer[100];

  if (!req.readBytes(buffer, 100)) {
    return res.sendStatus(400);
  }

  int id = atoi((const char *)buffer);
  deviceManagerPtr->setSelected(id);
  res.sendStatus(204);
}

void getState(Request &req, Response &res) {
  res.set("Content-Type", "application/binary");
  res.write(deviceManagerPtr->getSelected());
  deviceManagerPtr->writeDevice(&res);
  deviceManagerPtr->writeDevices(&res);
}

void createDirectCommand(Request &req, Response &res) {
  while (req.left()) {
    deviceManagerPtr->processOutgoing(&req);
  }
  res.sendStatus(204);
}

void refresh(Request &req, Response &res) {
  (void)req;
  deviceManagerPtr->syncSelectedDevice();
  res.sendStatus(200);
}

void sseEventsHandler(Request &req, Response &res) {
  (void)req;
  res.status(200);
  res.set("Content-Type", "text/event-stream");
  res.set("Cache-Control", "no-cache");
  res.set("Connection", "keep-alive");
  res.flush();
  res.keepOpen();

  // Trigger full sync when a new client connects
  deviceManagerPtr->syncSelectedDevice();
}

#if defined(ESP32) || defined(ESP8266)
int countSseClients() {
  int count = 0;
  for (int i = 0; i < MAX_SSE_CLIENTS; i++) {
    if (sseClients[i].connected())
      count++;
  }
  return count;
}

void sendToSseClients(const uint8_t *data, size_t length) {
  for (int i = 0; i < MAX_SSE_CLIENTS; i++) {
    if (sseClients[i].connected()) {
      // SSE data format: "data: <base64-or-hex>\n\n"
      // For binary MIDI data, send as hex
      sseClients[i].print("data: ");
      for (size_t j = 0; j < length; j++) {
        if (data[j] < 16)
          sseClients[i].print("0");
        sseClients[i].print(data[j], HEX);
      }
      sseClients[i].print("\n\n");
    }
  }
}

void storeSseClient(WiFiClient &client) {
  for (int i = 0; i < MAX_SSE_CLIENTS; i++) {
    if (!sseClients[i].connected()) {
      sseClients[i] = client;
      break;
    }
  }
}
#else
// macOS: functions defined in DuinoDCXMac.cpp
extern int countSseClients();
extern void sendToSseClients(const uint8_t *data, size_t length);
#endif

void setupApiRoutes(Router &router) {
  router.get("/state", &getState);
  router.get("/status", &getStatus);
  router.put("/selected", &selectDevice);
  router.post("/commands", &createDirectCommand);
  router.get("/events", &sseEventsHandler);
  router.post("/refresh", &refresh);
}

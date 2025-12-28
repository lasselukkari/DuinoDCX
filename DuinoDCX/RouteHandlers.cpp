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

char pendingClientId[40] = {0};

// NOTE: getDevice, getStatus, selectDevice, getState were removed
// as they relied on internal state buffers that have been refactored out.
// The UI now relies exclusively on SSE for state updates.

void createDirectCommand(Request &req, Response &res) {
  // Buffer for reading the command
  uint8_t buffer[256];
  int bytesRead = 0;

  while (req.left()) {
    // Read a byte
    int b = req.read();
    if (b >= 0 && (size_t)bytesRead < sizeof(buffer)) {
      buffer[bytesRead++] = (uint8_t)b;
    }
  }

  // Send buffered data to device
  if (bytesRead > 0) {
    deviceManagerPtr->write(buffer, bytesRead);

    // Broadcast to all SSE clients to keep them in sync
    sendToSseClients(buffer, bytesRead, nullptr); // nullptr = broadcast to all
  }

  res.sendStatus(204);
}

void refresh(Request &req, Response &res) {
  (void)req;
  deviceManagerPtr->syncSelectedDevice();
  deviceManagerPtr->syncSelectedDevice();
  res.sendStatus(200);
}

void handleSysex(Request &req, Response &res) {
  char *clientId = req.get("X-Client-Id");
  deviceManagerPtr->setActiveClient(clientId);

  while (req.left()) {
    deviceManagerPtr->processOutgoing(&req);
  }
  res.sendStatus(204);
}

void sseEventsHandler(Request &req, Response &res) {
  (void)req;

  // Extract client ID from query string if present
  // e.g. /api/events?clientId=xxxxx
  if (!req.query("clientId", pendingClientId, 39)) {
    pendingClientId[0] = '\0';
  } else {
    // Ensure null termination (req.query likely does it but good to be safe)
    pendingClientId[39] = '\0';
  }

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
extern void sendToSseClients(const uint8_t *data, size_t length,
                             const char *targetClientId);
#endif

void setupApiRoutes(Router &router) {
  // NOTE: /state and /status routes removed - UI uses SSE exclusively
  router.post("/commands", &createDirectCommand);
  router.post("/sysex", &handleSysex);
  router.get("/events", &sseEventsHandler);
  router.post("/refresh", &refresh);
}

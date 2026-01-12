#include "RouteHandlers.h"

// Unified SSE client storage
// Works on both platforms since PlatformClient is copyable
// (WiFiClient/MacOSClient)
struct SseClientSlot {
  PlatformClient client;
  char clientId[40];
};

static SseClientSlot sseClients[MAX_SSE_CLIENTS];

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

int countSseClients() {
  int count = 0;
  for (int i = 0; i < MAX_SSE_CLIENTS; i++) {
    if (sseClients[i].client.connected())
      count++;
  }
  return count;
}

void sendToSseClients(const uint8_t *data, size_t length,
                      const char *targetClientId) {
  for (int i = 0; i < MAX_SSE_CLIENTS; i++) {
    if (sseClients[i].client.connected()) {
      // If targetClientId is specified, check for match
      if (targetClientId && targetClientId[0] != '\0') {
        if (strcmp(sseClients[i].clientId, targetClientId) != 0) {
          continue;
        }
      }

      // Build SSE message: "data: <hex>\n\n"
      // Pre-calculate size: 6 (data: ) + length*2 (hex) + 2 (\n\n)
      size_t msgLen = 6 + length * 2 + 2;
      char *message = (char *)malloc(msgLen + 1);
      if (!message)
        continue;

      char *p = message;
      memcpy(p, "data: ", 6);
      p += 6;

      const char hexChars[] = "0123456789ABCDEF";
      for (size_t j = 0; j < length; j++) {
        *p++ = hexChars[(data[j] >> 4) & 0xF];
        *p++ = hexChars[data[j] & 0xF];
      }
      memcpy(p, "\n\n", 2);

#ifdef PLATFORM_NATIVE
      // Native: send as chunked transfer encoding
      char chunkHeader[16];
      snprintf(chunkHeader, sizeof(chunkHeader), "%zx\r\n", msgLen);
      sseClients[i].client.write((uint8_t *)chunkHeader, strlen(chunkHeader));
      sseClients[i].client.write((uint8_t *)message, msgLen);
      sseClients[i].client.write((uint8_t *)"\r\n", 2);
#else
      // Arduino: WiFiClient handles chunking automatically
      sseClients[i].client.write((uint8_t *)message, msgLen);
#endif

      free(message);
    }
  }
}

void storeSseClient(PlatformClient &client, const char *clientId) {
  for (int i = 0; i < MAX_SSE_CLIENTS; i++) {
    if (!sseClients[i].client.connected()) {
      sseClients[i].client = client;
      if (clientId && strlen(clientId) > 0) {
        strncpy(sseClients[i].clientId, clientId, 39);
        sseClients[i].clientId[39] = '\0';
      } else {
        sseClients[i].clientId[0] = '\0';
      }
      break;
    }
  }
}

void setupApiRoutes(Router &router) {
  // NOTE: /state and /status routes removed - UI uses SSE exclusively
  router.post("/commands", &createDirectCommand);
  router.post("/sysex", &handleSysex);
  router.get("/events", &sseEventsHandler);
  router.post("/refresh", &refresh);
}

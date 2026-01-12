#include "RouteHandlers.h"

// Global serial pointer (set in DuinoDCX.ino setup())
extern PlatformSerial *serialPort;
extern int rtsPin;
extern int ctsPin;
extern bool flowControl;

// Unified SSE client storage
// Works on both platforms since PlatformClient is copyable
// (WiFiClient/MacOSClient)
static PlatformClient sseClients[MAX_SSE_CLIENTS];

// Buffer for accumulating serial data before sending to SSE
static const size_t SSE_BUFFER_SIZE = 1015;
static uint8_t sseBuffer[SSE_BUFFER_SIZE];

// Buffer for incoming commands (to check if direct command for broadcast)
static const size_t CMD_BUFFER_SIZE = 256;
static uint8_t cmdBuffer[CMD_BUFFER_SIZE];

// SysEx command byte position and direct command value
static const int COMMAND_BYTE_INDEX = 6;
static const uint8_t CMD_DIRECT = 0x20;

// Forward incoming serial bytes to SSE (called from loop())
// Buffers until SysEx terminator (0xF7) before sending
void processSerialToSse() {
  if (serialPort->available() > 0) {
    // Read until terminator (0xF7) or buffer full
    size_t bytesRead =
        serialPort->readBytesUntil(0xF7, sseBuffer, SSE_BUFFER_SIZE - 1);
    if (bytesRead > 0) {
      // Add the terminator back (readBytesUntil doesn't include it)
      sseBuffer[bytesRead] = 0xF7;
      bytesRead++;
      sendToSseClients(sseBuffer, bytesRead);
    }
  }
}

// Forward command to serial, and broadcast direct commands to all SSE clients
void forwardToSerial(Request &req, Response &res) {
  // Read command into buffer first (so we can check if it's a direct command)
  size_t cmdLen = 0;
  while (req.left() && cmdLen < CMD_BUFFER_SIZE) {
    cmdBuffer[cmdLen++] = (uint8_t)req.read();
  }

  if (cmdLen == 0) {
    res.sendStatus(400);
    return;
  }

  // Flow control: raise RTS, wait for CTS
  if (flowControl) {
    digitalWrite(rtsPin, HIGH);
    unsigned long start = millis();
    while (millis() - start <= 1000) {
      if (digitalRead(ctsPin) == HIGH)
        break;
    }
  }

  // Write to serial
  serialPort->write(cmdBuffer, cmdLen);

  // Flow control: wait for TX complete, lower RTS
  if (flowControl) {
    serialPort->flush();
    digitalWrite(rtsPin, LOW);
  }

  // If this is a direct command, broadcast to all SSE clients
  // Direct commands change settings and the device doesn't echo them back
  if (cmdLen > COMMAND_BYTE_INDEX &&
      cmdBuffer[COMMAND_BYTE_INDEX] == CMD_DIRECT) {
    sendToSseClients(cmdBuffer, cmdLen);
  }

  res.sendStatus(204);
}

void sseEventsHandler(Request &req, Response &res) {
  (void)req;

  res.status(200);
  res.set("Content-Type", "text/event-stream");
  res.set("Cache-Control", "no-cache");
  res.set("Connection", "keep-alive");
  res.flush();
  res.keepOpen();
}

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
      sseClients[i].write((uint8_t *)chunkHeader, strlen(chunkHeader));
      sseClients[i].write((uint8_t *)message, msgLen);
      sseClients[i].write((uint8_t *)"\r\n", 2);
#else
      // Arduino: WiFiClient handles chunking automatically
      sseClients[i].write((uint8_t *)message, msgLen);
#endif

      free(message);
    }
  }
}

void storeSseClient(PlatformClient &client) {
  for (int i = 0; i < MAX_SSE_CLIENTS; i++) {
    if (!sseClients[i].connected()) {
      sseClients[i] = client;
      break;
    }
  }
}

void setupApiRoutes(Router &router) {
  router.post("/commands", &forwardToSerial);
  router.get("/events", &sseEventsHandler);
}

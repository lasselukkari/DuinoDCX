#include "RouteHandlers.h"

#ifdef PLATFORM_NATIVE
#include "../MacOSNative/MacOSSocket.h"
#endif

// Global serial pointer (set in DuinoDCX.ino setup())
extern PlatformSerial *serialPort;
extern int rtsPin;
extern int ctsPin;
extern bool flowControl;

// WebSocket instance
WebSocket ws;

// Buffer for accumulating serial data before sending to WebSocket
static const size_t WS_BUFFER_SIZE = 1015;
static uint8_t wsBuffer[WS_BUFFER_SIZE];

// SysEx command byte position and direct command value
static const int COMMAND_BYTE_INDEX = 6;
static const uint8_t CMD_DIRECT = 0x20;

// Forward incoming serial bytes to WebSocket clients (called from loop())
// Buffers until SysEx terminator (0xF7) before sending
void processSerialToWs() {
  if (!serialPort)
    return; // No serial port available

  if (serialPort->available() > 0) {
    // Read until terminator (0xF7) or buffer full
    size_t bytesRead =
        serialPort->readBytesUntil(0xF7, wsBuffer, WS_BUFFER_SIZE - 1);
    if (bytesRead > 0) {
      // Add the terminator back (readBytesUntil doesn't include it)
      wsBuffer[bytesRead] = 0xF7;
      bytesRead++;
      ws.broadcastBinary(wsBuffer, bytesRead);
    }
  }
}

// WebSocket message handler - forward received data to serial
void onWsMessage(WebSocketMessage &msg) {
  // Read message into buffer
  uint8_t cmdBuffer[256];
  size_t cmdLen = 0;

  while (msg.available() && cmdLen < sizeof(cmdBuffer)) {
    int b = msg.read();
    if (b >= 0) {
      cmdBuffer[cmdLen++] = (uint8_t)b;
    }
  }

  if (cmdLen == 0) {
    return;
  }

  // Skip serial write if no serial port available
  if (!serialPort) {
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

  // If this is a direct command, broadcast to all WebSocket clients
  // Direct commands change settings and the device doesn't echo them back
  if (cmdLen > COMMAND_BYTE_INDEX &&
      cmdBuffer[COMMAND_BYTE_INDEX] == CMD_DIRECT) {
    ws.broadcastBinary(cmdBuffer, cmdLen);
  }
}

void wsUpgradeHandler(Request &req, Response &res) {
#ifdef PLATFORM_NATIVE
  // On native platform, we need to heap-allocate the client because:
  // - req.client() returns a pointer to stack-allocated client
  // - This pointer becomes invalid when request scope ends
  // - MacOSClient copy constructor shares socket via reference counting
  char *keyHeader = req.get("Sec-WebSocket-Key");
  if (!keyHeader || strlen(keyHeader) == 0) {
    res.sendStatus(400);
    return;
  }

  MacOSClient *wsClient =
      new MacOSClient(*static_cast<MacOSClient *>(req.client()));
  if (ws.upgrade(wsClient, keyHeader)) {
    res.bypassResponse();
  } else {
    delete wsClient;
    res.sendStatus(400);
  }
#else
  // On Arduino, WiFiClient handles socket sharing via reference counting
  // The clean API handles everything internally
  if (!ws.upgrade(req, res)) {
    res.sendStatus(400);
  }
#endif
}

void setupApiRoutes(Router &router) {
  (void)router; // Not used for API routes; WS is registered directly in app

  // Register WebSocket message handler
  ws.onMessage(onWsMessage);
}

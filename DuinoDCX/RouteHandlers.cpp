#include "RouteHandlers.h"

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

// Coordination message prefix (for multi-client sync)
static const uint8_t COORD_PREFIX = 0xFF;
static const uint8_t COORD_YOU_ARE_PINGER = 0x10;

// Track which client is the designated pinger (-1 = none)
static int pingerClientId = -1;

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

  // Check for coordination message (0xFF prefix)
  // These are broadcast to all clients, NOT sent to serial
  if (cmdBuffer[0] == COORD_PREFIX) {
    ws.broadcastBinary(cmdBuffer, cmdLen);
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

// WebSocket upgrade handler - platform-agnostic implementation
// Client cloning is handled internally via setClientCloneFunc()
void wsUpgradeHandler(Request &req, Response &res) {
  if (!ws.upgrade(req, res)) {
    res.sendStatus(400);
  }
}

// WebSocket connect handler - assign pinger role to first client
void onWsConnect(int clientId) {
  if (pingerClientId < 0) {
    pingerClientId = clientId;
    // Send "you are the pinger" message to this client
    uint8_t msg[] = {COORD_PREFIX, COORD_YOU_ARE_PINGER, (uint8_t)clientId};
    ws.sendBinary(clientId, msg, sizeof(msg));
  }
}

// WebSocket disconnect handler - reassign pinger if needed
void onWsDisconnect(int clientId) {
  if (clientId == pingerClientId) {
    // Find next connected client to be pinger
    pingerClientId = -1;
    for (int i = 0; i < WEBSOCKET_MAX_CLIENTS; i++) {
      if (ws.connected(i)) {
        pingerClientId = i;
        uint8_t msg[] = {COORD_PREFIX, COORD_YOU_ARE_PINGER, (uint8_t)i};
        ws.sendBinary(i, msg, sizeof(msg));
        break;
      }
    }
  }
}

void setupApiRoutes(Router &router) {
  (void)router; // Not used for API routes; WS is registered directly in app

  // Register WebSocket handlers
  ws.onMessage(onWsMessage);
  ws.onConnect(onWsConnect);
  ws.onDisconnect(onWsDisconnect);
}

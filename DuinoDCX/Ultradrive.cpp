#include "Ultradrive.h"
#include "RouteHandlers.h"

Ultradrive::Ultradrive(PlatformSerial *serial, int rtsPin, int ctsPin)
    : selectedDevice(0), serial(serial), rtsPin(rtsPin), ctsPin(ctsPin),
      isFirstRun(true), flowControl(false) {}

void Ultradrive::enableFlowControl(bool enabled) { flowControl = enabled; }

void Ultradrive::setActiveClient(const char *clientId) {
  if (clientId) {
    strncpy(activeClientId, clientId, sizeof(activeClientId) - 1);
    activeClientId[sizeof(activeClientId) - 1] = '\0';
  } else {
    activeClientId[0] = '\0';
  }
}

void Ultradrive::processIncoming(unsigned long now) {
  while (serial->available() > 0) {
    readCommands(now);
  }

  if (isFirstRun) {
    isFirstRun = false;
    lastSearch = now;
    return search();
  }

  if (now - lastSearch >= SEARCH_INTEVAL) {
    Serial.print(now);
    Serial.println(": Searching for devices.");
    lastSearch = now;
    return search();
  }

  if (now - lastPing >= PING_INTEVAL) {
    lastPing = now;
    Serial.print(now);
    Serial.println(": Pinging selected device.");
    return ping(selectedDevice);
  }
}

void Ultradrive::syncSelectedDevice() {
  unsigned long now = millis();
  Serial.print(now);
  Serial.println(": Syncing selected device.");
  setTransmitMode(selectedDevice);
  dump(selectedDevice, 0);
  dump(selectedDevice, 1);
}

void Ultradrive::setSelected(int selected) { selectedDevice = selected; }

int Ultradrive::getSelected() { return selectedDevice; }

void Ultradrive::processOutgoing(Request *req) {
  while (req->left()) {
    int bytesRead = req->readBytes(serverBuffer, PART_0_LENGTH);
    if (bytesRead > 0) {
      write(serverBuffer, bytesRead);
    }
  }
}

size_t Ultradrive::write(const uint8_t *buffer, size_t size) {
  size_t written = 0;

  if (requestToSend(1000)) {
    written = serial->write(buffer, size);
  }

  endSend();

  return written;
}

bool Ultradrive::requestToSend(int timeout) {
  if (!flowControl) {
    return true;
  }

  unsigned long start = millis();
  digitalWrite(rtsPin, HIGH);

  while (millis() - start <= timeout) {
    if (digitalRead(ctsPin) == HIGH) {
      return true;
    }
  }

  return false;
}

void Ultradrive::endSend() {
  if (flowControl) {
    digitalWrite(rtsPin, LOW);
  }
}

void Ultradrive::search() {
  byte searchCommand[] = {0xF0, 0x00, 0x20, 0x32, 0x20, 0x0E, 0x40, TERMINATOR};
  write(searchCommand, sizeof(searchCommand));
}

void Ultradrive::setTransmitMode(int deviceId) {
  byte transmitModeCommand[] = {0xF0, 0x00, 0x20, 0x32, (byte)deviceId,
                                0x0E, 0x3F, 0x0C, 0x00, TERMINATOR};
  write(transmitModeCommand, sizeof(transmitModeCommand));
}

void Ultradrive::ping(int deviceId) {
  byte pingCommand[] = {0xF0, 0x00, 0x20, 0x32, (byte)deviceId,
                        0x0E, 0x44, 0x00, 0x00, TERMINATOR};
  write(pingCommand, sizeof(pingCommand));
}

void Ultradrive::dump(int deviceId, int part) {
  byte dumpCommand[] = {0xF0, 0x00, 0x20, 0x32,       (byte)deviceId, 0x0E,
                        0x50, 0x01, 0x00, (byte)part, TERMINATOR};
  write(dumpCommand, sizeof(dumpCommand));
}

void Ultradrive::readCommands(unsigned long now) {
  byte b = serial->read();

  if (b == COMMAND_START) {
    Serial.print(now);
    Serial.println(": Started receiving data from device");
    readingCommand = true;
    serialRead = 0;
  }

  if (readingCommand && (serialRead < PART_0_LENGTH)) {
    serialBuffer[serialRead++] = b;
  } else {
    readingCommand = false;
    serialRead = 0;
    return;
  }

  if (b == TERMINATOR) {
    Serial.print(now);
    Serial.println(": Received end of data from device");
    readingCommand = false;
    byte vendorHeader[] = {0xF0, 0x00, 0x20, 0x32};

    // Check first 4 bytes only: F0 00 20 32
    if (memcmp(serialBuffer, vendorHeader, 4) != 0) {
      return;
    }

    int command = serialBuffer[COMMAND_BYTE];
    switch (command) {
    case SEARCH_RESPONSE: {
      if (serialRead == SEARCH_RESPONSE_LENGTH) {
        Serial.print(now);
        Serial.println(": Received search response");
        int deviceId = serialBuffer[ID_BYTE];
        devices[deviceId].lastResponse = millis();
        memcpy(&devices[deviceId].response, serialBuffer,
               SEARCH_RESPONSE_LENGTH);
        // Broadcast to SSE clients
        sendToSseClients(serialBuffer, SEARCH_RESPONSE_LENGTH);
      }

      break;
    }
    case DUMP_RESPONSE: {
      // Check for page dump response: bytes 7-11 are 00 01 00 0C 00
      // This distinguishes memory page dumps from edit buffer sync responses
      // NOTE: 0x0C (12) is the correct value per captured traffic, not 0x0D
      // (13)
      bool isPageDump = (serialRead >= 13 && serialBuffer[7] == 0x00 &&
                         serialBuffer[8] == 0x01 && serialBuffer[9] == 0x00 &&
                         serialBuffer[10] == 0x0C && serialBuffer[11] == 0x00);

      if (isPageDump) {
        // Page/slot dump response - broadcast to SSE for backup
        Serial.print(now);
        Serial.print(": Received page dump, slot=");
        Serial.println(serialBuffer[12]);
        sendToSseClients(serialBuffer, serialRead, activeClientId);
      } else {
        // Edit buffer sync response (parts 0 or 1)
        int part = serialBuffer[PART_BYTE];

        if (part == 0) {
          if (invalidateSync == true) {
            break;
          }
          if (serialRead == PART_0_LENGTH) {
            Serial.print(now);
            Serial.println(": Received state part 0");
            // Broadcast to SSE clients
            sendToSseClients(serialBuffer, PART_0_LENGTH);
          }
        } else if (part == 1) {
          if (invalidateSync == true) {
            invalidateSync = false;
            break;
          }
          if (serialRead == PART_1_LENGTH) {
            Serial.print(now);
            Serial.println(": Received state part 1");
            // Broadcast to SSE clients
            sendToSseClients(serialBuffer, PART_1_LENGTH);
          }
        }
      }

      break;
    }
    case PING_RESPONSE: {
      if (serialRead == PING_RESPONSE_LENGTH) {
        Serial.print(now);
        Serial.println(": Received ping response");
        memcpy(pingResponse, serialBuffer, PING_RESPONSE_LENGTH);
        // Broadcast to SSE clients
        sendToSseClients(serialBuffer, PING_RESPONSE_LENGTH);
      }

      break;
    }
    case DIRECT_COMMAND: {
      Serial.print(now);
      Serial.println(": Received commands");
      // Broadcast DIRECT_COMMAND to SSE clients
      sendToSseClients(serialBuffer, serialRead);
      break;
    }
    case ACK_COMMAND:
    case REQUEST_COMMAND: {
      // These are flow control messages for restore/dump operations
      // We must broadcast them to SSE clients so the UI can proceed
      Serial.print(now);
      Serial.print(": Received flow control: ");
      Serial.println(command);
      sendToSseClients(serialBuffer, serialRead, activeClientId);
      break;
    }
    default: {
    }
    }
  }
}

byte Ultradrive::vendorHeader[5] = {0xF0, 0x00, 0x20, 0x32, 0x00};

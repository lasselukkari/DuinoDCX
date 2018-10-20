#ifndef ULTRADRIVE_H_
#define ULTRADRIVE_H_

#ifndef MAX_DEVICES
#define MAX_DEVICES 16
#endif

#ifndef PING_INTEVAL
#define PING_INTEVAL 1000
#endif

#ifndef TIMEOUT_TIME
#define TIMEOUT_TIME 20000
#endif

#ifndef SEARCH_INTEVAL
#define SEARCH_INTEVAL 5000
#endif

#ifndef RESYNC_INTEVAL
#define RESYNC_INTEVAL 5000
#endif

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

#include <Arduino.h>
#include <Stream.h>
#include "aWOT.h"


struct HighByte {
  int part;
  int byte;
};

struct MiddleBit {
  int part;
  int byte;
  int index;
};

struct LowByte {
  int part;
  int byte;
};

struct DataLocation {
  LowByte low;
  MiddleBit middle;
  HighByte high;
};


class Ultradrive {

  public:
    Ultradrive(HardwareSerial *serial, int rtsPin, int ctsPin);
    void processIncoming(unsigned long now);
    void processOutgoing(Request* req);
    void writeDevice(Response* res, int deviceId);
    void writeDevices(Response* res);

  private:
    size_t write(const uint8_t *buffer, size_t size);
    bool requestToSend(int timeout);
    void endSend();
    void search();
    void setTransmitMode(int deviceId);
    void ping(int deviceId);
    void dump(int deviceId, int part);
    void readCommands(unsigned long now);
    void patchBuffer(int deviceId, int low, int high, DataLocation l);

    struct Device {
      bool isNew;
      bool invalidateSync;
      bool dumpStarted;
      byte dump0[PART_0_LENGTH];
      byte dump1[PART_1_LENGTH];
      byte searchResponse[SEARCH_RESPONSE_LENGTH];
      byte pingResponse[PING_RESPONSE_LENGTH];
      unsigned long lastPong;
      unsigned long lastPing;
      unsigned long lastResync;
    } devices[MAX_DEVICES];

    HardwareSerial *serial;
    int rtsPin;
    int ctsPin;

    bool isFirstRun;
    bool readingCommand;
    int serialRead;

    unsigned long lastSearch;
    unsigned long lastReconnect;

    byte serialBuffer[PART_0_LENGTH];
    byte serverBuffer[PART_0_LENGTH];

    static DataLocation setupLocations[22];
    static DataLocation inputLocations[4][62];
    static DataLocation outputLocations[6][74];

    static byte vendorHeader[5];
};

#endif


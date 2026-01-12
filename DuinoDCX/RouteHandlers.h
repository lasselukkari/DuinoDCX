#ifndef ROUTE_HANDLERS_H
#define ROUTE_HANDLERS_H

#include "Platform.h"
#include "Ultradrive.h"
#include "aWOT.h"

using namespace awot;

// Maximum number of concurrent SSE clients
#define MAX_SSE_CLIENTS 4

extern Ultradrive *deviceManagerPtr;
extern char pendingClientId[40];

// Existing handlers
void getDevice(Request &req, Response &res);
void getStatus(Request &req, Response &res);
void selectDevice(Request &req, Response &res);
void getState(Request &req, Response &res);
void createDirectCommand(Request &req, Response &res);

void refresh(Request &req, Response &res);
void handleSysex(Request &req, Response &res);

// SSE handler
void sseEventsHandler(Request &req, Response &res);

// SSE client management (unified across platforms)
int countSseClients();
void sendToSseClients(const uint8_t *data, size_t length,
                      const char *targetClientId = nullptr);
void storeSseClient(PlatformClient &client, const char *clientId = nullptr);

void setupApiRoutes(Router &router);

#endif

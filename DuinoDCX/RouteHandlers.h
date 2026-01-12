#ifndef ROUTE_HANDLERS_H
#define ROUTE_HANDLERS_H

#include "Platform.h"
#include "aWOT.h"

using namespace awot;

// Maximum number of concurrent SSE clients
#define MAX_SSE_CLIENTS 4

// Forward serial bytes to SSE clients (called from loop())
void processSerialToSse();

// HTTP handler: forward request body to serial, broadcast direct commands
void forwardToSerial(Request &req, Response &res);

// SSE handler
void sseEventsHandler(Request &req, Response &res);

// SSE client management
int countSseClients();
void sendToSseClients(const uint8_t *data, size_t length);
void storeSseClient(PlatformClient &client);

void setupApiRoutes(Router &router);

#endif

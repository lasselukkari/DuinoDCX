#ifndef ROUTE_HANDLERS_H
#define ROUTE_HANDLERS_H

#include "Platform.h"
#include "aWOT.h"

using namespace awot;

// WebSocket instance (defined in RouteHandlers.cpp)
extern WebSocket ws;

// Forward serial bytes to WebSocket clients (called from loop())
void processSerialToWs();

// WebSocket message handler (receives commands from clients)
void onWsMessage(WebSocketMessage &msg);

// WebSocket upgrade handler
void wsUpgradeHandler(Request &req, Response &res);

void setupApiRoutes(Router &router);

#endif

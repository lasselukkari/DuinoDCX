#ifndef ROUTE_HANDLERS_H
#define ROUTE_HANDLERS_H

#include "Ultradrive.h"
#include "aWOT.h"

using namespace awot;

extern Ultradrive *deviceManagerPtr;

void getDevice(Request &req, Response &res);
void getStatus(Request &req, Response &res);
void selectDevice(Request &req, Response &res);
void getState(Request &req, Response &res);
void createDirectCommand(Request &req, Response &res);

void setupApiRoutes(Router &router);

#endif

#include "RouteHandlers.h"

void getDevice(Request &req, Response &res) {
  res.set("Content-Type", "application/binary");
  deviceManagerPtr->writeDevice(&res);
}

void getStatus(Request &req, Response &res) {
  res.set("Content-Type", "application/binary");
  deviceManagerPtr->writeDeviceStatus(&res);
}

void selectDevice(Request &req, Response &res) {
  byte buffer[100];

  if (!req.readBytes(buffer, 100)) {
    return res.sendStatus(400);
  }

  int id = atoi((const char *)buffer);
  deviceManagerPtr->setSelected(id);
  res.sendStatus(204);
}

void getState(Request &req, Response &res) {
  res.set("Content-Type", "application/binary");
  res.write(deviceManagerPtr->getSelected());
  deviceManagerPtr->writeDevice(&res);
  deviceManagerPtr->writeDevices(&res);
}

void createDirectCommand(Request &req, Response &res) {
  while (req.left()) {
    deviceManagerPtr->processOutgoing(&req);
  }
  res.sendStatus(204);
}

void setupApiRoutes(Router &router) {
  router.get("/state", &getState);
  router.get("/status", &getStatus);
  router.put("/selected", &selectDevice);
  router.post("/commands", &createDirectCommand);
}

# DuinoDCX macOS Native

This directory contains the macOS native port of DuinoDCX. It allows running the 
DuinoDCX HTTP server and Ultradrive serial communication on macOS without Arduino hardware.

## Prerequisites

- macOS with Xcode Command Line Tools (`xcode-select --install`)
- USB-to-Serial adapter connected to Ultradrive DSP device

## Setup

1. Clone the ArduinoCore-API library:
   ```bash
   make setup
   ```

2. Build the application:
   ```bash
   make
   ```

## Usage

```bash
./DuinoDCXMac
```

To use a different serial port, set the environment variable:

```bash
DUINODCX_SERIAL_PORT=/dev/cu.usbserial-XXXX ./DuinoDCXMac
```

Default serial port: `/dev/cu.usbserial-1430`

## Endpoints

The HTTP server runs on port 3000:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/state` | GET | Get current device state |
| `/api/status` | GET | Get device status |
| `/api/selected` | PUT | Select a device |
| `/api/commands` | POST | Send direct commands |
| `/api/version` | GET | Get version info |
| `/health` | GET | Health check |

## Testing

```bash
# Test health endpoint
curl http://localhost:3000/health

# Get version
curl http://localhost:3000/api/version

# Get device state (requires connected DSP)
curl http://localhost:3000/api/state
```

## Differences from ESP32 Version

This macOS port does not include:
- WiFi configuration
- mDNS service discovery
- OTA firmware updates
- Settings persistence (Preferences)
- Static file serving

These features are ESP32-specific. The macOS version focuses on serial communication
with the Ultradrive device and the HTTP API.

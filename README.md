
DuinoDCX
========
ESP32 microcontroller based WIFI controller for the [Behringer Ultradrive Pro / DCX2496](http://www.musictri.be/p/P0B6H). No wifi router or internet connection needed, no applications to install.

## Disclaimer
I take no responsibility if you destroy your sound system using this.

The project is free software and there is no official support. 

## Demo
http://duinodcx.herokuapp.com/

### Demo Video
[![DuinoDCX Demo Video](https://img.youtube.com/vi/Z5CDjev1ydA/0.jpg)](https://www.youtube.com/watch?v=Z5CDjev1ydA)
  
## Development
Install [Node.js](https://nodejs.org), [Arduino IDE](https://www.arduino.cc/en/Main/Software) and the support for the [ESP32](https://github.com/espressif/arduino-esp32#installation-instructions) boards.

### Required parts
![DuinoDCX Hardware](https://i.imgur.com/zYhEit9.jpg)

* ESP32 development board (5€)
* RS232 To TTL converter (1€)
* Wires for connecting the ESP32 to the RS232 To TTL converter
* Male to male null modem cable (use gender changers if required)

### Wiring
* RS232 `RXD` to ESP32 `D16`
* RS232 `TXD` to ESP32 `D17`
* RS232 `VCC` to ESP32 `3V3`
* RS232 `GROUND` to ESP32 `GROUND`

### Building and uploading
Run `npm install` to fetch dependencies.

To build the project run `npm run build` and then `npm run dist`.

The dist command will read the minified files from the `build` dir and then rewrites the gzipped hex payloads for the static files to `DuinoDCX/StaticFiles.h` file.

Open the `DuinoDCX/DuinoDCX.ino` Arduino sketch file using Arduino IDE. Set the Partition Scheme to Minimal SPIFFS (Large apps with OTA) and upload the project to the microcontroller.

Precompiled binaires can be uploded using the ESP32 OTAWebUpdater example or using the built in functionality after the initial installation.

## Connecting to the device
The device creates a wifi network with SSID `DCX2496`. The default password is `Ultradrive`.

Connect your computer or mobile device to the network and point the browser to address `http://192.168.4.1`. The default username and password are `DCX2496` and `Ultradrive`. The UI will take a few seconds to load.

If you want to make the UI available in your local network open the `Wifi Setup` config panel. Fill in your wifi credential and submit the form. Wifi credentials are persisted to the device memory.

If your client device supports MDNS the controller will be also available at `http://ultradrive.local`. You may need to add `http://` to the url when using it the first time in a browser.
  - For Linux, install Avahi (http://avahi.org/).
  - For Windows, install Bonjour (http://www.apple.com/support/bonjour/).
  - For Mac OSX and iOS support is built in through Bonjour already.
  - For Android, you are out of luck.

## Security Credentials
All credentials can be changed using the UI. The defaults are defined beginning of the [main sketch file](https://github.com/lasselukkari/DuinoDCX/blob/master/DuinoDCX/DuinoDCX.ino). In case you forget your password short digital pin 13 to the ground for one seconds while the device is booting up. This will restore the default credentials.

## Acknowledgements
Thanks to Ilkka Huhtakallio for contributing the transfer function code. Without that this project would not have all those pretty graphs.

## License
[MIT](LICENSE)

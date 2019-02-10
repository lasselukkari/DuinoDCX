
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

## User Guide
[DuinoDCX User Guide](https://lasselukkari.github.io/DuinoDCX). The guide includes step by step instruction for building the harware setup and goes trough the software installation and basic usage.  Contributions to the manual are really welcome. 
  
## Development
Install [Node.js](https://nodejs.org), [Arduino IDE](https://www.arduino.cc/en/Main/Software) and the support for the [ESP32](https://github.com/espressif/arduino-esp32#installation-instructions) boards.

### Required Hardware

* ESP32 development board
* RS232 To TTL converter

or

* The [SerialChiller](https://github.com/lasselukkari/SerialChiller) board

### Building and uploading
Run `npm install` to fetch dependencies.

To build the project run `npm run build` and then `npm run dist`.

The dist command will read the minified files from the `build` dir and then rewrites the gzipped hex payloads for the static files to `DuinoDCX/StaticFiles.h` file.

Open the `DuinoDCX/DuinoDCX.ino` Arduino sketch file using Arduino IDE. Set the Partition Scheme to Minimal SPIFFS (Large apps with OTA) and upload the project to the microcontroller.

Precompiled binaires can be uploded using the ESP32 OTAWebUpdater example or using the built in functionality after the initial installation.

## Acknowledgements
Thanks to Ilkka Huhtakallio for contributing the transfer function code. Without that this project would not have all those pretty graphs.

## License
[MIT](LICENSE)

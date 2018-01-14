
DuinoDCX
========
Standalone WIFI remote controller for the [Behringer Ultradrive Pro (DCX2496)](http://www.musictri.be/p/P0B6H)

![DuinoDCX Screen Shot](https://i.imgur.com/dEzK3mx.png)

## Disclaimer
This is not a production ready application. I take no responsibility if your sound system gets destroyed by using this.

The project has been so far tested with two different devices that both have the v1.17 firmware. It has not been tested with the latest revision of the DCX2496. It is highly possible that some adjustments have to made for other versions.

The project is free software and there are is no official support provided for it. 

## Demo
### Demo UI
http://duinodcx.herokuapp.com/

### Demo Video
[![DuinoDCX Demo Video](https://img.youtube.com/vi/Z5CDjev1ydA/0.jpg)](https://www.youtube.com/watch?v=Z5CDjev1ydA)

## Installation
Install the [Arduino IDE](https://www.arduino.cc/en/Main/Software) and the support for the
[ESP32](https://github.com/espressif/arduino-esp32#installation-instructions) boards.

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

### Uploading
Open the  `DuinoDCX/DuinoDCX.ino` Arduino sketch file using Arduino IDE and upload the project to the microcontroller.

### Connecting to the device
By default the device creates a wifi network with SSID `DuinoDCX`. The default username and password are `DuinoDCX` and `Ultradrive`. 

Connect your computer or mobile device to the network and point the browser to address `http://192.168.4.1`.  The UI will take a few seconds to load.

If you want to make the UI available in your local network open page `http://192.168.4.1/connect.html` . Fill in your wifi credential and submit the form. Wifi credentials are persisted to the device memory. The device will now try to connect to the network. 

If connection to the network is successful the browser will redirect to page `http://192.168.4.1/ip`. This page will display the devices ip address in the network. If the network support MDNS the device will be also available at `http://duinodcx.local` 

## Development
This project was bootstrapped with [Create React App](https://github.com/facebookincubator/create-react-app).

### Building the static payloads for the mircocontroller
Run `npm run build` and then `npm run dist`

The dist command will read the minified files from the `build` dir and then rewrites the gzipped hex payloads for the static files to `DuinoDCX/StaticFiles.h` file.

## Acknowledgements
Thanks to Ilkka Huhtakallio for contributing the transfer function code. Without that this project would not have all those pretty graphs.

## License
[MIT](LICENSE)
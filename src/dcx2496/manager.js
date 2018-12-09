import {EventEmitter} from 'events';
import DCX2496 from './dcx2496';

class Manager extends EventEmitter {
  constructor() {
    super();
    this.devices = [];
    this.bounce = false;
    this.bouncing = 0;
    this.selectedDevice = null;
    this.tempDumps = [];
  }

  getDeviceById(deviceId) {
    return this.devices[deviceId];
  }

  pollSelectedDevice() {
    fetch(`/api/devices/${this.selectedDevice}`, {credentials: 'same-origin'})
      .then(res => res.arrayBuffer())
      .then(messages => {
        let message = [];

        new Uint8Array(messages).forEach(hex => {
          if (hex === 247) {
            this.handleMessage(message);
            message = [];
          } else {
            message.push(hex);
          }
        });

        if (this.devices[this.selectedDevice].ready) {
          this.emit('update', this.devices[this.selectedDevice]);
        }

        setTimeout(() => this.pollSelectedDevice(), 1000);
      })
      .catch(error => {
        console.log(error);
        setTimeout(() => this.pollSelectedDevice(), 1000);
      });
  }

  pollDevices() {
    fetch(`/api/devices`, {credentials: 'same-origin'})
      .then(res => res.arrayBuffer())
      .then(messages => {
        let message = [];

        new Uint8Array(messages).forEach(hex => {
          if (hex === 247) {
            this.handleMessage(message);
            message = [];
          } else {
            message.push(hex);
          }
        });

        setTimeout(() => {
          this.pollDevices();
        }, 1000);
      })
      .catch(error => {
        console.log(error);
        setTimeout(() => {
          this.pollDevices();
        }, 1000);
      });
  }

  sendCommand(data) {
    this.bounce = true;
    this.bouncing++;

    setTimeout(() => {
      if (!--this.bouncing) {
        this.bounce = false;
      }
    }, 1000);

    function hexStringToByte(str) {
      const a = [];
      for (let i = 0, len = str.length; i < len; i += 2) {
        a.push(parseInt(str.substr(i, 2), 16));
      }

      return new Uint8Array(a);
    }

    fetch(`/api/commands`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: {'Content-Type': 'application/binary'},
      body: hexStringToByte(data)
    }).catch(console.log);
  }

  handleMessage(message) {
    const dataType = message[DCX2496.constants.COMMAND_BYTE];
    const deviceId = message[DCX2496.constants.ID_BYTE];

    if (
      dataType === DCX2496.constants.SEARCH_RESPONSE &&
      !this.devices[deviceId]
    ) {
      this.devices[deviceId] = new DCX2496(message);
      if (this.selectedDevice === null) {
        this.selectedDevice = deviceId;
        this.pollSelectedDevice();
      }
    } else if (dataType === DCX2496.constants.DUMP_RESPONSE) {
      if (this.bounce) {
        return;
      }

      if (message[DCX2496.constants.PART_BYTE] === DCX2496.constants.PART_0) {
        this.tempDumps[deviceId] = message;
      } else if (
        message[DCX2496.constants.PART_BYTE] === DCX2496.constants.PART_1
      ) {
        if (this.tempDumps[deviceId]) {
          this.devices[deviceId].setSyncDumps([
            this.tempDumps[deviceId],
            message
          ]);
        }

        this.tempDumps[deviceId] = null;
      }
    } else if (dataType === DCX2496.constants.PING_RESPONSE) {
      this.devices[deviceId].updateLevels(message);
    } else if (dataType === DCX2496.constants.DIRECT_COMMAND) {
      this.devices[deviceId].setCommands(message);
    }
  }

  updateDevice(deviceId, data) {
    const commands = Array.isArray(data) ? data : [data];
    const device = this.devices[deviceId];

    commands.forEach(command => device[command.param](command));

    this.emit('update', device, true);
    const message = device.flushCommands();
    this.sendCommand(message);
  }
}

export default Manager;

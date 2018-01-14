const constants = require('./constants');
const commands = require('./commands');

class DCX2496 {
  static _isBitSet(number, index) {
    return (number & (1 << index)) !== 0;
  }

  static _clearBit(number, index) {
    return number & ~(1 << index);
  }

  static _reverseCommandData({type, min, step, values}, value) {
    if (type === 'bool') {
      return value !== 0;
    } else if (type === 'enum') {
      return values[value];
    } else if (type === 'number') {
      return min + (step * value);
    }
  }

  static _getCommandData({type, min, step, values}, parameter) {
    if (type === 'bool') {
      return parameter ? 1 : 0;
    } else if (type === 'enum') {
      return values.indexOf(parameter);
    } else if (type === 'number') {
      return Math.round(Math.abs(min - parameter) / step);
    }
  }

  static camelize(str) {
    return str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, (match, index) => {
      if (Number(match) === 0) {
        return '';
      }

      return index === 0 ? match.toLowerCase() : match.toUpperCase();
    });
  }

  static _getValue(parts, {bits6, bit7, bits8}) {
    let value = parts[bits6.part][bits6.index];

    if (bit7) {
      const data = parts[bit7.part];
      value += DCX2496._isBitSet(data[bit7.index], bit7.bit) ? 128 : 0;
    }

    if (bits8) {
      const data = parts[bits8.part];
      value += data[bits8.index] * 256;
    }

    return value;
  }

  static _toPaddedHex(number, length) {
    let hex = number.toString(16);

    while (hex.length < length) {
      hex = '0' + hex;
    }

    return hex.toUpperCase();
  }

  static search() {
    return 'F0002032200E40F7';
  }

  constructor(searchResponse) {
    this.id = searchResponse[4];
    this.version = Number.parseFloat(
      `${searchResponse[7]}.${searchResponse[8]}`
    );
    this.name = searchResponse
      .slice(9, 25)
      .map(number => String.fromCharCode(number))
      .join('')
      .trim();
    this.setup = {};
    this.inputs = {};
    this.outputs = {};
    this.state = {channels: {}};
    this.ready = false;

    constants.OUTPUTS.concat(['A', 'B', 'C']).forEach(channelId => {
      this.state.channels[channelId] = {};
    });

    constants.CHANNELS.forEach((channelId, index) => {
      const group = index < 4 ? 'inputs' : 'outputs';
      this[group][channelId] = {
        eqs: {1: {}, 2: {}, 3: {}, 4: {}, 5: {}, 6: {}, 7: {}, 8: {}, 9: {}}
      };
    });
    this.commandBuffer = [];
  }

  hexId() {
    return DCX2496._toPaddedHex(this.id, 2);
  }

  pushCommand(target, parameter, data) {
    const hexTarget = DCX2496._toPaddedHex(target, 2);
    const hexParameter = DCX2496._toPaddedHex(parameter, 2);
    const valueLow = DCX2496._toPaddedHex(Math.round(data % 128), 2);
    const valueHigh = DCX2496._toPaddedHex(Math.floor(data / 128), 2);

    this.commandBuffer.push(
      `${hexTarget}${hexParameter}${valueHigh}${valueLow}`
    );
  }

  flushCommands() {
    const data = this.commandBuffer.join('');
    const length = this.commandBuffer.length;
    this.commandBuffer = [];
    return `F0002032${this.hexId()}0E20${DCX2496._toPaddedHex(
      length,
      2
    )}${data}F7`;
  }

  ping() {
    return `F0002032${this.hexId()}0E440000F7`;
  }

  setTransmitMode(value) {
    this.transmitMode = value;
    const mode = {rx: '0400', tx: '0800', rxtx: '0C00'}[value];
    return `F0002032${this.hexId()}0E3F${mode}F7`;
  }

  syncDump0() {
    return `F0002032${this.hexId()}0E50010000F7`;
  }

  syncDump1() {
    return `F0002032${this.hexId()}0E50010001F7`;
  }

  updateLevels(pingResponse) {
    ['A', 'B', 'C'].forEach((channelId, index) => {
      const data = pingResponse[index + 8];
      this.state.channels[channelId].level = DCX2496._clearBit(data, 5);
      this.state.channels[channelId].limited = DCX2496._isBitSet(data, 5);
      this.state.channels[channelId].muted = this.inputs[channelId].mute;
    });

    constants.OUTPUTS.forEach((channelId, index) => {
      const data = pingResponse[index + 11];
      this.state.channels[channelId].level = DCX2496._clearBit(data, 5);
      this.state.channels[channelId].limited = DCX2496._isBitSet(data, 5);
      this.state.channels[channelId].muted = this.outputs[channelId].mute;
    });

    this.state.free = pingResponse[21];
  }

  setCommands(commandsData) {
    const commandCount = commandsData[7];

    for (let i = 0; i <= commandCount; i++) {
      const target = commandsData[(i * 4) + 8];
      const parameter = commandsData[(i * 4) + 9];
      const value = (commandsData[(i * 4) + 10] * 128) + commandsData[(i * 4) + 11];

      if (target === 0) {
        const index = parameter - (parameter > 11 ? 10 : 2);
        const command = commands.setupCommands[index];
        const camelName = DCX2496.camelize(command.name);

        this.setup[camelName] = DCX2496._reverseCommandData(command, value);
      } else if (target >= 1 && target <= 10 && parameter <= 63) {
        const group = target < 5 ? 'inputs' : 'outputs';
        const id = constants.CHANNELS[target - 1];

        if (parameter <= 18) {
          const command = commands.inputOutputCommands[parameter - 2];
          const paramName = DCX2496.camelize(command.name);

          this[group][id][paramName] = DCX2496._reverseCommandData(
            command,
            value
          );
        } else {
          const command = commands.eqCommands[(parameter - 19) % 5];
          const eq = Math.floor((parameter - 19) / 5) + 1;
          const paramName = DCX2496.camelize(command.name);

          this[group][id].eqs[eq][paramName] = DCX2496._reverseCommandData(
            command,
            value
          );
        }
      } else if (target >= 5 && target <= 10) {
        const command = commands.outputCommands[parameter - 64];
        const paramName = DCX2496.camelize(command.name);
        const id = constants.CHANNELS[target - 1];

        this.outputs[id][paramName] = DCX2496._reverseCommandData(
          command,
          value
        );
      }
    }
  }

  setSyncDumps(parts) {
    commands.setupCommands.forEach(command => {
      const paramName = DCX2496.camelize(command.name);
      const value = DCX2496._getValue(parts, command.syncResponse);
      this.setup[paramName] = DCX2496._reverseCommandData(command, value);
    });

    commands.inputOutputCommands.forEach(command => {
      command.syncResponses.forEach((syncResponse, index) => {
        const group = index < 4 ? 'inputs' : 'outputs';
        const id = constants.CHANNELS[index];
        const paramName = DCX2496.camelize(command.name);
        const value = DCX2496._getValue(parts, syncResponse);

        this[group][id][paramName] = DCX2496._reverseCommandData(
          command,
          value
        );
      });
    });

    commands.outputCommands.forEach(command => {
      command.syncResponses.forEach((syncResponse, index) => {
        const id = constants.OUTPUTS[index];
        const paramName = DCX2496.camelize(command.name);
        const value = DCX2496._getValue(parts, syncResponse);

        this.outputs[id][paramName] = DCX2496._reverseCommandData(
          command,
          value
        );
      });
    });

    commands.eqCommands.forEach(command => {
      constants.CHANNELS.forEach((channelId, ioIndex) => {
        for (let eqIndex = 0; eqIndex < 9; eqIndex++) {
          const group = ioIndex < 4 ? 'inputs' : 'outputs';
          const eq = eqIndex + 1;
          const paramName = DCX2496.camelize(command.name);
          const syncResponse = command.syncResponses[(ioIndex * 9) + eqIndex];
          const value = DCX2496._getValue(parts, syncResponse);

          this[group][channelId].eqs[eq][
            paramName
          ] = DCX2496._reverseCommandData(command, value);
        }
      });
    });

    this.ready = true;
  }
}

commands.setupCommands.forEach((command, index) => {
  const camelName = DCX2496.camelize(command.name);

  DCX2496.prototype[camelName] = function ({value}) {
    this.setup[camelName] = value;

    const data = DCX2496._getCommandData(command, value);
    this.setup[camelName] = DCX2496._reverseCommandData(command, data);
    const commandNumber = index + (index > 9 ? 10 : 2);

    this.pushCommand(0, commandNumber, data);
  };
});

commands.inputOutputCommands.forEach((command, index) => {
  const camelName = DCX2496.camelize(command.name);

  DCX2496.prototype[camelName] = function ({group, channelId, value}) {
    const channelNumber =
      group === 'inputs' ?
        constants.INPUTS.indexOf(channelId) + 1 :
        constants.OUTPUTS.indexOf(channelId) + 5;
    const commandNumber = index + 2;
    const data = DCX2496._getCommandData(command, value);
    this[group][channelId][camelName] = DCX2496._reverseCommandData(
      command,
      data
    );

    return this.pushCommand(channelNumber, commandNumber, data);
  };
});

commands.eqCommands.forEach((command, index) => {
  const camelName = DCX2496.camelize(command.name);

  DCX2496.prototype[camelName] = function ({group, channelId, eq, value}) {
    const channelNumber =
      group === 'inputs' ?
        constants.INPUTS.indexOf(channelId) + 1 :
        constants.OUTPUTS.indexOf(channelId) + 5;

    const commandNumber = index + ((eq - 1) * 5) + 19;
    const data = DCX2496._getCommandData(command, value);
    this[group][channelId].eqs[eq][camelName] = DCX2496._reverseCommandData(
      command,
      data
    );

    this.pushCommand(channelNumber, commandNumber, data);
  };
});

commands.outputCommands.forEach((command, index) => {
  const camelName = DCX2496.camelize(command.name);
  DCX2496.prototype[camelName] = function ({channelId, value}) {
    const data = DCX2496._getCommandData(command, value);
    const output = constants.OUTPUTS.indexOf(channelId) + 5;
    const commandNumber = index + 64;
    this.outputs[channelId][camelName] = DCX2496._reverseCommandData(
      command,
      data
    );

    this.pushCommand(output, commandNumber, data);
  };
});

DCX2496.commands = commands;
DCX2496.constants = constants;

module.exports = DCX2496;

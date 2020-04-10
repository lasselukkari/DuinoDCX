const constants = require('./constants');
const commands = require('./commands');

class Parser {
  static camelize(string) {
    return string.replace(/^\w|[A-Z]|\b\w|\s+/g, (match, index) => {
      if (Number(match) === 0) {
        return '';
      }

      return index === 0 ? match.toLowerCase() : match.toUpperCase();
    });
  }

  static reverseCommandData({type, min, step, values}, value) {
    if (type === 'bool') {
      return value !== 0;
    }

    if (type === 'enum') {
      return values[value];
    }

    if (type === 'number') {
      return min + step * value;
    }
  }

  static getCommandData({type, min, step, values}, parameter) {
    if (type === 'bool') {
      return parameter ? 1 : 0;
    }

    if (type === 'enum') {
      return values.indexOf(parameter);
    }

    if (type === 'number') {
      return Math.round(Math.abs(min - parameter) / step);
    }
  }

  static hexStringToByte(string) {
    const a = [];
    for (let i = 0, length = string.length; i < length; i += 2) {
      a.push(Number.parseInt(string.slice(i, i + 2), 16));
    }

    return new Uint8Array(a);
  }

  static clearBit(number, index) {
    return number & ~(1 << index);
  }

  static isBitSet(number, index) {
    return (number & (1 << index)) !== 0;
  }

  static toPaddedHex(number, length) {
    let hex = number.toString(16);

    while (hex.length < length) {
      hex = '0' + hex;
    }

    return hex.toUpperCase();
  }

  static getValue(parts, {bits6, bit7, bits8}) {
    let value = parts[bits6.part][bits6.index];

    if (bit7) {
      const data = parts[bit7.part];
      value += Parser.isBitSet(data[bit7.index], bit7.bit) ? 128 : 0;
    }

    if (bits8) {
      const data = parts[bits8.part];
      value += data[bits8.index] * 256;
    }

    return value;
  }

  static parseDevices(devices) {
    const messages = [];
    let newMessage = [];

    devices.forEach((hex) => {
      if (hex === 247) {
        messages.push(newMessage);
        newMessage = [];
      } else {
        newMessage.push(hex);
      }
    });

    return messages.map((message) => ({
      id: message[4],
      version: Number.parseFloat(`${message[7]}.${message[8]}`),
      name: message
        .slice(9, 25)
        .map((number) => String.fromCharCode(number))
        .join('')
        .trim()
    }));
  }

  static parseDevice(parts) {
    const state = {setup: {}, inputs: {}, outputs: {}};

    constants.CHANNELS.forEach((channelId, index) => {
      const group = index < 4 ? 'inputs' : 'outputs';
      state[group][channelId] = {
        eqs: {1: {}, 2: {}, 3: {}, 4: {}, 5: {}, 6: {}, 7: {}, 8: {}, 9: {}}
      };
    });

    commands.setupCommands.forEach((command) => {
      const parameterName = Parser.camelize(command.name);
      const value = Parser.getValue(parts, command.syncResponse);
      state.setup[parameterName] = Parser.reverseCommandData(command, value);
    });

    commands.inputOutputCommands.forEach((command) => {
      command.syncResponses.forEach((syncResponse, index) => {
        const group = index < 4 ? 'inputs' : 'outputs';
        const id = constants.CHANNELS[index];
        const parameterName = Parser.camelize(command.name);
        const value = Parser.getValue(parts, syncResponse);

        state[group][id][parameterName] = Parser.reverseCommandData(
          command,
          value
        );
      });
    });

    commands.outputCommands.forEach((command) => {
      command.syncResponses.forEach((syncResponse, index) => {
        const id = constants.OUTPUTS[index];
        const parameterName = Parser.camelize(command.name);
        const value = Parser.getValue(parts, syncResponse);

        state.outputs[id][parameterName] = Parser.reverseCommandData(
          command,
          value
        );
      });
    });

    commands.eqCommands.forEach((command) => {
      constants.CHANNELS.forEach((channelId, ioIndex) => {
        for (let eqIndex = 0; eqIndex < 9; eqIndex++) {
          const group = ioIndex < 4 ? 'inputs' : 'outputs';
          const eq = eqIndex + 1;
          const parameterName = Parser.camelize(command.name);
          const syncResponse = command.syncResponses[ioIndex * 9 + eqIndex];
          const value = Parser.getValue(parts, syncResponse);

          state[group][channelId].eqs[eq][
            parameterName
          ] = Parser.reverseCommandData(command, value);
        }
      });
    });

    return state;
  }

  static parseStatus(pingResponse) {
    const buffer = new Uint8Array(pingResponse);

    const inputs = ['A', 'B', 'C'].map((name, index) => {
      const data = buffer[index + 8];

      const level = Parser.clearBit(data, 5);
      const isLimited = Parser.isBitSet(data, 5);

      return {name, level, isLimited};
    });

    const outputs = constants.OUTPUTS.map((name, index) => {
      const data = buffer[index + 11];
      const level = Parser.clearBit(data, 5);
      const isLimited = Parser.isBitSet(data, 5);

      return {name, level, isLimited};
    });

    const free = buffer[21];

    return {inputs, outputs, free};
  }

  static parseState(state) {
    const buffer = new Uint8Array(state);
    const selected = Number(buffer.slice(0, 1));
    const part0Buffer = buffer.slice(1, 1016);
    const part1buffer = buffer.slice(1016, 1927);
    const devicesBuffer = buffer.slice(1927);
    const device = Parser.parseDevice([part0Buffer, part1buffer]);
    const devices = Parser.parseDevices(devicesBuffer);

    device.isReady = devices.some(({id}) => id === selected);

    return {selected, device, devices};
  }

  static serializeCommands(deviceId, device, data) {
    const commands = Array.isArray(data) ? data : [data];
    const commandBuffer = commands
      .map((command) => Parser[command.param](device, command))
      .join('');

    const command = `F0002032${Parser.toPaddedHex(
      deviceId,
      2
    )}0E20${Parser.toPaddedHex(commands.length, 2)}${commandBuffer}F7`;

    return Parser.hexStringToByte(command);
  }

  static serialize(target, parameter, data) {
    const hexTarget = Parser.toPaddedHex(target, 2);
    const hexParameter = Parser.toPaddedHex(parameter, 2);
    const valueLow = Parser.toPaddedHex(Math.round(data % 128), 2);
    const valueHigh = Parser.toPaddedHex(Math.floor(data / 128), 2);

    return `${hexTarget}${hexParameter}${valueHigh}${valueLow}`;
  }
}

commands.setupCommands.forEach((command, index) => {
  const camelName = Parser.camelize(command.name);

  Parser[camelName] = function (device, {value}) {
    const data = Parser.getCommandData(command, value);
    const commandNumber = index + (index > 9 ? 10 : 2);
    device.setup[camelName] = value;

    return Parser.serialize(0, commandNumber, data);
  };
});

commands.inputOutputCommands.forEach((command, index) => {
  const camelName = Parser.camelize(command.name);

  Parser[camelName] = function (device, {group, channelId, value}) {
    const channelNumber =
      group === 'inputs'
        ? constants.INPUTS.indexOf(channelId) + 1
        : constants.OUTPUTS.indexOf(channelId) + 5;
    const commandNumber = index + 2;
    const data = Parser.getCommandData(command, value);
    device[group][channelId][camelName] = value;

    return Parser.serialize(channelNumber, commandNumber, data);
  };
});

commands.eqCommands.forEach((command, index) => {
  const camelName = Parser.camelize(command.name);

  Parser[camelName] = function (device, {group, channelId, eq, value}) {
    const channelNumber =
      group === 'inputs'
        ? constants.INPUTS.indexOf(channelId) + 1
        : constants.OUTPUTS.indexOf(channelId) + 5;

    const commandNumber = index + (eq - 1) * 5 + 19;
    const data = Parser.getCommandData(command, value);
    device[group][channelId].eqs[eq][camelName] = value;

    return Parser.serialize(channelNumber, commandNumber, data);
  };
});

commands.outputCommands.forEach((command, index) => {
  const camelName = Parser.camelize(command.name);

  Parser[camelName] = function (device, {channelId, value}) {
    const data = Parser.getCommandData(command, value);
    const output = constants.OUTPUTS.indexOf(channelId) + 5;
    const commandNumber = index + 64;
    device.outputs[channelId][camelName] = value;

    return Parser.serialize(output, commandNumber, data);
  };
});

Parser.commands = commands;

export default Parser;

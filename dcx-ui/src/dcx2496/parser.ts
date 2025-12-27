/* eslint-disable no-bitwise, @typescript-eslint/no-extraneous-class */
import constants from './constants.ts';
import * as commands from './commands.ts';

export type Device = {
  id: number;
  version: number;
  name: string;
};

export type EQ = {
  [key: string]: unknown;
  eQType?: string;
  eQFrequency?: number;
  eQGain?: number;
  eQQ?: number;
  eQShelving?: string;
};

export type Channel = {
  // Allow dynamic properties but use unknown instead of any
  [key: string]: unknown;
  // Known channel properties from commands
  channelName?: string;
  gain?: number;
  mute?: boolean;
  isDelayOn?: boolean;
  longDelay?: number;
  shortDelay?: number;
  isEQOn?: boolean;
  eQNumber?: number;
  // Dynamic EQ properties
  isDynamicEQOn?: boolean;
  dynamicEQType?: string;
  dynamicEQFrequency?: number;
  dynamicEQGain?: number;
  dynamicEQQ?: number;
  dynamicEQShelving?: string;
  dynamicEQAttack?: string;
  dynamicEQRelease?: string;
  dynamicEQRatio?: string;
  dynamicEQThreshold?: number;
  // Crossover properties
  highpassFilter?: string;
  highpassFrequency?: number;
  lowpassFilter?: string;
  lowpassFrequency?: number;
  // Limiter properties
  isLimiterOn?: boolean;
  limiterThreshold?: number;
  limiterRelease?: string;
  // Phase properties
  polarity?: string;
  phase?: number;
  // Output properties
  source?: string;
  // EQ banks
  eqs: Record<string, EQ>;
};

export type Setup = {
  [key: string]: unknown;
  airTemperature?: number;
  isDelayCorrectionOn?: boolean;
  delayUnits?: string;
};

export type State = {
  setup: Setup;
  inputs: Record<string, Channel>;
  outputs: Record<string, Channel>;
  selected?: number;
  device?: State;
  devices?: Device[];
  isReady?: boolean;
};

export type Status = {
  inputs: Array<{ name: string; level: number; isLimited: boolean }>;
  outputs: Array<{ name: string; level: number; isLimited: boolean }>;
  free: number;
};

class Parser {
  static [key: string]: any;
  static commands: typeof commands;

  static camelize(string: string): string {
    // eslint-disable-next-line unicorn/prefer-string-replace-all
    return string.replace(
      /^\w|[A-Z]|\b\w|\s+/g,
      (match: string, index: number) => {
        if (Number(match) === 0) {
          return '';
        }

        return index === 0 ? match.toLowerCase() : match.toUpperCase();
      },
    );
  }

  static reverseCommandData(
    command: commands.Command,
    value: number,
  ): number | boolean | string {
    const { type, min = 0, step = 1, values } = command;

    if (type === 'bool') {
      return value !== 0;
    }

    if (type === 'enum' && values) {
      return values[value];
    }

    if (type === 'number') {
      return min + step * value;
    }

    return value;
  }

  static getCommandData(
    command: commands.Command,
    parameter: number | boolean | string,
  ): number {
    const { type, min = 0, step = 1, values } = command;

    if (type === 'bool') {
      return parameter ? 1 : 0;
    }

    if (type === 'enum' && values) {
      return values.indexOf(parameter as string);
    }

    if (type === 'number') {
      return Math.round(Math.abs(min - (parameter as number)) / step);
    }

    return 0;
  }

  static hexStringToByte(string: string): Uint8Array {
    const a = [];
    for (let i = 0, { length } = string; i < length; i += 2) {
      a.push(Number.parseInt(string.slice(i, i + 2), 16));
    }

    return new Uint8Array(a);
  }

  static clearBit(number: number, index: number): number {
    return number & ~(1 << index);
  }

  static isBitSet(number: number, index: number): boolean {
    return (number & (1 << index)) !== 0;
  }

  static toPaddedHex(number: number, length: number): string {
    let hex = number.toString(16);

    while (hex.length < length) {
      hex = '0' + hex;
    }

    return hex.toUpperCase();
  }

  static getValue(
    parts: Uint8Array[],
    { bits6, bit7, bits8 }: commands.SyncResponse,
  ): number {
    if (!bits6) return 0;

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

  static parseDevices(devices: Uint8Array | number[]): Device[] {
    const messages: number[][] = [];
    let newMessage: number[] = [];

    for (const hex of devices) {
      if (hex === 247) {
        messages.push(newMessage);
        newMessage = [];
      } else {
        newMessage.push(hex);
      }
    }

    return messages.map((message) => ({
      id: message[4],
      version: Number.parseFloat(`${message[7]}.${message[8]}`),
      name: message
        .slice(9, 25)
        .map((number) => String.fromCodePoint(number))
        .join('')
        .trim(),
    }));
  }

  static parseDevice(parts: Uint8Array[]): State {
    const state: State = { setup: {}, inputs: {}, outputs: {} };

    for (const [index, channelId] of constants.CHANNELS.entries()) {
      const group = index < 4 ? 'inputs' : 'outputs';
      state[group][channelId] = {
        eqs: { 1: {}, 2: {}, 3: {}, 4: {}, 5: {}, 6: {}, 7: {}, 8: {}, 9: {} },
      };
    }

    for (const command of commands.setupCommands) {
      if (!command.syncResponse) continue;
      const parameterName = Parser.camelize(command.name);
      const value = Parser.getValue(parts, command.syncResponse);
      state.setup[parameterName] = Parser.reverseCommandData(command, value);
    }

    for (const command of commands.inputOutputCommands) {
      if (!command.syncResponses) continue;
      for (const [index, syncResponse] of command.syncResponses.entries()) {
        const group = index < 4 ? 'inputs' : 'outputs';
        const id = constants.CHANNELS[index];
        const parameterName = Parser.camelize(command.name);
        const value = Parser.getValue(parts, syncResponse);

        state[group][id][parameterName] = Parser.reverseCommandData(
          command,
          value,
        );
      }
    }

    for (const command of commands.outputCommands) {
      if (!command.syncResponses) continue;
      for (const [index, syncResponse] of command.syncResponses.entries()) {
        const id = constants.OUTPUTS[index];
        const parameterName = Parser.camelize(command.name);
        const value = Parser.getValue(parts, syncResponse);

        state.outputs[id][parameterName] = Parser.reverseCommandData(
          command,
          value,
        );
      }
    }

    for (const command of commands.eqCommands) {
      if (!command.syncResponses) continue;
      for (const [ioIndex, channelId] of constants.CHANNELS.entries()) {
        for (let eqIndex = 0; eqIndex < 9; eqIndex++) {
          const group = ioIndex < 4 ? 'inputs' : 'outputs';
          const eq = eqIndex + 1;
          const parameterName = Parser.camelize(command.name);
          const syncResponse = command.syncResponses[ioIndex * 9 + eqIndex];
          const value = Parser.getValue(parts, syncResponse);

          state[group][channelId].eqs[eq][parameterName] =
            Parser.reverseCommandData(command, value);
        }
      }
    }

    return state;
  }

  static parseStatus(pingResponse: ArrayBuffer): Status {
    const buffer = new Uint8Array(pingResponse);

    const inputs = ['A', 'B', 'C'].map((name, index) => {
      const data = buffer[index + 8];

      const level = Parser.clearBit(data, 5);
      const isLimited = Parser.isBitSet(data, 5);

      return { name, level, isLimited };
    });

    const outputs = constants.OUTPUTS.map((name, index) => {
      const data = buffer[index + 11];
      const level = Parser.clearBit(data, 5);
      const isLimited = Parser.isBitSet(data, 5);

      return { name, level, isLimited };
    });

    const free = buffer[21];

    return { inputs, outputs, free };
  }

  static parseState(state: ArrayBuffer): State {
    const buffer = new Uint8Array(state);
    const selected = Number(buffer.slice(0, 1));
    const part0Buffer = buffer.slice(1, 1016);
    const part1buffer = buffer.slice(1016, 1927);
    const devicesBuffer = buffer.slice(1927);
    const device = Parser.parseDevice([part0Buffer, part1buffer]);
    const devices = Parser.parseDevices(devicesBuffer);

    device.isReady = devices.some(({ id }) => id === selected);

    return {
      selected,
      device,
      devices,
      setup: device.setup,
      inputs: device.inputs,
      outputs: device.outputs,
    };
  }

  static serializeCommands(
    deviceId: number,
    device: State,
    data: any[] | any,
  ): Uint8Array {
    const commands = Array.isArray(data) ? data : [data];
    const commandBuffer = commands
      .map((command: any) => {
        const handler = Parser[command.param] as (
          device: State,
          command: any,
        ) => string;
        return handler(device, command);
      })
      .join('');

    const command = `F0002032${Parser.toPaddedHex(
      deviceId,
      2,
    )}0E20${Parser.toPaddedHex(commands.length, 2)}${commandBuffer}F7`;

    return Parser.hexStringToByte(command);
  }

  static serialize(target: number, parameter: number, data: number): string {
    const hexTarget = Parser.toPaddedHex(target, 2);
    const hexParameter = Parser.toPaddedHex(parameter, 2);
    const valueLow = Parser.toPaddedHex(Math.round(data % 128), 2);
    const valueHigh = Parser.toPaddedHex(Math.floor(data / 128), 2);

    return `${hexTarget}${hexParameter}${valueHigh}${valueLow}`;
  }
}

for (const [index, command] of commands.setupCommands.entries()) {
  const camelName = Parser.camelize(command.name);

  Parser[camelName] = function (device: State, { value }: { value: number }) {
    const data = Parser.getCommandData(command, value);
    const commandNumber = index + (index > 9 ? 10 : 2);
    device.setup[camelName] = value;

    return Parser.serialize(0, commandNumber, data);
  };
}

for (const [index, command] of commands.inputOutputCommands.entries()) {
  const camelName = Parser.camelize(command.name);

  Parser[camelName] = function (
    device: State,
    {
      group,
      channelId,
      value,
    }: { group: 'inputs' | 'outputs'; channelId: string; value: number },
  ) {
    const channelNumber =
      group === 'inputs'
        ? constants.INPUTS.indexOf(channelId) + 1
        : constants.OUTPUTS.indexOf(channelId) + 5;
    const commandNumber = index + 2;
    const data = Parser.getCommandData(command, value);
    device[group][channelId][camelName] = value;

    return Parser.serialize(channelNumber, commandNumber, data);
  };
}

for (const [index, command] of commands.eqCommands.entries()) {
  const camelName = Parser.camelize(command.name);

  Parser[camelName] = function (
    device: State,
    {
      group,
      channelId,
      eq,
      value,
    }: {
      group: 'inputs' | 'outputs';
      channelId: string;
      eq: number;
      value: number;
    },
  ) {
    const channelNumber =
      group === 'inputs'
        ? constants.INPUTS.indexOf(channelId) + 1
        : constants.OUTPUTS.indexOf(channelId) + 5;

    const commandNumber = index + (eq - 1) * 5 + 19;
    const data = Parser.getCommandData(command, value);
    device[group][channelId].eqs[eq][camelName] = value;

    return Parser.serialize(channelNumber, commandNumber, data);
  };
}

for (const [index, command] of commands.outputCommands.entries()) {
  const camelName = Parser.camelize(command.name);

  Parser[camelName] = function (
    device: State,
    { channelId, value }: { channelId: string; value: number },
  ) {
    const data = Parser.getCommandData(command, value);
    const output = constants.OUTPUTS.indexOf(channelId) + 5;
    const commandNumber = index + 64;
    device.outputs[channelId][camelName] = value;

    return Parser.serialize(output, commandNumber, data);
  };
}

Parser.commands = commands;

export default Parser;

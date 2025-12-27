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

  /**
   * Decode MIDI 7-bit encoded data.
   *
   * The DCX2496 encodes data in 8-byte groups:
   * - Bytes 0-6: Data with MSB stripped (7 bits each)
   * - Byte 7: Contains the MSBs of bytes 0-6
   *
   * This decodes back to the original 7 bytes per group.
   *
   * @param encoded The 8-byte-per-group encoded data
   * @returns Decoded bytes (7 bytes for every 8 input bytes)
   */
  static decode7to8(encoded: Uint8Array): Uint8Array {
    if (encoded.length % 8 !== 0) {
      console.warn('Encoded data length not divisible by 8');
    }

    const numGroups = Math.floor(encoded.length / 8);
    const decoded = new Uint8Array(numGroups * 7);

    for (let group = 0; group < numGroups; group++) {
      const srcOffset = group * 8;
      const dstOffset = group * 7;
      const highBits = encoded[srcOffset + 7];

      for (let i = 0; i < 7; i++) {
        // Restore MSB from highBits byte
        const msb = ((highBits >> i) & 1) << 7;
        decoded[dstOffset + i] = encoded[srcOffset + i] | msb;
      }
    }

    return decoded;
  }

  /**
   * Encode data to MIDI 7-bit format.
   *
   * @param raw The raw bytes to encode
   * @returns Encoded data (8 bytes for every 7 input bytes)
   */
  static encode7to8(raw: Uint8Array): Uint8Array {
    const numGroups = Math.ceil(raw.length / 7);
    const encoded = new Uint8Array(numGroups * 8);

    for (let group = 0; group < numGroups; group++) {
      const srcOffset = group * 7;
      const dstOffset = group * 8;
      let highBits = 0;

      for (let i = 0; i < 7; i++) {
        const srcIndex = srcOffset + i;
        const byte = srcIndex < raw.length ? raw[srcIndex] : 0;
        encoded[dstOffset + i] = byte & 0x7f; // Strip MSB
        highBits |= ((byte >> 7) & 1) << i; // Collect MSB
      }

      encoded[dstOffset + 7] = highBits;
    }

    return encoded;
  }

  static hexToBytes(hex: string): Uint8Array {
    // Remove colons or spaces if present
    const cleanHex = hex.replace(/[:\s]/g, '');
    const bytes = new Uint8Array(cleanHex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(cleanHex.substr(i * 2, 2), 16);
    }
    return bytes;
  }

  /**
   * MIDI message header size (bytes before the 7+1 encoded payload).
   * Structure: 0xF0, vendor[3], deviceId, 0x0E, command, ...metadata..., data
   */
  static readonly DUMP_HEADER_SIZE = 13;

  /**
   * Parse a DUMP_RESPONSE message from the device.
   * Each dump part arrives as a separate MIDI message via SSE.
   *
   * Message structure:
   * - Bytes 0-12: MIDI header (vendor, device ID, command, etc.)
   * - Byte 12: Part number (0 or 1)
   * - Bytes 13 to N-1: 7+1 encoded payload
   * - Byte N: 0xF7 terminator
   *
   * @param message Raw DUMP_RESPONSE bytes
   * @returns Part number and decoded values
   */
  static parseDumpResponse(message: Uint8Array): {
    part: number;
    values: Uint8Array;
  } {
    const PART_BYTE = 12;
    const TERMINATOR = 0xf7;

    // Extract part number from header
    const part = message[PART_BYTE];

    // Find terminator (should be last byte)
    let endIndex = message.length - 1;
    if (message[endIndex] === TERMINATOR) {
      // Skip terminator
    } else {
      // No terminator found, use full length
      endIndex = message.length;
    }

    // Extract encoded payload (after header, before terminator)
    const encodedPayload = message.slice(Parser.DUMP_HEADER_SIZE, endIndex);

    // Decode the 7+1 encoded data
    const values = Parser.decode7to8(encodedPayload);

    return { part, values };
  }

  /**
   * Convert encoded byte position to decoded index.
   * Used to map existing syncResponse indices to decoded array indices.
   *
   * @param encodedPos Position in the raw MIDI message (including header)
   * @returns Index in the decoded values array, or -1 if it's a flag byte
   */
  static encodedToDecodedIndex(encodedPos: number): number {
    // Subtract header to get position in encoded payload
    const payloadPos = encodedPos - Parser.DUMP_HEADER_SIZE;
    if (payloadPos < 0) return -1;

    const group = Math.floor(payloadPos / 8);
    const posInGroup = payloadPos % 8;

    // Position 7 is the flag byte, not data
    if (posInGroup === 7) return -1;

    return group * 7 + posInGroup;
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

  /**
   * Parse a DIRECT_COMMAND message (from device button press or UI action).
   * Format: [header 0-6][count][channel,param,hi,lo]×N[terminator]
   *
   * @param buffer Raw DIRECT_COMMAND bytes
   * @returns Array of delta updates to apply to local state
   */
  static parseDirectCommand(buffer: Uint8Array): Array<{
    group: 'setup' | 'inputs' | 'outputs';
    channelId?: string;
    eq?: number;
    property: string;
    value: number | boolean | string;
    rawValue: number;
  }> {
    const PARAM_COUNT_BYTE = 7;
    const count = buffer[PARAM_COUNT_BYTE];
    const deltas: Array<{
      group: 'setup' | 'inputs' | 'outputs';
      channelId?: string;
      eq?: number;
      property: string;
      value: number | boolean | string;
      rawValue: number;
    }> = [];

    for (let i = 0; i < count; i++) {
      const offset = 8 + 4 * i;
      const channel = buffer[offset]; // 0=setup, 1-4=inputs, 5-10=outputs
      const param = buffer[offset + 1];
      const hi = buffer[offset + 2];
      const lo = buffer[offset + 3];
      const rawValue = lo + hi * 128;

      const delta = Parser.mapChannelParamToProperty(channel, param, rawValue);
      if (delta) {
        deltas.push(delta);
      }
    }

    return deltas;
  }

  /**
   * Map channel/param to property name and convert raw value.
   */
  static mapChannelParamToProperty(
    channel: number,
    param: number,
    rawValue: number,
  ): {
    group: 'setup' | 'inputs' | 'outputs';
    channelId?: string;
    eq?: number;
    property: string;
    value: number | boolean | string;
    rawValue: number;
  } | undefined {
    if (channel === 0) {
      // Setup command
      const setupIndex = param <= 11 ? param - 2 : param - 10;
      const command = commands.setupCommands[setupIndex];
      if (!command) return undefined;

      return {
        group: 'setup',
        property: Parser.camelize(command.name),
        value: Parser.reverseCommandData(command, rawValue),
        rawValue,
      };
    } else if (channel >= 1 && channel <= 4) {
      // Input command
      const channelId = constants.INPUTS[channel - 1];
      return Parser.parseInputOutputParam(
        'inputs',
        channelId,
        param,
        rawValue,
      );
    } else if (channel >= 5 && channel <= 10) {
      // Output command
      const channelId = constants.OUTPUTS[channel - 5];
      return Parser.parseInputOutputParam(
        'outputs',
        channelId,
        param,
        rawValue,
      );
    }

    return undefined;
  }

  /**
   * Parse input/output parameter.
   */
  static parseInputOutputParam(
    group: 'inputs' | 'outputs',
    channelId: string,
    param: number,
    rawValue: number,
  ): {
    group: 'inputs' | 'outputs';
    channelId: string;
    eq?: number;
    property: string;
    value: number | boolean | string;
    rawValue: number;
  } | undefined {
    // Input/output commands: param 2-18 map to inputOutputCommands[0-16]
    if (param >= 2 && param <= 18) {
      const commandIndex = param - 2;
      const command = commands.inputOutputCommands[commandIndex];
      if (!command) return undefined;

      return {
        group,
        channelId,
        property: Parser.camelize(command.name),
        value: Parser.reverseCommandData(command, rawValue),
        rawValue,
      };
    }

    // EQ commands: params 19-63 (9 EQs × 5 params each)
    if (param >= 19 && param <= 63) {
      const eqOffset = param - 19;
      const eqNumber = Math.floor(eqOffset / 5) + 1;
      const eqParamIndex = eqOffset % 5;
      const command = commands.eqCommands[eqParamIndex];
      if (!command) return undefined;

      return {
        group,
        channelId,
        eq: eqNumber,
        property: Parser.camelize(command.name),
        value: Parser.reverseCommandData(command, rawValue),
        rawValue,
      };
    }

    // Output-only commands: params 64+
    if (group === 'outputs' && param >= 64) {
      const commandIndex = param - 64;
      const command = commands.outputCommands[commandIndex];
      if (!command) return undefined;

      return {
        group,
        channelId,
        property: Parser.camelize(command.name),
        value: Parser.reverseCommandData(command, rawValue),
        rawValue,
      };
    }

    return undefined;
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

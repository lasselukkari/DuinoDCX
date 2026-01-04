/* eslint-disable @typescript-eslint/no-extraneous-class */
import constants from './constants.js';
import * as commands from './commands.js';

export type Device = {
  id: number;
  version: number;
  name: string;
};

export type Equalizer = {
  [key: string]: unknown;
  equalizerType?: string;
  equalizerFrequency?: number;
  equalizerGain?: number;
  equalizerQ?: number;
  equalizerShelving?: string;
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
  isEqualizerOn?: boolean;
  equalizerNumber?: number;
  // Dynamic Equalizer properties
  isDynamicEqualizerOn?: boolean;
  dynamicEqualizerType?: string;
  dynamicEqualizerFrequency?: number;
  dynamicEqualizerGain?: number;
  dynamicEqualizerQ?: number;
  dynamicEqualizerShelving?: string;
  dynamicEqualizerAttack?: string;
  dynamicEqualizerRelease?: string;
  dynamicEqualizerRatio?: string;
  dynamicEqualizerThreshold?: number;
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
  // Equalizer banks
  equalizers: Record<string, Equalizer>;
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
  inputs: Array<{name: string; level: number; isLimited: boolean}>;
  outputs: Array<{name: string; level: number; isLimited: boolean}>;
  free: number;
};

class Parser {
  /**
   * MIDI message header size (bytes before the 7+1 encoded payload).
   * Structure: 0xF0, vendor[3], deviceId, 0x0E, command, ...metadata..., data
   */
  static get DUMP_HEADER_SIZE() {
    return 13;
  }

  static [key: string]: any;
  static commands: typeof commands;

  /**
   * Check if a message is a preset dump (Slot 1-60).
   * Logic:
   * - Must be a DUMP_RESPONSE (CMD 0x10, implied by caller context usually, but we check structure)
   * - Header check: F0 00 20 32 <ID> 0E 10 00 01 00 0C 00 <PART> ...
   * - If bytes 7-11 are 00 01 00 0C 00, it's a page dump.
   * - Byte 12 is the PART/SLOT.
   */
  static isPresetDump(message: Uint8Array): boolean {
    if (message.length < 20) return false;
    // Check for Page Dump signature: 00 01 00 0C 00 at index 7
    return (
      message[7] === 0x00 &&
      message[8] === 0x01 &&
      message[9] === 0x00 &&
      message[10] === 0x0c &&
      message[11] === 0x00
    );
  }

  /**
   * Extract preset name from decoded data.
   * Scans a specific window where names are usually found.
   */
  static extractPresetName(decodedData: Uint8Array): string {
    const checkSignature = (offset: number, sig: string) => {
      if (decodedData.length < offset + sig.length) return false;
      for (let i = 0; i < sig.length; i++) {
        if (decodedData[offset + i] !== sig.charCodeAt(i)) return false;
      }

      return true;
    };

    // 1. Check for XSNP (Software/User) -> Offset 83
    if (checkSignature(7, 'XSNP')) {
      const NAME_OFFSET = 83;
      if (decodedData.length < NAME_OFFSET + 8) return '<Error>';
      let name = '';
      for (let i = 0; i < 8; i++) {
        const code = decodedData[NAME_OFFSET + i];
        if (code >= 32 && code <= 126) name += String.fromCharCode(code);
      }

      return name.trim() || '<Empty>';
    }

    // 2. Check for XPCR (Card/EditBuffer?) -> Offset 79
    if (checkSignature(7, 'XPCR')) {
      const NAME_OFFSET = 79;
      if (decodedData.length < NAME_OFFSET + 8) return '<Error>';
      let name = '';
      for (let i = 0; i < 8; i++) {
        const code = decodedData[NAME_OFFSET + i];
        if (code >= 32 && code <= 126) name += String.fromCharCode(code);
      }

      return name.trim() || '<Empty>';
    }

    // 3. Fallback: Dynamic Search
    // Filter out known internal tags to avoid false positives
    const IGNORED_TAGS = new Set(['XPCR', 'XPRB', 'XCUR', 'XPAF', 'XPCS']);

    let currentString = '';
    const scanLimit = Math.min(decodedData.length, 120);

    for (let i = 0; i < scanLimit; i++) {
      const charCode = decodedData[i];
      if (charCode >= 32 && charCode <= 126) {
        currentString += String.fromCharCode(charCode);
      } else {
        if (currentString.length > 2) {
          const candidate = currentString.trim();
          if (!IGNORED_TAGS.has(candidate)) {
            return candidate.slice(0, 8);
          }
        }

        currentString = '';
      }
    }

    if (currentString.length > 2) {
      const candidate = currentString.trim();
      if (!IGNORED_TAGS.has(candidate)) {
        return candidate.slice(0, 8);
      }
    }

    return '<Empty>';
  }

  /**
   * Extract ALL preset names from a memory page dump.
   * Enforces 5 presets per page (Stride ~176 bytes) to maintain slot alignment.
   */
  static extractPresetNames(decodedData: Uint8Array): string[] {
    const names: string[] = [];
    const PRESETS_PER_PAGE = 5;
    // Observed roughly 176 bytes per preset (880 bytes / 5) based on 1000-byte raw pages.
    // If we assume the payload is packed with 5 slots.
    const STRIDE = 176;

    for (let slot = 0; slot < PRESETS_PER_PAGE; slot++) {
      const offset = slot * STRIDE;

      // Safety check for identifying "short" or non-existent pages (e.g. Page 12 response if it existed but was empty?)
      // But for standard pages 0-11, we expect full length.
      if (offset + 100 > decodedData.length) {
        // If we run out of data before the 5th slot, we fill with Empty?
        // User reports 60 slots. So we must produce 5 names per page for Pages 0-11.
        // If data is missing (e.g., end of file), we define it as Empty.
        names.push('<Empty>');
        continue;
      }

      // Slice the chunk for this slot
      const chunk = decodedData.slice(offset, offset + STRIDE);
      const name = Parser.extractPresetName(chunk);

      // If extractPresetName returns <Error> or <Empty>, we normalize to <Empty>
      // but strictly it should be aligned.
      if (name === '<Error>') {
        names.push('<Empty>');
      } else {
        names.push(name);
      }
    }

    return names;
  }

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
    const {type, min = 0, step = 1, values} = command;

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
    const {type, min = 0, step = 1, values} = command;

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
    for (let i = 0, {length} = string; i < length; i += 2) {
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

    const numberGroups = Math.floor(encoded.length / 8);
    const decoded = new Uint8Array(numberGroups * 7);

    for (let group = 0; group < numberGroups; group++) {
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
    const numberGroups = Math.ceil(raw.length / 7);
    const encoded = new Uint8Array(numberGroups * 8);

    for (let group = 0; group < numberGroups; group++) {
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
    const cleanHex = hex.replaceAll(/[:\s]/g, '');
    const bytes = new Uint8Array(cleanHex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = Number.parseInt(cleanHex.slice(i * 2, i * 2 + 2), 16);
    }

    return bytes;
  }

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

    return {part, values};
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
    {bits6, bit7, bits8}: commands.SyncResponse,
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
    const state: State = {setup: {}, inputs: {}, outputs: {}};

    for (const [index, channelId] of constants.CHANNELS.entries()) {
      const group = index < 4 ? 'inputs' : 'outputs';
      state[group][channelId] = {
        equalizers: {
          1: {},
          2: {},
          3: {},
          4: {},
          5: {},
          6: {},
          7: {},
          8: {},
          9: {},
        },
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

          state[group][channelId].equalizers[eq][parameterName] =
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

  static parseState(state: ArrayBuffer): State {
    const buffer = new Uint8Array(state);
    const selected = Number(buffer.slice(0, 1));
    const part0Buffer = buffer.slice(1, 1016);
    const part1buffer = buffer.slice(1016, 1927);
    const devicesBuffer = buffer.slice(1927);
    const device = Parser.parseDevice([part0Buffer, part1buffer]);
    const devices = Parser.parseDevices(devicesBuffer);

    device.isReady = devices.some(({id}) => id === selected);

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
      const parameter = buffer[offset + 1];
      const hi = buffer[offset + 2];
      const lo = buffer[offset + 3];
      const rawValue = lo + hi * 128;

      const delta = Parser.mapChannelParamToProperty(
        channel,
        parameter,
        rawValue,
      );
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
    parameter: number,
    rawValue: number,
  ):
    | {
        group: 'setup' | 'inputs' | 'outputs';
        channelId?: string;
        eq?: number;
        property: string;
        value: number | boolean | string;
        rawValue: number;
      }
    | undefined {
    if (channel === 0) {
      // Setup command
      const setupIndex = parameter <= 11 ? parameter - 2 : parameter - 10;
      const command = commands.setupCommands[setupIndex];
      if (!command) return undefined;

      return {
        group: 'setup',
        property: Parser.camelize(command.name),
        value: Parser.reverseCommandData(command, rawValue),
        rawValue,
      };
    }

    if (channel >= 1 && channel <= 4) {
      // Input command
      const channelId = constants.INPUTS[channel - 1];
      return Parser.parseInputOutputParam(
        'inputs',
        channelId,
        parameter,
        rawValue,
      );
    }

    if (channel >= 5 && channel <= 10) {
      // Output command
      const channelId = constants.OUTPUTS[channel - 5];
      return Parser.parseInputOutputParam(
        'outputs',
        channelId,
        parameter,
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
    parameter: number,
    rawValue: number,
  ):
    | {
        group: 'inputs' | 'outputs';
        channelId: string;
        eq?: number;
        property: string;
        value: number | boolean | string;
        rawValue: number;
      }
    | undefined {
    // Input/output commands: param 2-18 map to inputOutputCommands[0-16]
    if (parameter >= 2 && parameter <= 18) {
      const commandIndex = parameter - 2;
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

    // Equalizer commands: params 19-63 (9 EQs × 5 params each)
    if (parameter >= 19 && parameter <= 63) {
      const eqOffset = parameter - 19;
      const eqNumber = Math.floor(eqOffset / 5) + 1;
      const eqParameterIndex = eqOffset % 5;
      const command = commands.eqCommands[eqParameterIndex];
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
    if (group === 'outputs' && parameter >= 64) {
      const commandIndex = parameter - 64;
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

  Parser[camelName] = function (device: State, {value}: {value: number}) {
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
    }: {group: 'inputs' | 'outputs'; channelId: string; value: number},
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
    device[group][channelId].equalizers[eq][camelName] = value;

    return Parser.serialize(channelNumber, commandNumber, data);
  };
}

for (const [index, command] of commands.outputCommands.entries()) {
  const camelName = Parser.camelize(command.name);

  Parser[camelName] = function (
    device: State,
    {channelId, value}: {channelId: string; value: number},
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

/**
 * SysEx message building and parsing for DCX2496.
 *
 * This module handles the RS-232 protocol layer:
 * - Building SysEx messages for sending to the device
 * - Parsing SysEx messages received from the device
 * - Checksum calculation and verification
 *
 * The architecture separates:
 * - SysEx framing (this module)
 * - 7-to-8 bit encoding (encoding.ts)
 * - Parameter value mapping (generated-mappings.ts)
 */

import { calculateChecksum, verifyChecksum } from './checksum.js';
import { encode8to7, decode7to8 } from './encoding.js';

// ============================================================================
// Protocol Constants
// ============================================================================

export const SYSEX_START = 0xf0;
export const SYSEX_END = 0xf7;

/** Behringer vendor ID */
export const VENDOR_ID = new Uint8Array([0x00, 0x20, 0x32]);

/** DCX2496 model ID */
export const MODEL_ID = 0x0e;

/** Default device ID */
export const DEFAULT_DEVICE_ID = 0x00;

// Command IDs
export const CMD_PING = 0x40;
export const CMD_DUMP_REQUEST = 0x50;
export const CMD_RECALL = 0x52;
export const CMD_STORE = 0x53;
export const CMD_INIT_SYNC = 0x12;
export const CMD_WRITE_DATA = 0x10;
export const CMD_DIRECT = 0x20;

// Response types
export const RSP_SEARCH = 0x00;
export const RSP_DUMP = 0x10;
export const RSP_ACK = 0x52;

// Packet types for write data
export const PACKET_TYPE_HEADER = 0x01;
export const PACKET_TYPE_PAGE = 0x0c;

// Message structure offsets
export const HEADER_SIZE = 13;
export const COMMAND_BYTE_INDEX = 6;
export const PART_BYTE_INDEX = 12;

// ============================================================================
// Message Building
// ============================================================================

/**
 * Build the SysEx header common to all messages.
 */
function buildHeader(deviceId: number, command: number): Uint8Array {
  return new Uint8Array([
    SYSEX_START,
    ...VENDOR_ID,
    deviceId,
    MODEL_ID,
    command,
  ]);
}

/**
 * Build a ping/search command.
 * Used to detect devices on the bus.
 *
 * Format: F0 00 20 32 <DevID> 0E 40 F7
 */
export function buildPingCommand(deviceId = DEFAULT_DEVICE_ID): Uint8Array {
  return new Uint8Array([...buildHeader(deviceId, CMD_PING), SYSEX_END]);
}

/**
 * Build a page dump request.
 * Requests a specific memory page (0-11) from the device.
 *
 * Format: F0 00 20 32 <DevID> 0E 50 00 00 <Page> F7
 */
export function buildPageDumpRequest(
  page: number,
  deviceId = DEFAULT_DEVICE_ID,
): Uint8Array {
  return new Uint8Array([
    ...buildHeader(deviceId, CMD_DUMP_REQUEST),
    0x00, // Bank 0 (memory pages)
    0x00,
    page & 0x7f,
    SYSEX_END,
  ]);
}

/**
 * Build an edit buffer dump request.
 * Requests part 0 or 1 of the current edit buffer.
 *
 * Format: F0 00 20 32 <DevID> 0E 50 01 00 <Part> F7
 */
export function buildEditBufferRequest(
  part: 0 | 1,
  deviceId = DEFAULT_DEVICE_ID,
): Uint8Array {
  return new Uint8Array([
    ...buildHeader(deviceId, CMD_DUMP_REQUEST),
    0x01, // Bank 1 (edit buffer)
    0x00,
    part,
    SYSEX_END,
  ]);
}

/**
 * Build a recall preset command.
 * Loads a preset from slot (1-60) into the edit buffer.
 *
 * Format: F0 00 20 32 <DevID> 0E 52 <Slot> F7
 */
export function buildRecallCommand(
  slot: number,
  deviceId = DEFAULT_DEVICE_ID,
): Uint8Array {
  return new Uint8Array([
    ...buildHeader(deviceId, CMD_RECALL),
    slot & 0x7f,
    SYSEX_END,
  ]);
}

/**
 * Build a store preset command.
 * Saves the current edit buffer to a slot (1-60).
 *
 * Format: F0 00 20 32 <DevID> 0E 53 <Slot> F7
 */
export function buildStoreCommand(
  slot: number,
  deviceId = DEFAULT_DEVICE_ID,
): Uint8Array {
  return new Uint8Array([
    ...buildHeader(deviceId, CMD_STORE),
    slot & 0x7f,
    SYSEX_END,
  ]);
}

/**
 * Build the sync init command for restore.
 * Initiates the restore protocol with "PRESETS" string.
 *
 * Format: F0 00 20 32 <DevID> 0E 12 00 "PRESETS" 00 00 F7
 */
export function buildSyncCommand(deviceId = DEFAULT_DEVICE_ID): Uint8Array {
  const presets = [0x50, 0x52, 0x45, 0x53, 0x45, 0x54, 0x53]; // "PRESETS"
  return new Uint8Array([
    ...buildHeader(deviceId, CMD_INIT_SYNC),
    0x00,
    ...presets,
    0x00,
    0x00,
    SYSEX_END,
  ]);
}

/**
 * Build a data packet for restore.
 * Used for header packet (type 0x01) and page packets (type 0x0C).
 *
 * Format: F0 00 20 32 <DevID> 0E 10 00 01 00 <Type> 00 <Page> <EncodedData...> <Checksum> F7
 */
export function buildDataPacket(
  type: number,
  pageNumber: number,
  data: Uint8Array,
  deviceId = DEFAULT_DEVICE_ID,
  bank = 0x00,
): Uint8Array {
  // Encode the data to 7-bit
  const encoded = encode8to7(data);

  // Build packet without checksum and terminator
  const packet = new Uint8Array([
    ...buildHeader(deviceId, CMD_WRITE_DATA),
    bank,
    0x01,
    0x00,
    type & 0x7f,
    0x00,
    pageNumber & 0x7f,
    ...encoded,
  ]);

  // Calculate checksum over the data portion (after header)
  const checksumData = packet.slice(HEADER_SIZE);
  const checksum = calculateChecksum(checksumData);

  // Return complete packet with checksum and terminator
  return new Uint8Array([...packet, checksum, SYSEX_END]);
}

/**
 * Build a header packet for restore (type 0x01).
 */
export function buildHeaderPacket(
  data: Uint8Array,
  deviceId = DEFAULT_DEVICE_ID,
): Uint8Array {
  return buildDataPacket(PACKET_TYPE_HEADER, 0, data, deviceId);
}

/**
 * Build a page packet for restore (type 0x0C).
 */
export function buildPagePacket(
  pageNumber: number,
  data: Uint8Array,
  deviceId = DEFAULT_DEVICE_ID,
): Uint8Array {
  return buildDataPacket(PACKET_TYPE_PAGE, pageNumber, data, deviceId);
}

/**
 * Build a direct parameter command.
 * Used to send real-time parameter changes.
 *
 * Format: F0 00 20 32 <DevID> 0E 20 <Count> [<Channel> <Param> <Hi> <Lo>]... F7
 */
export function buildDirectCommand(
  parameters: Array<{
    channel: number;
    param: number;
    value: number;
  }>,
  deviceId = DEFAULT_DEVICE_ID,
): Uint8Array {
  const parameterBytes: number[] = [];
  for (const { channel, param, value } of parameters) {
    parameterBytes.push(
      channel & 0x7f,
      param & 0x7f,
      Math.floor(value / 128) & 0x7f, // High byte
      value % 128, // Low byte
    );
  }

  return new Uint8Array([
    ...buildHeader(deviceId, CMD_DIRECT),
    parameters.length,
    ...parameterBytes,
    SYSEX_END,
  ]);
}

// ============================================================================
// Message Parsing
// ============================================================================

/** Result of parsing a SysEx message */
export type ParsedMessage =
  | { type: 'ping'; deviceId: number }
  | { type: 'search'; deviceId: number; version: number; name: string }
  | { type: 'pageDump'; deviceId: number; page: number; data: Uint8Array }
  | { type: 'editBuffer'; deviceId: number; part: number; data: Uint8Array }
  | { type: 'ack'; deviceId: number; payload: Uint8Array }
  | { type: 'pageRequest'; deviceId: number; page: number; requestType: number }
  | {
    type: 'direct';
    deviceId: number;
    parameters: Array<{ channel: number; param: number; value: number }>;
  }
  | { type: 'unknown'; deviceId: number; command: number; data: Uint8Array };

/**
 * Parse a complete SysEx message from the device.
 */
export function parseMessage(message: Uint8Array): ParsedMessage | undefined {
  // Validate minimum length and boundaries
  if (message.length < 8) return undefined;
  if (message[0] !== SYSEX_START || message.at(-1) !== SYSEX_END)
    return undefined;

  // Verify vendor ID
  if (
    message[1] !== VENDOR_ID[0] ||
    message[2] !== VENDOR_ID[1] ||
    message[3] !== VENDOR_ID[2]
  ) {
    return undefined;
  }

  const deviceId = message[4];
  const command = message[COMMAND_BYTE_INDEX];

  switch (command) {
    case RSP_SEARCH: {
      return parseSearchResponse(message, deviceId);
    }

    case RSP_DUMP: {
      return parseDumpResponse(message, deviceId);
    }

    case RSP_ACK: {
      return {
        type: 'ack',
        deviceId,
        payload: message.slice(7, -1),
      };
    }

    case CMD_DUMP_REQUEST: {
      return parsePageRequest(message, deviceId);
    }

    case CMD_DIRECT: {
      return parseDirectCommand(message, deviceId);
    }

    default: {
      return {
        type: 'unknown',
        deviceId,
        command,
        data: message.slice(7, -1),
      };
    }
  }
}

/**
 * Parse a search/ping response.
 */
function parseSearchResponse(
  message: Uint8Array,
  deviceId: number,
): ParsedMessage {
  // Extract version from bytes 7-8
  const version = Number.parseFloat(`${message[7]}.${message[8]}`);

  // Extract name from bytes 9-24 (16 chars)
  let name = '';
  for (let i = 9; i < 25 && i < message.length - 1; i++) {
    const char = message[i];
    if (char >= 32 && char <= 126) {
      name += String.fromCodePoint(char);
    }
  }

  return {
    type: 'search',
    deviceId,
    version,
    name: name.trim(),
  };
}

/**
 * Parse a dump response (page dump or edit buffer).
 */
function parseDumpResponse(
  message: Uint8Array,
  deviceId: number,
): ParsedMessage | undefined {
  if (message.length < 15) return undefined;

  // Check for page dump signature: 00 01 00 0C 00 at bytes 7-11
  const isPageDump =
    message[7] === 0x00 &&
    message[8] === 0x01 &&
    message[9] === 0x00 &&
    message[10] === 0x0c &&
    message[11] === 0x00;

  if (isPageDump) {
    // Verify checksum
    if (!verifyChecksum(message)) {
      console.warn('Page dump checksum verification failed');
    }

    const page = message[12];
    const encodedData = message.slice(HEADER_SIZE, -2); // Exclude checksum and F7
    const data = decode7to8(encodedData);

    return {
      type: 'pageDump',
      deviceId,
      page,
      data,
    };
  }

  // Edit buffer response
  const part = message[7];
  const encodedData = message.slice(HEADER_SIZE, -2);
  const data = decode7to8(encodedData);

  return {
    type: 'editBuffer',
    deviceId,
    part,
    data,
  };
}

/**
 * Parse a page request from the device (during restore).
 */
function parsePageRequest(
  message: Uint8Array,
  deviceId: number,
): ParsedMessage {
  return {
    type: 'pageRequest',
    deviceId,
    page: message[9],
    requestType: message[7],
  };
}

/**
 * Parse a direct parameter command.
 */
function parseDirectCommand(
  message: Uint8Array,
  deviceId: number,
): ParsedMessage {
  const count = message[7];
  const parameters: Array<{ channel: number; param: number; value: number }> = [];

  for (let i = 0; i < count; i++) {
    const offset = 8 + i * 4;
    if (offset + 3 >= message.length) break;

    parameters.push({
      channel: message[offset],
      param: message[offset + 1],
      value: message[offset + 3] + message[offset + 2] * 128,
    });
  }

  return {
    type: 'direct',
    deviceId,
    parameters,
  };
}

/**
 * Check if a message is a valid SysEx message.
 */
export function isValidSysex(message: Uint8Array): boolean {
  return (
    message.length >= 8 &&
    message[0] === SYSEX_START &&
    message.at(-1) === SYSEX_END &&
    message[1] === VENDOR_ID[0] &&
    message[2] === VENDOR_ID[1] &&
    message[3] === VENDOR_ID[2]
  );
}

/**
 * Extract complete SysEx messages from a stream of bytes.
 * Useful for parsing data from a serial port buffer.
 */
export function extractSysexMessages(buffer: Uint8Array): {
  messages: Uint8Array[];
  remaining: Uint8Array;
} {
  const messages: Uint8Array[] = [];
  let start = -1;

  for (let i = 0; i < buffer.length; i++) {
    if (buffer[i] === SYSEX_START) {
      start = i;
    } else if (buffer[i] === SYSEX_END && start >= 0) {
      messages.push(buffer.slice(start, i + 1));
      start = -1;
    }
  }

  // Return remaining bytes (incomplete message)
  const remaining = start >= 0 ? buffer.slice(start) : new Uint8Array(0);

  return { messages, remaining };
}

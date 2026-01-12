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
 * - Parameter value mapping (parameter-mappings.ts)
 */

import {
  SYSEX_START,
  SYSEX_END,
  VENDOR_ID,
  COMMAND_BYTE_INDEX,
  RSP_SEARCH,
  RSP_STATUS,
  RSP_DUMP,
  RSP_ACK,
  CMD_DUMP_REQUEST,
  CMD_DIRECT,
  CMD_STATUS,
  HEADER_SIZE,
} from '../constants/protocol.js';
import {verifyChecksum} from './checksum.js';
import {decode7to8} from './encoding.js';

// ============================================================================
// Message Building
// ============================================================================

// ============================================================================
// Message Parsing
// ============================================================================

/** Result of parsing a SysEx message */
export type ParsedMessage =
  | {type: 'ping'; deviceId: number; command: number}
  | {
      type: 'search';
      deviceId: number;
      version: number;
      name: string;
      command: number;
    }
  | {
      type: 'pageDump';
      deviceId: number;
      page: number;
      data: Uint8Array;
      command: number;
    }
  | {
      type: 'editBuffer';
      deviceId: number;
      part: number;
      data: Uint8Array;
      command: number;
    }
  | {type: 'ack'; deviceId: number; payload: Uint8Array; command: number}
  | {
      type: 'pageRequest';
      deviceId: number;
      page: number;
      requestType: number;
      command: number;
    }
  | {
      type: 'direct';
      deviceId: number;
      parameters: Array<{channel: number; param: number; value: number}>;
      command: number;
    }
  | {type: 'status'; deviceId: number; command: number; data: Uint8Array}
  | {type: 'unknown'; deviceId: number; command: number; data: Uint8Array};

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
    case RSP_STATUS: {
      // Status/ping response (0x04) contains channel levels and free memory
      return {
        type: 'status',
        deviceId,
        command,
        data: message,
      };
    }

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
        command,
        payload: message.slice(7, -1),
      };
    }

    case CMD_DUMP_REQUEST: {
      return parsePageRequest(message, deviceId);
    }

    case CMD_DIRECT: {
      return parseDirectCommand(message, deviceId);
    }

    case CMD_STATUS: {
      // Status message (0x21)
      // Structure: F0 00 20 32 Channel 21 [Data...] F7
      // Data is 7-bit encoded?
      // Based on user feedback: "buffer = new Uint8Array(pingResponse)"
      // If pingResponse is the raw message, indices 8, 11 etc. refer to raw bytes.
      // 0: F0
      // 1: 00
      // 2: 20
      // 3: 32
      // 4: Channel
      // 5: 21 (CMD)
      // 6: Start of data?
      // Wait, standard header size is 6? (index 0-5).
      // So index 6 is the first data byte (or length?).
      // User said: inputs at offset 8.
      // If 6 is start of data, 8 is data[2].

      // Let's pass the raw inner payload (excluding F0..CMD and F7)
      // But verify if it needs decoding.
      // User code: "const data = buffer[index + 8]" -> implies direct byte access on the message.
      // If it was 7-bit encoded, simple byte access often fails unless values are < 128.
      // Meters are likely small values < 128, so maybe they are not encoded or 1-to-1.
      // However, "All data ... 7-bit encoded".
      // Let's return a 'status' type and let parseStatus handle the buffer.

      return {
        type: 'status',
        deviceId,
        command,
        data: message, // Pass WHOLE message to match user legacy logic buffer[index+8]
      };
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
 * Parse devices from a search response.
 */
export function parseDevices(
  message: Uint8Array,
): Array<{id: number; version: number; name: string}> {
  const parsed = parseMessage(message);
  if (parsed?.type === 'search') {
    return [{id: parsed.deviceId, version: parsed.version, name: parsed.name}];
  }

  return [];
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
    command: message[COMMAND_BYTE_INDEX],
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

  // Check for bank at byte 7
  const bank = message[7];

  // Bank 0 = Memory Page Dump (Presets)
  if (bank === 0x00) {
    // Verify checksum
    if (!verifyChecksum(message)) {
      console.warn('Page dump checksum verification failed');
    }

    const page = message[12];
    const encodedData = message.slice(HEADER_SIZE, -2); // Exclude checksum and F7
    const data = decode7to8(encodedData, {indexed: false});

    return {
      type: 'pageDump',
      deviceId,
      page,
      data,
      command: message[COMMAND_BYTE_INDEX],
    };
  }

  // Bank 1 = Edit Buffer
  if (bank === 0x01) {
    const part = message[12]; // Part number is at the same offset as page
    const encodedData = message.slice(HEADER_SIZE, -2);
    const data = decode7to8(encodedData, {indexed: false});

    return {
      type: 'editBuffer',
      deviceId,
      part,
      data,
      command: message[COMMAND_BYTE_INDEX],
    };
  }

  return undefined;
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
    command: message[COMMAND_BYTE_INDEX],
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
  const parameters: Array<{channel: number; param: number; value: number}> = [];

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
    command: message[COMMAND_BYTE_INDEX],
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

  return {messages, remaining};
}

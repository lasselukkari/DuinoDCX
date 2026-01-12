/**
 * DCX2496 SysEx Protocol Constants
 */

export const SYSEX_START = 0xf0;
export const SYSEX_END = 0xf7;

/** Behringer vendor ID (00 20 32) */
export const VENDOR_ID = new Uint8Array([0x00, 0x20, 0x32]);

/** DCX2496 model ID (0E) */
export const MODEL_ID = 0x0e;

/** Default device ID (00) */
export const DEFAULT_DEVICE_ID = 0x00;

// Command IDs (sent to device)
export const CMD_PING = 0x40;
export const CMD_DUMP_REQUEST = 0x50;
export const CMD_RECALL = 0x52;
export const CMD_STORE = 0x53;
export const CMD_INIT_SYNC = 0x12;
export const CMD_WRITE_DATA = 0x10;
export const CMD_DIRECT = 0x20;
export const CMD_STATUS = 0x21;
export const CMD_LISTEN_MODE = 0x3f;

// Response types (received from device)
export const RSP_SEARCH = 0x00;
export const RSP_STATUS = 0x04; // Status/ping response
export const RSP_DUMP = 0x10;
export const RSP_ACK = 0x52;

// Packet types for write data
export const PACKET_TYPE_HEADER = 0x01;
export const PACKET_TYPE_PAGE = 0x0c;

// Message structure offsets
export const HEADER_SIZE = 13;
export const COMMAND_BYTE_INDEX = 6;
export const PART_BYTE_INDEX = 12;

// Convenience constants
export const PART_0 = 0x00;
export const PART_1 = 0x01;

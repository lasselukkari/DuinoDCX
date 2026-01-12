/**
 * DCX2496 SysEx Protocol Constants
 */
export declare const SYSEX_START = 240;
export declare const SYSEX_END = 247;
/** Behringer vendor ID (00 20 32) */
export declare const VENDOR_ID: Uint8Array<ArrayBuffer>;
/** DCX2496 model ID (0E) */
export declare const MODEL_ID = 14;
/** Default device ID (00) */
export declare const DEFAULT_DEVICE_ID = 0;
export declare const CMD_PING = 64;
export declare const CMD_DUMP_REQUEST = 80;
export declare const CMD_RECALL = 82;
export declare const CMD_STORE = 83;
export declare const CMD_INIT_SYNC = 18;
export declare const CMD_WRITE_DATA = 16;
export declare const CMD_DIRECT = 32;
export declare const CMD_STATUS = 33;
export declare const CMD_LISTEN_MODE = 63;
export declare const RSP_SEARCH = 0;
export declare const RSP_STATUS = 4;
export declare const RSP_DUMP = 16;
export declare const RSP_ACK = 82;
export declare const PACKET_TYPE_HEADER = 1;
export declare const PACKET_TYPE_PAGE = 12;
export declare const HEADER_SIZE = 13;
export declare const COMMAND_BYTE_INDEX = 6;
export declare const PART_BYTE_INDEX = 12;
export declare const PART_0 = 0;
export declare const PART_1 = 1;
//# sourceMappingURL=protocol.d.ts.map
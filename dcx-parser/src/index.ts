/**
 * DCX2496 Parser Library
 *
 * A TypeScript library for parsing and building messages for the
 * Behringer DCX2496 digital speaker management system.
 */

// Types
export type { State, Setup, Channel, Eq, Status } from './types.js';
export type { ParameterDefinition, ByteKey, DirectKey } from './param-lookup.js';
export type { DataSource } from './state-parser.js';
export type { ParsedMessage } from './sysex.js';
export type { DcxFile, PresetSlot } from './dcx-file.js';

// Encoding (7-to-8 bit transformation)
export { encode8to7, decode7to8 } from './encoding.js';

// Checksum
export { calculateChecksum, verifyChecksum } from './checksum.js';

// SysEx message building
export {
  buildPingCommand,
  buildPageDumpRequest,
  buildEditBufferRequest,
  buildRecallCommand,
  buildStoreCommand,
  buildSyncCommand,
  buildDataPacket,
  buildHeaderPacket,
  buildPagePacket,
  buildDirectCommand,
} from './sysex.js';

// SysEx message parsing
export { parseMessage, isValidSysex, extractSysexMessages } from './sysex.js';

// SysEx constants
export {
  SYSEX_START,
  SYSEX_END,
  VENDOR_ID,
  MODEL_ID,
  DEFAULT_DEVICE_ID,
  CMD_PING,
  CMD_DUMP_REQUEST,
  CMD_RECALL,
  CMD_STORE,
  CMD_INIT_SYNC,
  CMD_WRITE_DATA,
  CMD_DIRECT,
} from './sysex.js';

// DCX file format
export {
  parseDcxFile,
  assemblePagesIntoDcxFile,
  splitDcxFileIntoPages,
  createRestoreHeader,
  getPresetNames,
  isValidDcxFile,
  DCX_SIGNATURE,
  DCX_TERMINATOR,
} from './dcx-file.js';

// Parameter lookups
export {
  byteLookup,
  directLookup,
  getParameterByByte,
  getParameterByDirect,
  convertValue,
  toRawValue,
} from './param-lookup.js';

// State parsing
export {
  parseState,
  parseEditBuffer,
  parsePresetData,
  fromParts,
  fromPreset,
} from './state-parser.js';

// Preset parsing (12-page memory dump / .dcx file to State objects)
export type { ParsedPreset, MemoryDumpResult } from './preset-parser.js';
export {
  parseDcxFileToStates,
  parseMemoryPages,
  parsePresetWords,
} from './preset-parser.js';

// Re-export constants for advanced usage
export * as constants from './constants.js';

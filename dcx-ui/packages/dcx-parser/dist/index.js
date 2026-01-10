/**
 * DCX2496 Parser Library
 *
 * A TypeScript library for parsing and building messages for the
 * Behringer DCX2496 digital speaker management system.
 */
// Encoding (7-to-8 bit transformation)
export {encode8to7, decode7to8} from './protocol/encoding.js';
// Checksum
export {calculateChecksum, verifyChecksum} from './protocol/checksum.js';
// SysEx message building
export {
  buildHeader,
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
  buildListenModeCommand,
} from './commands/builders.js';
// SysEx message parsing
export {
  parseMessage,
  isValidSysex,
  extractSysexMessages,
} from './protocol/sysex.js';
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
  CMD_LISTEN_MODE,
} from './constants/protocol.js';
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
} from './model/param-lookup.js';
// State parsing
export {
  parseState,
  parseEditBuffer,
  parsePresetData,
  fromParts,
  fromPreset,
} from './model/state-parser.js';
export {
  parseDcxFileToStates,
  parseMemoryPages,
  parsePresetWords,
} from './file/preset-parser.js';
// Re-export constants for advanced usage
export * as constants from './constants/index.js';
// React hooks (requires React as peer dependency)
export {useDcxFile} from './hooks/use-dcx-file.js';
export {useDcxState} from './hooks/use-dcx-state.js';
export {useDcxBackup} from './hooks/use-dcx-backup.js';
export {useDcxRestore} from './hooks/use-dcx-restore.js';
// High-level parameter commands
export {buildParamChangeCommand} from './commands/builders.js';
// Command definitions for UI
export {
  setupCommands,
  inputOutputCommands,
  equalizerCommands,
  outputCommands,
} from './commands/commands.js';
// Utility functions
export {camelize} from './model/helpers.js';
// # sourceMappingURL=index.js.map

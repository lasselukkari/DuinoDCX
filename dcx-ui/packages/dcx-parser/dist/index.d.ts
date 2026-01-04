/**
 * DCX2496 Parser Library
 *
 * A TypeScript library for parsing and building messages for the
 * Behringer DCX2496 digital speaker management system.
 */
export type { State, Setup, Channel, Equalizer, Status } from './types/index.js';
export type { ParameterDefinition, ByteKey, DirectKey } from './model/param-lookup.js';
export type { DataSource } from './model/state-parser.js';
export type { ParsedMessage } from './protocol/sysex.js';
export type { DcxFile, PresetSlot } from './dcx-file.js';
export { encode8to7, decode7to8 } from './protocol/encoding.js';
export { calculateChecksum, verifyChecksum } from './protocol/checksum.js';
export { buildHeader, buildPingCommand, buildPageDumpRequest, buildEditBufferRequest, buildRecallCommand, buildStoreCommand, buildSyncCommand, buildDataPacket, buildHeaderPacket, buildPagePacket, buildDirectCommand, buildListenModeCommand, } from './commands/builders.js';
export { parseMessage, isValidSysex, extractSysexMessages } from './protocol/sysex.js';
export { SYSEX_START, SYSEX_END, VENDOR_ID, MODEL_ID, DEFAULT_DEVICE_ID, CMD_PING, CMD_DUMP_REQUEST, CMD_RECALL, CMD_STORE, CMD_INIT_SYNC, CMD_WRITE_DATA, CMD_DIRECT, CMD_LISTEN_MODE, } from './constants/protocol.js';
export { parseDcxFile, assemblePagesIntoDcxFile, splitDcxFileIntoPages, createRestoreHeader, getPresetNames, isValidDcxFile, DCX_SIGNATURE, DCX_TERMINATOR, } from './dcx-file.js';
export { byteLookup, directLookup, getParameterByByte, getParameterByDirect, convertValue, toRawValue, } from './model/param-lookup.js';
export { parseState, parseEditBuffer, parsePresetData, fromParts, fromPreset, } from './model/state-parser.js';
export type { ParsedPreset, MemoryDumpResult } from './file/preset-parser.js';
export { parseDcxFileToStates, parseMemoryPages, parsePresetWords, } from './file/preset-parser.js';
export * as constants from './constants/index.js';
export type { DcxConnection } from './transport/types.js';
export { useDcxFile, type PresetEntry } from './hooks/use-dcx-file.js';
export { useDcxState } from './hooks/use-dcx-state.js';
export { useDcxBackup, type BackupStatus } from './hooks/use-dcx-backup.js';
export { useDcxRestore, type RestoreStatus } from './hooks/use-dcx-restore.js';
export { buildParamChangeCommand, type ParameterTarget } from './commands/builders.js';
//# sourceMappingURL=index.d.ts.map
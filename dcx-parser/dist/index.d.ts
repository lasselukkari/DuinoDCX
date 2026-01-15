/**
 * DCX2496 Parser Library (V2)
 *
 * A TypeScript library for parsing and building messages for the
 * Behringer DCX2496 digital speaker management system.
 *
 * Unified Architecture: src/structure.ts defines the truth.
 */
import { isOutputChannel } from './types/index.js';
import { parseMessage, parseDevices } from './protocol/sysex.js';
import { parseEditBuffer } from './edit-buffer-parser.js';
import { parsePreset } from './preset-parser.js';
import { parseStatus } from './status-parser.js';
import { getPresetNames, parseDcxPresets } from './dcx-file.js';
export type { State, Setup, InputChannel, OutputChannel, BufferHeader, Equalizer, Channel, Status, } from './types/index.js';
export type { ParameterDefinition } from './model/param-lookup.js';
export type { ParsedMessage } from './protocol/sysex.js';
export type { DcxFile, PresetSlot, ParsedPreset, ParsedPreset as PresetEntry, } from './dcx-file.js';
export { encode8to7, decode7to8 } from './protocol/encoding.js';
export { calculateChecksum, verifyChecksum } from './protocol/checksum.js';
export { buildHeader, buildPingCommand, buildSearchCommand, BROADCAST_DEVICE_ID, buildPageDumpRequest, buildEditBufferRequest, buildRecallCommand, buildStoreCommand, buildSyncCommand, buildDataPacket, buildHeaderPacket, buildPagePacket, buildDirectCommand, buildListenModeCommand, buildParameterChangeCommand, } from './commands/builders.js';
export type { ParameterTarget } from './commands/builders.js';
export { type Command, setupCommands, inputOutputCommands, equalizerCommands, outputCommands, } from './commands/commands.js';
export { parseMessage, parseDevices, isValidSysex, extractSysexMessages, } from './protocol/sysex.js';
export * from './constants/protocol.js';
export { directLookup, getParameterByDirect, convertValue, toRawValue, applyToState, } from './model/param-lookup.js';
export { parseEditBuffer } from './edit-buffer-parser.js';
export { parsePreset } from './preset-parser.js';
export * as constants from './constants/index.js';
export type { DcxConnection } from './transport/types.js';
export { BackupSession } from './transport/backup.js';
export { RestoreSession } from './transport/restore.js';
export { EditBufferSession, EditBufferPhase } from './transport/edit-buffer.js';
export { DeviceSession, DevicePhase } from './transport/device-session.js';
export { SearchSession, SearchPhase } from './transport/search.js';
export { PingSession, PingPhase } from './transport/ping.js';
export { DeviceCoordinator, CoordinatorPhase, OperationType, type DeviceData } from './transport/device-coordinator.js';
export { FakeDevice } from './transport/fake-device.js';
export { parseStatus } from './status-parser.js';
export { parseDcxFile, parseDcxPresets, assemblePagesIntoDcxFile, splitDcxFileIntoPages, createRestoreHeader, getPresetNames, isValidDcxFile, DCX_SIGNATURE, DCX_TERMINATOR, } from './dcx-file.js';
export declare function camelize(string_: string): string;
declare const Parser: {
    camelize: typeof camelize;
    commands: {
        setupCommands: (import("./index.js").Command | undefined)[];
        inputOutputCommands: import("./index.js").Command[];
        eqCommands: import("./index.js").Command[];
        outputCommands: import("./index.js").Command[];
    };
    parseEditBuffer: typeof parseEditBuffer;
    parsePreset: typeof parsePreset;
    parseMessage: typeof parseMessage;
    parseDevices: typeof parseDevices;
    parseStatus: typeof parseStatus;
    isOutputChannel: typeof isOutputChannel;
    getPresetNames: typeof getPresetNames;
    parseDcxPresets: typeof parseDcxPresets;
};
export default Parser;
export { dcxStore, DcxStore } from './store/dcx-store.js';
export { isOutputChannel } from './types/index.js';
//# sourceMappingURL=index.d.ts.map
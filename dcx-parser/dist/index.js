/**
 * DCX2496 Parser Library (V2)
 *
 * A TypeScript library for parsing and building messages for the
 * Behringer DCX2496 digital speaker management system.
 *
 * Unified Architecture: src/structure.ts defines the truth.
 */
// Types
import { isOutputChannel } from './types/index.js';
import { setupCommands, inputOutputCommands, equalizerCommands, outputCommands, } from './commands/commands.js';
import { parseMessage, parseDevices } from './protocol/sysex.js';
import { parseEditBuffer } from './edit-buffer-parser.js';
import { parsePreset } from './preset-parser.js';
import { parseStatus } from './status-parser.js';
import { getPresetNames, parseDcxPresets } from './dcx-file.js';
// Encoding (7-to-8 bit transformation)
export { encode8to7, decode7to8 } from './protocol/encoding.js';
// Checksum
export { calculateChecksum, verifyChecksum } from './protocol/checksum.js';
// SysEx message building
export { buildHeader, buildPingCommand, buildSearchCommand, BROADCAST_DEVICE_ID, buildPageDumpRequest, buildEditBufferRequest, buildRecallCommand, buildStoreCommand, buildSyncCommand, buildDataPacket, buildHeaderPacket, buildPagePacket, buildDirectCommand, buildListenModeCommand, buildParameterChangeCommand, } from './commands/builders.js';
export { setupCommands, inputOutputCommands, equalizerCommands, outputCommands, } from './commands/commands.js';
// SysEx message parsing
export { parseMessage, parseDevices, isValidSysex, extractSysexMessages, } from './protocol/sysex.js';
// SysEx constants
export * from './constants/protocol.js';
// Parameter lookups & Helpers (Legacy but updated/needed for Builders)
export { directLookup, getParameterByDirect, convertValue, toRawValue, applyToState, } from './model/param-lookup.js';
// OLD HELPERS REMOVED (createEmptyState etc might reference old types)
// If UI needs them, we must check. 'model/helpers.js' is legacy.
// NEW PARSERS (V2)
export { parseEditBuffer } from './edit-buffer-parser.js';
export { parsePreset } from './preset-parser.js';
// Re-export constants
export * as constants from './constants/index.js';
export { BackupSession } from './transport/backup.js';
export { RestoreSession } from './transport/restore.js';
export { EditBufferSession, EditBufferPhase } from './transport/edit-buffer.js';
export { DeviceSession, DevicePhase } from './transport/device-session.js';
export { SearchSession, SearchPhase } from './transport/search.js';
export { PingSession, PingPhase } from './transport/ping.js';
export { DeviceCoordinator, CoordinatorPhase, OperationType } from './transport/device-coordinator.js';
export { FakeDevice } from './transport/fake-device.js';
// TestHarness is only for tests - not exported to avoid require() in browser
export { parseStatus } from './status-parser.js';
export { parseDcxFile, parseDcxPresets, assemblePagesIntoDcxFile, splitDcxFileIntoPages, createRestoreHeader, getPresetNames, isValidDcxFile, DCX_SIGNATURE, DCX_TERMINATOR, } from './dcx-file.js';
export function camelize(string_) {
    return string_
        .replaceAll(/^\w|[A-Z]|\b\w/g, (word, index) => {
        return index === 0 ? word.toLowerCase() : word.toUpperCase();
    })
        .replaceAll(/\s+/g, '');
}
// Group commands for default export
const commands = {
    setupCommands,
    inputOutputCommands,
    eqCommands: equalizerCommands,
    outputCommands,
};
// Default export for Parser (UI expects this)
const Parser = {
    camelize,
    commands,
    parseEditBuffer,
    parsePreset,
    parseMessage,
    parseDevices,
    parseStatus,
    isOutputChannel,
    getPresetNames,
    parseDcxPresets,
};
export default Parser;
export { dcxStore, DcxStore } from './store/dcx-store.js';
export { isOutputChannel } from './types/index.js';
//# sourceMappingURL=index.js.map
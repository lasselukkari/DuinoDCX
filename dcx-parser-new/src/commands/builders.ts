/**
 * SysEx command builders for DCX2496.
 *
 * This module provides functions to build SysEx messages for various device commands.
 */

import {
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
    PACKET_TYPE_HEADER,
    PACKET_TYPE_PAGE,
    HEADER_SIZE,
} from '../constants/protocol.js';

import { encode8to7 } from '../protocol/encoding.js';
import { calculateChecksum } from '../protocol/checksum.js';

/**
 * Build the SysEx header common to all messages.
 */
export function buildHeader(deviceId: number, command: number): Uint8Array {
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
 */
export function buildPingCommand(deviceId = DEFAULT_DEVICE_ID): Uint8Array {
    return new Uint8Array([...buildHeader(deviceId, CMD_PING), SYSEX_END]);
}

/**
 * Build a page dump request.
 * Requests a specific memory page (0-11) from the device.
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
 * Build a listen mode command (0x3F).
 * Required before sending parameter changes.
 */
export function buildListenModeCommand(
    mode: number = 0x0c,
    state: number = 0x00,
    deviceId = DEFAULT_DEVICE_ID,
): Uint8Array {
    return new Uint8Array([
        ...buildHeader(deviceId, CMD_LISTEN_MODE),
        mode,
        state,
        SYSEX_END,
    ]);
}

/**
 * Build a recall preset command.
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
 */
export function buildDataPacket(
    type: number,
    pageNumber: number,
    data: Uint8Array,
    deviceId = DEFAULT_DEVICE_ID,
    bank = 0x00,
): Uint8Array {
    const encoded = encode8to7(data);
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

    const checksumData = packet.slice(HEADER_SIZE);
    const checksum = calculateChecksum(checksumData);

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
            Math.floor(value / 128) & 0x7f,
            value % 128,
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
// High-Level Parameter Commands
// ============================================================================

import {
    directLookup,
    toRawValue,
    type ParameterDefinition,
} from '../model/param-lookup.js';

/**
 * Target for a parameter change.
 */
export type ParameterTarget =
    | { kind: 'setup'; key: string }
    | { kind: 'channel'; group: 'inputs' | 'outputs'; id: string; key: string }
    | { kind: 'equalizer'; group: 'inputs' | 'outputs'; channelId: string; band: number; key: string };

/**
 * Build a direct command from a semantic parameter target and value.
 *
 * This is the high-level way to build parameter change messages.
 * It looks up the channel/param indices from the target and converts
 * the value to raw format automatically.
 */
export function buildParamChangeCommand(
    target: ParameterTarget,
    value: boolean | string | number,
    deviceId = DEFAULT_DEVICE_ID,
): Uint8Array | null {
    // Find the parameter definition
    const def = findParameterDefinition(target);
    if (!def) {
        console.warn('Parameter not found for target:', target);
        return null;
    }

    // Find the direct command address
    const address = findDirectAddress(target, def.key);
    if (!address) {
        console.warn('Direct address not found for target:', target);
        return null;
    }

    // Convert value to raw
    const rawValue = toRawValue(def, value);

    return buildDirectCommand([{
        channel: address.channel,
        param: address.param,
        value: rawValue,
    }], deviceId);
}

/**
 * Find parameter definition by target.
 */
function findParameterDefinition(target: ParameterTarget): ParameterDefinition | undefined {
    for (const def of directLookup.values()) {
        if (target.kind === 'setup' && def.target.kind === 'setup' && def.key === target.key) {
            return def;
        }
        if (target.kind === 'channel' && def.target.kind === 'channel' &&
            def.target.group === target.group && def.target.id === target.id &&
            def.key === target.key) {
            return def;
        }
        if (target.kind === 'equalizer' && def.target.kind === 'equalizer' &&
            def.target.group === target.group && def.target.channelId === target.channelId &&
            def.target.band === target.band && def.key === target.key) {
            return def;
        }
    }
    return undefined;
}

/**
 * Find direct command address (channel, param) for a target.
 */
function findDirectAddress(
    target: ParameterTarget,
    key: string,
): { channel: number; param: number } | undefined {
    for (const [directKey, def] of directLookup.entries()) {
        if (def.key !== key) continue;

        const matchesTarget =
            (target.kind === 'setup' && def.target.kind === 'setup') ||
            (target.kind === 'channel' && def.target.kind === 'channel' &&
                def.target.group === target.group && def.target.id === target.id) ||
            (target.kind === 'equalizer' && def.target.kind === 'equalizer' &&
                def.target.group === target.group && def.target.channelId === target.channelId &&
                def.target.band === target.band);

        if (matchesTarget) {
            const [ch, param] = directKey.split(':').map(Number);
            return { channel: ch, param };
        }
    }
    return undefined;
}

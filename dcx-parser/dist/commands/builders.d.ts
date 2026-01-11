/**
 * SysEx command builders for DCX2496.
 *
 * This module provides functions to build SysEx messages for various device commands.
 */
/**
 * Build the SysEx header common to all messages.
 */
export declare function buildHeader(deviceId: number, command: number): Uint8Array;
/**
 * Build a ping/search command.
 * Used to detect devices on the bus.
 */
export declare function buildPingCommand(deviceId?: number): Uint8Array;
/**
 * Build a page dump request.
 * Requests a specific memory page (0-11) from the device.
 */
export declare function buildPageDumpRequest(page: number, deviceId?: number): Uint8Array;
/**
 * Build an edit buffer dump request.
 * Requests part 0 or 1 of the current edit buffer.
 */
export declare function buildEditBufferRequest(part: 0 | 1, deviceId?: number): Uint8Array;
/**
 * Build a listen mode command (0x3F).
 * Required before sending parameter changes.
 */
export declare function buildListenModeCommand(mode?: number, state?: number, deviceId?: number): Uint8Array;
/**
 * Build a recall preset command.
 */
export declare function buildRecallCommand(slot: number, deviceId?: number): Uint8Array;
/**
 * Build a store preset command.
 */
export declare function buildStoreCommand(slot: number, deviceId?: number): Uint8Array;
/**
 * Build the sync init command for restore.
 */
export declare function buildSyncCommand(deviceId?: number): Uint8Array;
/**
 * Build a data packet for restore.
 */
export declare function buildDataPacket(type: number, pageNumber: number, data: Uint8Array, deviceId?: number, bank?: number): Uint8Array;
/**
 * Build a header packet for restore (type 0x01).
 */
export declare function buildHeaderPacket(data: Uint8Array, deviceId?: number): Uint8Array;
/**
 * Build a page packet for restore (type 0x0C).
 */
export declare function buildPagePacket(pageNumber: number, data: Uint8Array, deviceId?: number): Uint8Array;
/**
 * Build a direct parameter command.
 */
export declare function buildDirectCommand(parameters: Array<{
    channel: number;
    param: number;
    value: number;
}>, deviceId?: number): Uint8Array;
/**
 * Target for a parameter change.
 */
export type ParameterTarget = {
    kind: 'setup';
    key: string;
} | {
    kind: 'channel';
    group: 'inputs' | 'outputs';
    id: string;
    key: string;
} | {
    kind: 'equalizer';
    group: 'inputs' | 'outputs';
    channelId: string;
    band: number;
    key: string;
};
/**
 * Build a direct command from a semantic parameter target and value.
 *
 * This is the high-level way to build parameter change messages.
 * It looks up the channel/param indices from the target and converts
 * the value to raw format automatically.
 */
export declare function buildParamChangeCommand(target: ParameterTarget, value: boolean | string | number, deviceId?: number): Uint8Array | undefined;
//# sourceMappingURL=builders.d.ts.map
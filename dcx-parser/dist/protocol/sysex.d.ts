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
/** Result of parsing a SysEx message */
export type ParsedMessage = {
    type: 'ping';
    deviceId: number;
    command: number;
} | {
    type: 'search';
    deviceId: number;
    version: number;
    name: string;
    command: number;
} | {
    type: 'pageDump';
    deviceId: number;
    page: number;
    data: Uint8Array;
    command: number;
} | {
    type: 'editBuffer';
    deviceId: number;
    part: number;
    data: Uint8Array;
    command: number;
} | {
    type: 'ack';
    deviceId: number;
    payload: Uint8Array;
    command: number;
} | {
    type: 'pageRequest';
    deviceId: number;
    page: number;
    requestType: number;
    command: number;
} | {
    type: 'direct';
    deviceId: number;
    parameters: Array<{
        channel: number;
        param: number;
        value: number;
    }>;
    command: number;
} | {
    type: 'status';
    deviceId: number;
    command: number;
    data: Uint8Array;
} | {
    type: 'unknown';
    deviceId: number;
    command: number;
    data: Uint8Array;
};
/**
 * Parse a complete SysEx message from the device.
 */
export declare function parseMessage(message: Uint8Array): ParsedMessage | undefined;
/**
 * Parse devices from a search response.
 */
export declare function parseDevices(message: Uint8Array): Array<{
    id: number;
    version: number;
    name: string;
}>;
/**
 * Check if a message is a valid SysEx message.
 */
export declare function isValidSysex(message: Uint8Array): boolean;
/**
 * Extract complete SysEx messages from a stream of bytes.
 * Useful for parsing data from a serial port buffer.
 */
export declare function extractSysexMessages(buffer: Uint8Array): {
    messages: Uint8Array[];
    remaining: Uint8Array;
};
//# sourceMappingURL=sysex.d.ts.map
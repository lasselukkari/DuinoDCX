import { type ParameterDefinition } from './structure.js';
import { type InputChannel, type OutputChannel } from './types/index.js';
export type Cursor = {
    buffer: Uint8Array;
    offset: number;
};
export declare function readString(buffer: Uint8Array, offset: number, length: number): string;
export declare function readU16LE(buffer: Uint8Array, offset: number): number;
export declare function readBytes(buffer: Uint8Array, offset: number, length: number): Uint8Array;
export declare function nextU16(cursor: Cursor): number;
export declare function parseSequential(cursor: Cursor, parameters: ParameterDefinition[]): Record<string, number | string | boolean>;
export declare function parseInputChannel(cursor: Cursor): InputChannel;
export declare function parseOutputChannel(cursor: Cursor): OutputChannel;
/**
 * Parse input channel names from trailing UTF-16LE block.
 * After outputs, there's 24 bytes of padding, then 4 input channel names.
 * Each name: 16 bytes (8 UTF-16LE chars) + 4 bytes padding = 20 bytes.
 */
export declare function parseInputChannelNames(cursor: Cursor, inputs: Record<string, InputChannel>): void;
//# sourceMappingURL=parser-utils.d.ts.map
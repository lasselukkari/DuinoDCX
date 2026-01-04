import type { State } from '../types/index.js';
/** Parsed preset with slot info */
export type ParsedPreset = {
    slot: number;
    name: string;
    isLocked: boolean;
    state: State;
};
/** Result of parsing memory pages */
export type MemoryDumpResult = {
    presets: ParsedPreset[];
    lockFlags: boolean[];
};
/**
 * Parse a full preset from 758 16-bit words.
 */
export declare function parsePresetWords(words: number[]): State;
/**
 * Parse a .dcx file and extract all presets with full state data.
 *
 * The file uses delta compression:
 * - First preset is stored in FULL format (758 words)
 * - Subsequent presets are deltas relative to the previous preset
 */
export declare function parseDcxFileToStates(data: Uint8Array): MemoryDumpResult;
/**
 * Parse memory pages from device dump into presets.
 *
 * @param pages - Array of 12 decoded pages (875 bytes each)
 * @returns Array of parsed presets
 */
export declare function parseMemoryPages(pages: Uint8Array[]): MemoryDumpResult;
//# sourceMappingURL=preset-parser.d.ts.map
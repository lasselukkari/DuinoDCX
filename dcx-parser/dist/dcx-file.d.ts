/**
 * DCX file format parser and serializer.
 *
 * The .dcx file format stores preset data from the DCX2496.
 * This module handles:
 * - Parsing .dcx files to extract preset data
 * - Creating .dcx files from preset data
 * - Assembling page dumps into .dcx format
 *
 * File structure:
 * - Header: XSNP signature + version + size
 * - Lock flags: 60 bytes (one per slot)
 * - Preset 1: Full format at offset 0x4C
 * - Presets 2-60: Compact delta format
 * - Terminator: 4-byte sequence
 */
import type { State } from './types/index.js';
/** File signature */
export declare const DCX_SIGNATURE: Uint8Array<ArrayBuffer>;
/** File terminator */
export declare const DCX_TERMINATOR: Uint8Array<ArrayBuffer>;
/** Header size (signature + version + size + padding) */
export declare const HEADER_SIZE = 16;
/** Lock flags offset */
export declare const LOCK_FLAGS_OFFSET = 12;
/** Lock flags size */
export declare const LOCK_FLAGS_SIZE = 64;
/** Preset 1 offset */
export declare const PRESET_1_OFFSET = 76;
/** Full preset size in words (720 words = 1440 bytes) */
export declare const FULL_PRESET_WORDS = 720;
/** Full preset size in bytes */
export declare const FULL_PRESET_BYTES: number;
/** Number of preset slots */
export declare const NUM_SLOTS = 60;
/** Decoded page size */
export declare const DECODED_PAGE_SIZE = 875;
/** Maximum pages */
export declare const MAX_PAGES = 12;
/** Parsed preset slot information */
export type PresetSlot = {
    /** Slot number (1-60) */
    slot: number;
    /** Preset name (8 chars, trimmed) */
    name: string;
    /** Whether slot is empty */
    isEmpty: boolean;
    /** Whether slot is locked */
    isLocked: boolean;
    /** Raw data offset in file */
    dataOffset: number;
    /** Raw data length */
    dataLength: number;
};
/** Parsed DCX file */
export type DcxFile = {
    /** File version */
    version: number;
    /** Data size (from header) */
    dataSize: number;
    /** Lock flags for all 60 slots */
    lockFlags: boolean[];
    /** Parsed preset slots */
    slots: PresetSlot[];
    /** Raw file data */
    rawData: Uint8Array;
};
/** Preset parsed with full State */
export type ParsedPreset = PresetSlot & {
    state: State;
};
/**
 * Parse a .dcx file.
 */
export declare function parseDcxFile(data: Uint8Array): DcxFile;
/**
 * Parse all 60 presets from a DCX file.
 * Handles full format (Preset 1) and compact delta format (Presets 2-60).
 */
export declare function parseDcxPresets(data: Uint8Array): ParsedPreset[];
/**
 * Assemble decoded page data into a DCX file.
 * This is used when downloading presets from the device.
 */
export declare function assemblePagesIntoDcxFile(pages: Array<{
    page: number;
    data: Uint8Array;
}>): Uint8Array;
/**
 * Split a DCX file into pages for upload.
 * Returns data suitable for building restore packets.
 */
export declare function splitDcxFileIntoPages(dcxData: Uint8Array, pageSize?: number): Array<{
    page: number;
    data: Uint8Array;
}>;
/**
 * Create the restore header data.
 * This is the payload for the header packet (type 0x01).
 *
 * Format: [dataSize (4 bytes LE), 0, 0, 0] + first ~90 bytes of DCX data
 */
export declare function createRestoreHeader(dcxData: Uint8Array, headerDataSize?: number): Uint8Array;
/**
 * Get all preset names from a DCX file.
 */
export declare function getPresetNames(dcxFile: DcxFile): string[];
/**
 * Check if a DCX file is valid.
 */
export declare function isValidDcxFile(data: Uint8Array): boolean;
//# sourceMappingURL=dcx-file.d.ts.map
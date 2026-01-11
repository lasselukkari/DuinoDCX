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
import { parsePreset } from './preset-parser.js';
// ============================================================================
// Constants
// ============================================================================
/** File signature */
export const DCX_SIGNATURE = new Uint8Array([0x58, 0x53, 0x4e, 0x50]); // "XSNP"
/** File terminator */
export const DCX_TERMINATOR = new Uint8Array([0xa7, 0xac, 0xb1, 0xaf]);
/** Header size (signature + version + size + padding) */
export const HEADER_SIZE = 16;
/** Lock flags offset */
export const LOCK_FLAGS_OFFSET = 0x0c;
/** Lock flags size */
export const LOCK_FLAGS_SIZE = 0x40;
/** Preset 1 offset */
export const PRESET_1_OFFSET = 0x4c;
/** Full preset size in words (720 words = 1440 bytes) */
export const FULL_PRESET_WORDS = 720;
/** Full preset size in bytes */
export const FULL_PRESET_BYTES = FULL_PRESET_WORDS * 2;
/** Number of preset slots */
export const NUM_SLOTS = 60;
/** Decoded page size */
export const DECODED_PAGE_SIZE = 875;
/** Maximum pages */
export const MAX_PAGES = 12;
// ============================================================================
// Parsing
// ============================================================================
/**
 * Parse a .dcx file.
 */
export function parseDcxFile(data) {
    // Verify signature
    if (!hasSignature(data, 0, DCX_SIGNATURE)) {
        throw new Error('Invalid DCX file: missing XSNP signature');
    }
    // Read header
    const version = readUint32LE(data, 4);
    const dataSize = readUint32LE(data, 8);
    // Read lock flags
    const lockFlags = [];
    for (let i = 0; i < NUM_SLOTS; i++) {
        lockFlags.push(data[LOCK_FLAGS_OFFSET + i] !== 0);
    }
    // Parse preset slots
    const slots = parsePresetSlots(data, lockFlags);
    return {
        version,
        dataSize,
        lockFlags,
        slots,
        rawData: data,
    };
}
/**
 * Parse all 60 presets from a DCX file.
 * Handles full format (Preset 1) and compact delta format (Presets 2-60).
 */
export function parseDcxPresets(data) {
    const dcxFile = parseDcxFile(data);
    const results = [];
    // Save the original preset 1 data (to reset between each compact preset)
    const preset1Data = data.slice(PRESET_1_OFFSET, PRESET_1_OFFSET + FULL_PRESET_BYTES);
    // Working buffer: Starts as a clone of the original file
    const currentBuffer = new Uint8Array(data);
    for (const slot of dcxFile.slots) {
        if (slot.slot === 1) {
            // Preset 1 is already in currentBuffer at PRESET_1_OFFSET
            try {
                const state = parsePreset(currentBuffer);
                state.header.presetName = slot.name;
                results.push({ ...slot, state });
            }
            catch (error) {
                console.warn(`Failed to parse Preset 1:`, error);
                throw error;
            }
        }
        else {
            if (slot.isEmpty) {
                results.push({ ...slot, state: createEmptyState() });
                continue;
            }
            // Reset the preset 1 area to original data before applying deltas
            // Each compact preset's deltas are relative to preset 1
            currentBuffer.set(preset1Data, PRESET_1_OFFSET);
            // Compact Preset: Apply Deltas
            // Delta Block Format: Loop of [skipLo, skipHi, countLo, countHi, ...values...]
            let deltaPtr = slot.dataOffset;
            const deltaEnd = slot.dataOffset + slot.dataLength;
            // We apply changes to currentBuffer starting at PRESET_1_OFFSET
            // We must track logical word offset in the preset
            let currentWordIndex = 0;
            while (deltaPtr < deltaEnd) {
                // Read Skip Count (Words) - from original data, not currentBuffer!
                if (deltaPtr + 4 > deltaEnd)
                    break;
                const skip = data[deltaPtr] + data[deltaPtr + 1] * 256;
                deltaPtr += 2;
                currentWordIndex += skip;
                if (currentWordIndex >= FULL_PRESET_WORDS)
                    break;
                // Read Change Count (Words)
                const count = data[deltaPtr] + data[deltaPtr + 1] * 256;
                deltaPtr += 2;
                // Apply Changes
                for (let i = 0; i < count; i++) {
                    if (deltaPtr + 2 > deltaEnd)
                        break;
                    if (currentWordIndex >= FULL_PRESET_WORDS)
                        break;
                    const valueLo = data[deltaPtr];
                    const valueHi = data[deltaPtr + 1];
                    deltaPtr += 2;
                    // Patch working buffer
                    // Delta word indices are relative to byte 10 (after 8-byte name + 2-byte padding)
                    const byteOffset = PRESET_1_OFFSET + 10 + currentWordIndex * 2;
                    currentBuffer[byteOffset] = valueLo;
                    currentBuffer[byteOffset + 1] = valueHi;
                    currentWordIndex++;
                }
            }
            // Parse the patched buffer
            try {
                const state = parsePreset(currentBuffer);
                state.header.presetName = slot.name; // Use name from directory
                results.push({ ...slot, state });
            }
            catch (error) {
                console.warn(`Failed to parse Preset ${slot.slot}:`, error);
                // Fallback or empty
                results.push({ ...slot, state: createEmptyState() });
            }
        }
    }
    return results;
}
// Helper for Empty State
function createEmptyState() {
    return {
        header: {
            xpcrSignature: 'XPCR',
            xpcrVersion: 0,
            xpcrExtension: new Uint8Array(0),
            xprbSignature: 'XPRB',
            xprbVersion: 0,
            xprbExtension: new Uint8Array(0),
            deviceName: 'DCX2496',
            deviceNamePadding: new Uint8Array(0),
            signatureBytes: new Uint8Array(0),
            xcurSignature: 'XCUR',
            xcurVersion: 0,
            xcurExtension: new Uint8Array(0),
            presetName: '<Empty>',
            presetNamePadding: new Uint8Array(0),
            headerReserved: new Uint8Array(0),
        },
        setup: {},
        inputs: {},
        outputs: {},
    };
}
/**
 * Parse all preset slots from a DCX file.
 */
function parsePresetSlots(data, lockFlags) {
    const slots = [];
    // Parse slot 1 (full format at fixed offset)
    const slot1Name = readPresetName(data, PRESET_1_OFFSET);
    slots.push({
        slot: 1,
        name: slot1Name,
        isEmpty: slot1Name.length === 0 || slot1Name === '<Empty>',
        isLocked: lockFlags[0],
        dataOffset: PRESET_1_OFFSET,
        dataLength: FULL_PRESET_BYTES,
    });
    // First, scan entire file for all compact preset entries
    // Entry format: [ptr_lo, ptr_hi, slotIndex, 0x00, name(8 bytes), 0x00, 0x00]
    // Total: 14 bytes per entry
    const compactEntries = new Map();
    const compactStart = PRESET_1_OFFSET + FULL_PRESET_BYTES;
    for (let i = compactStart; i < data.length - 14; i++) {
        // Check for valid entry pattern: byte[3] should be 0x00
        if (data[i + 3] !== 0x00)
            continue;
        const slotIdx = data[i + 2];
        // Slot indices 1-59 map to presets 2-60
        if (slotIdx < 1 || slotIdx >= NUM_SLOTS)
            continue;
        // Check entry terminator: bytes 12-13 should be 0x00 0x00
        // This filters out false positives from UTF-16LE data
        if (data[i + 12] !== 0x00 || data[i + 13] !== 0x00)
            continue;
        // Check if name looks valid (bytes 4-11 should be printable or undefined)
        // Name must START with alphanumeric character (A-Z, a-z, 0-9)
        // This filters out UTF-16LE data where high bytes are 00
        const firstChar = data[i + 4];
        const isAlphanumeric = (firstChar >= 0x30 && firstChar <= 0x39) || // 0-9
            (firstChar >= 0x41 && firstChar <= 0x5a) || // A-Z
            (firstChar >= 0x61 && firstChar <= 0x7a); // A-z
        if (!isAlphanumeric)
            continue;
        let validName = true;
        for (let j = 5; j < 12; j++) {
            const c = data[i + j];
            if (c !== 0 && (c < 32 || c > 126)) {
                validName = false;
                break;
            }
        }
        if (!validName)
            continue;
        // Read the name
        const name = readCompactPresetName(data, i + 4);
        // Only accept if we haven't seen this slot yet
        if (!compactEntries.has(slotIdx)) {
            compactEntries.set(slotIdx, { offset: i, name });
        }
    }
    // Parse slots 2-60 using the found entries
    for (let slotNumber = 2; slotNumber <= NUM_SLOTS; slotNumber++) {
        const slotIdx = slotNumber - 1; // Slot 2 = index 1, slot 37 = index 36
        const entry = compactEntries.get(slotIdx);
        if (entry) {
            // Read pointer to calculate data offset
            const ptrLo = data[entry.offset];
            const ptrHi = data[entry.offset + 1];
            const ptr = ptrLo + ptrHi * 256;
            // Delta data starts right after the 14-byte directory entry
            // The ptr field appears to be total entry size or offset to next entry
            const dataOffset = entry.offset + 14;
            // Calculate data length: ptr - 14 gives the delta data size
            // (ptr includes the 14-byte directory entry)
            const dataLength = ptr > 14 ? ptr - 14 : 0;
            slots.push({
                slot: slotNumber,
                name: entry.name,
                isEmpty: entry.name.length === 0,
                isLocked: lockFlags[slotNumber - 1],
                dataOffset,
                dataLength,
            });
        }
        else {
            // Slot not found, mark as empty
            slots.push({
                slot: slotNumber,
                name: '',
                isEmpty: true,
                isLocked: lockFlags[slotNumber - 1],
                dataOffset: 0,
                dataLength: 0,
            });
        }
    }
    return slots;
}
/**
 * Read a preset name from the full format (slot 1).
 */
function readPresetName(data, offset) {
    // Name is at the start of the preset data (8 bytes)
    let name = '';
    for (let i = 0; i < 8; i++) {
        const char = data[offset + i];
        if (char >= 32 && char <= 126) {
            name += String.fromCodePoint(char);
        }
    }
    return name.trim();
}
/**
 * Read a preset name from compact format.
 */
function readCompactPresetName(data, offset) {
    let name = '';
    for (let i = 0; i < 8; i++) {
        const char = data[offset + i];
        if (char >= 32 && char <= 126) {
            name += String.fromCodePoint(char);
        }
    }
    return name.trim();
}
// ============================================================================
// Page Assembly
// ============================================================================
/**
 * Assemble decoded page data into a DCX file.
 * This is used when downloading presets from the device.
 */
export function assemblePagesIntoDcxFile(pages) {
    if (pages.length === 0) {
        throw new Error('No pages to assemble');
    }
    // Sort pages by number
    const sortedPages = [...pages].sort((a, b) => a.page - b.page);
    // Concatenate all pages (they are 1:1 "Indexed" with flag bytes)
    const totalLength = sortedPages.reduce((sum, p) => sum + p.data.length, 0);
    const indexedData = new Uint8Array(totalLength);
    let offset = 0;
    for (const page of sortedPages) {
        indexedData.set(page.data, offset);
        offset += page.data.length;
    }
    // CRITICAL: The page dump data is ALREADY decoded by parseMessage (via decode7to8).
    // We do not need to decode it again.
    const rawData = indexedData;
    // Find XSNP signature in the RAW data
    const xsnpOffset = findSignature(rawData, DCX_SIGNATURE);
    if (xsnpOffset < 0) {
        throw new Error('XSNP signature not found in page data');
    }
    // Extract from XSNP onwards
    let dcxData = rawData.slice(xsnpOffset);
    // Find terminator and trim
    const termOffset = findSignature(dcxData, DCX_TERMINATOR);
    if (termOffset >= 0) {
        // The .dcx file includes the 4-byte terminator
        dcxData = dcxData.slice(0, termOffset + DCX_TERMINATOR.length);
    }
    return dcxData;
}
/**
 * Split a DCX file into pages for upload.
 * Returns data suitable for building restore packets.
 */
export function splitDcxFileIntoPages(dcxData, pageSize = DECODED_PAGE_SIZE) {
    const pages = [];
    // Create the preamble for the first page
    // Format: [LenLo, LenHi, 0, 0, 0, 0, 0] + XSNP data
    const dataSize = dcxData.length;
    const preamble = new Uint8Array(7);
    preamble[0] = dataSize & 0xff;
    preamble[1] = (dataSize >> 8) & 0xff;
    // Prepend preamble to DCX data
    const fullData = new Uint8Array(preamble.length + dcxData.length);
    fullData.set(preamble);
    fullData.set(dcxData, preamble.length);
    // Split into pages
    let offset = 0;
    let pageNumber = 0;
    while (offset < fullData.length) {
        const remaining = fullData.length - offset;
        const chunkSize = Math.min(remaining, pageSize);
        const pageData = fullData.slice(offset, offset + chunkSize);
        // Only pad intermediate pages, not the last page
        // The last page should have its actual size
        const isLastPage = offset + chunkSize >= fullData.length;
        const finalData = isLastPage
            ? pageData
            : (() => {
                const paddedData = new Uint8Array(pageSize);
                paddedData.set(pageData);
                return paddedData;
            })();
        pages.push({
            page: pageNumber,
            data: finalData,
        });
        offset += chunkSize;
        pageNumber++;
    }
    return pages;
}
// ============================================================================
// File Creation
// ============================================================================
/**
 * Create the restore header data.
 * This is the payload for the header packet (type 0x01).
 *
 * Format: [dataSize (4 bytes LE), 0, 0, 0] + first ~90 bytes of DCX data
 */
export function createRestoreHeader(dcxData, headerDataSize = 91) {
    const header = new Uint8Array(7 + headerDataSize);
    // Size in first 4 bytes (little-endian)
    const size = dcxData.length;
    header[0] = size & 0xff;
    header[1] = (size >> 8) & 0xff;
    header[2] = (size >> 16) & 0xff;
    header[3] = (size >> 24) & 0xff;
    // Zeros for bytes 4-6
    header[4] = 0;
    header[5] = 0;
    header[6] = 0;
    // Copy first portion of DCX data
    const copyLength = Math.min(headerDataSize, dcxData.length);
    header.set(dcxData.slice(0, copyLength), 7);
    return header;
}
// ============================================================================
// Utilities
// ============================================================================
/**
 * Check if data has a signature at the given offset.
 */
function hasSignature(data, offset, signature) {
    if (offset + signature.length > data.length)
        return false;
    for (const [i, element] of signature.entries()) {
        if (data[offset + i] !== element)
            return false;
    }
    return true;
}
/**
 * Find the first occurrence of a signature in data.
 */
function findSignature(data, signature) {
    for (let i = 0; i <= data.length - signature.length; i++) {
        if (hasSignature(data, i, signature))
            return i;
    }
    return -1;
}
/**
 * Read a 32-bit little-endian unsigned integer.
 */
function readUint32LE(data, offset) {
    return ((data[offset] |
        (data[offset + 1] << 8) |
        (data[offset + 2] << 16) |
        (data[offset + 3] << 24)) >>>
        0);
}
/**
 * Get all preset names from a DCX file.
 */
export function getPresetNames(dcxFile) {
    return dcxFile.slots.map((slot) => slot.name || '<Empty>');
}
/**
 * Check if a DCX file is valid.
 */
export function isValidDcxFile(data) {
    if (data.length < HEADER_SIZE)
        return false;
    return hasSignature(data, 0, DCX_SIGNATURE);
}
//# sourceMappingURL=dcx-file.js.map
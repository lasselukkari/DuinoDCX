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

// Encoding functions available but not currently used
// import { decode7to8, encode8to7 } from './encoding.js';

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
// Types
// ============================================================================

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

// ============================================================================
// Parsing
// ============================================================================

/**
 * Parse a .dcx file.
 */
export function parseDcxFile(data: Uint8Array): DcxFile {
  // Verify signature
  if (!hasSignature(data, 0, DCX_SIGNATURE)) {
    throw new Error('Invalid DCX file: missing XSNP signature');
  }

  // Read header
  const version = readUint32LE(data, 4);
  const dataSize = readUint32LE(data, 8);

  // Read lock flags
  const lockFlags: boolean[] = [];
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
 * Parse all preset slots from a DCX file.
 */
function parsePresetSlots(
  data: Uint8Array,
  lockFlags: boolean[],
): PresetSlot[] {
  const slots: PresetSlot[] = [];

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

  // Parse slots 2-60 (compact format)
  // These use variable-length delta encoding
  let offset = PRESET_1_OFFSET + FULL_PRESET_BYTES;

  for (let slotNumber = 2; slotNumber <= NUM_SLOTS; slotNumber++) {
    if (offset >= data.length - 4) {
      // No more data, remaining slots are empty
      slots.push({
        slot: slotNumber,
        name: '',
        isEmpty: true,
        isLocked: lockFlags[slotNumber - 1],
        dataOffset: 0,
        dataLength: 0,
      });
      continue;
    }

    // Look for slot index marker
    const found = findSlotEntry(data, offset, slotNumber - 1);
    if (found) {
      const name = readCompactPresetName(data, found.nameOffset);
      slots.push({
        slot: slotNumber,
        name,
        isEmpty: name.length === 0,
        isLocked: lockFlags[slotNumber - 1],
        dataOffset: found.dataOffset,
        dataLength: found.dataLength,
      });
      offset = found.nextOffset;
    } else {
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
 * Find the end of a preset data block by scanning for the next entry or terminator.
 */
function findDataBlockEnd(data: Uint8Array, startOffset: number): number {
  let offset = startOffset;
  while (offset < data.length - 4) {
    if (hasSignature(data, offset, DCX_TERMINATOR)) {
      break;
    }

    // Check if this looks like a new entry (slot index in valid range)
    if (data[offset + 2] < NUM_SLOTS && data[offset + 3] === 0x00) {
      break;
    }

    offset++;
  }

  return offset;
}

/**
 * Find a compact preset entry by slot index.
 */
function findSlotEntry(
  data: Uint8Array,
  startOffset: number,
  targetIndex: number,
):
  | {
    nameOffset: number;
    dataOffset: number;
    dataLength: number;
    nextOffset: number;
  }
  | undefined {
  // Compact entries have format:
  // [ptr_lo, ptr_hi, slotIndex, 0x00, name(8 bytes), 0x00, 0x00]
  // Total: 14 bytes for directory record

  const ENTRY_SIZE = 14;
  let offset = startOffset;

  // Search for the slot index
  while (offset + ENTRY_SIZE <= data.length - 4) {
    // Check for terminator
    if (hasSignature(data, offset, DCX_TERMINATOR)) {
      return undefined;
    }

    // Read slot index at offset + 2
    const slotIndex = data[offset + 2];

    if (slotIndex === targetIndex) {
      // Found it
      const ptrLo = data[offset];
      const ptrHi = data[offset + 1];
      const ptr = ptrLo + ptrHi * 256;

      // Pointer is relative offset to data block
      const dataOffset = ptr > ENTRY_SIZE ? offset + ptr : 0;

      // Calculate data length (up to next entry or terminator)
      const nextOffset =
        dataOffset > 0
          ? findDataBlockEnd(data, offset + ENTRY_SIZE)
          : offset + ENTRY_SIZE;

      return {
        nameOffset: offset + 4,
        dataOffset,
        dataLength: dataOffset > 0 ? nextOffset - dataOffset : 0,
        nextOffset,
      };
    }

    // Move to next potential entry
    offset++;
  }

  return undefined;
}

/**
 * Read a preset name from the full format (slot 1).
 */
function readPresetName(data: Uint8Array, offset: number): string {
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
function readCompactPresetName(data: Uint8Array, offset: number): string {
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
export function assemblePagesIntoDcxFile(
  pages: Array<{ page: number; data: Uint8Array }>,
): Uint8Array {
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

  // CRITICAL: The page dump data is "Indexed" (8->8 bytes). 
  // We MUST convert it to "Raw" (8->7 bytes) BEFORE searching for signatures.
  const numBlocks = Math.floor(indexedData.length / 8);
  const rawData = new Uint8Array(numBlocks * 7 + (indexedData.length % 8));
  for (let i = 0; i < numBlocks; i++) {
    const srcStart = i * 8;
    const dstStart = i * 7;
    const msbByte = indexedData[srcStart + 7];

    for (let j = 0; j < 7; j++) {
      let byte = indexedData[srcStart + j];
      if (msbByte & (1 << j)) {
        byte |= 0x80;
      }
      rawData[dstStart + j] = byte;
    }
  }
  if (indexedData.length % 8 !== 0) {
    rawData.set(indexedData.slice(numBlocks * 8), numBlocks * 7);
  }

  // Find XSNP signature in the RAW data
  let xsnpOffset = findSignature(rawData, DCX_SIGNATURE);
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
export function splitDcxFileIntoPages(
  dcxData: Uint8Array,
  pageSize = DECODED_PAGE_SIZE,
): Array<{ page: number; data: Uint8Array }> {
  const pages: Array<{ page: number; data: Uint8Array }> = [];

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
    const isLastPage = (offset + chunkSize) >= fullData.length;
    const finalData = isLastPage ? pageData : (() => {
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
export function createRestoreHeader(
  dcxData: Uint8Array,
  headerDataSize = 91,
): Uint8Array {
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
function hasSignature(
  data: Uint8Array,
  offset: number,
  signature: Uint8Array,
): boolean {
  if (offset + signature.length > data.length) return false;
  for (const [i, element] of signature.entries()) {
    if (data[offset + i] !== element) return false;
  }

  return true;
}

/**
 * Find the first occurrence of a signature in data.
 */
function findSignature(data: Uint8Array, signature: Uint8Array): number {
  for (let i = 0; i <= data.length - signature.length; i++) {
    if (hasSignature(data, i, signature)) return i;
  }

  return -1;
}

/**
 * Read a 32-bit little-endian unsigned integer.
 */
function readUint32LE(data: Uint8Array, offset: number): number {
  return (
    (data[offset] |
      (data[offset + 1] << 8) |
      (data[offset + 2] << 16) |
      (data[offset + 3] << 24)) >>>
    0
  );
}

/**
 * Get all preset names from a DCX file.
 */
export function getPresetNames(dcxFile: DcxFile): string[] {
  return dcxFile.slots.map((slot) => slot.name || '<Empty>');
}

/**
 * Check if a DCX file is valid.
 */
export function isValidDcxFile(data: Uint8Array): boolean {
  if (data.length < HEADER_SIZE) return false;
  return hasSignature(data, 0, DCX_SIGNATURE);
}

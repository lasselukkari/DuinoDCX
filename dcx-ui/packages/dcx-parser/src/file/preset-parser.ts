import type {State} from '../types/index.js';
import {createEmptyState} from '../model/helpers.js';
import {wordLookup, convertValue, applyToState} from '../model/param-lookup.js';

// ============================================================================
// Constants
// ============================================================================

/** Total words per preset (720 params + 38 labels/marker) */
const PRESET_SIZE = 758;

// ============================================================================
// Types
// ============================================================================

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

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Parse input channel names from the label section (words 720-756).
 * Each input name is 10 words (8 chars ASCII stored as low byte + padding).
 */
function parseInputNames(words: number[]): string[] {
  const names: string[] = [];
  const LABEL_START = 720;
  const NAME_SIZE = 10; // 10 words per name (8 chars + delimiter + marker)

  for (let input = 0; input < 4; input++) {
    let name = '';
    const start = LABEL_START + input * NAME_SIZE;
    for (let i = 0; i < 8; i++) {
      const byte = words[start + i] & 0xff;
      if (byte >= 32 && byte <= 126) {
        name += String.fromCodePoint(byte);
      }
    }

    names.push(name.trim());
  }

  return names;
}

/**
 * Parse a full preset from 758 16-bit words.
 */
export function parsePresetWords(words: number[]): State {
  const state = createEmptyState();

  // Unified metadata-driven parsing
  for (const [offset, def] of wordLookup) {
    let raw = words[offset];

    // Handle 32-bit values (e.g. Long Delay in outputs)
    if (def.wordHighOffset !== undefined) {
      // Note: Device uses * 256 for the high word in this 32-bit context
      raw += words[def.wordHighOffset] * 256;
    }

    const value = convertValue(def, raw);
    applyToState(state, def, value);
  }

  // Parse input channel names (strings not in wordLookup yet)
  const inputNames = parseInputNames(words);
  state.inputs.A.channelName = inputNames[0];
  state.inputs.B.channelName = inputNames[1];
  state.inputs.C.channelName = inputNames[2];
  state.inputs.Sum.channelName = inputNames[3];

  return state;
}

// ============================================================================
// DCX File Parsing
// ============================================================================

/**
 * Parse a .dcx file and extract all presets with full state data.
 *
 * The file uses delta compression:
 * - First preset is stored in FULL format (758 words)
 * - Subsequent presets are deltas relative to the previous preset
 */
export function parseDcxFileToStates(data: Uint8Array): MemoryDumpResult {
  // Verify magic
  if (
    data[0] !== 0x58 || // 'X'
    data[1] !== 0x53 || // 'S'
    data[2] !== 0x4e || // 'N'
    data[3] !== 0x50 // 'P'
  ) {
    const magic = data.slice(0, 4).join(', ');
    throw new Error(`Invalid DCX file magic: [${magic}]`);
  }

  // Read lock flags (0x0C - 0x48): 0=unlocked, 1=locked
  const lockFlags: boolean[] = [];
  for (let i = 0; i < 60; i++) {
    lockFlags.push(data[0x0c + i] !== 0);
  }

  // Read first preset index (0x48-0x4C)
  const firstIndex =
    data[0x48] +
    data[0x49] * 256 +
    data[0x4a] * 65_536 +
    data[0x4b] * 16_777_216;

  // Check for terminator (index=60 means no presets)
  if (firstIndex === 60) {
    const magic =
      data[0x4c] +
      data[0x4d] * 256 +
      data[0x4e] * 65_536 +
      data[0x4f] * 16_777_216;
    if (magic === 0xaf_b1_ac_a7) {
      return {presets: [], lockFlags};
    }

    throw new Error(`Invalid terminator magic: 0x${magic.toString(16)}`);
  }

  const presets: ParsedPreset[] = [];

  // Read first preset name (0x4C-0x54, 8 bytes)
  let firstName = '';
  for (let i = 0x4c; i < 0x54; i++) {
    const char = data[i];
    if (char >= 32 && char <= 126) {
      firstName += String.fromCodePoint(char);
    }
  }

  firstName = firstName.trim();

  // Read FULL preset data (758 words starting at 0x56)
  const currentPreset: number[] = [];
  let offset = 0x56;
  for (let i = 0; i < PRESET_SIZE; i++) {
    const word = data[offset + i * 2] + data[offset + i * 2 + 1] * 256;
    currentPreset.push(word);
  }

  const firstState = parsePresetWords(currentPreset);
  firstState.presetName = firstName;

  presets.push({
    slot: firstIndex + 1, // Convert to 1-based
    name: firstName,
    isLocked: lockFlags[firstIndex],
    state: firstState,
  });

  let currentIndex = firstIndex;

  // Move to start of COMPACT chain
  offset = 0x56 + PRESET_SIZE * 2;

  // Read delta chain
  while (offset < data.length - 10) {
    // Read next preset index (2 bytes LE)
    const nextIndex = data[offset] + data[offset + 1] * 256;

    // Check for terminator (60 as LE32)
    if (nextIndex === 60) {
      const magic =
        data[offset + 2] +
        data[offset + 3] * 256 +
        data[offset + 4] * 65_536 +
        data[offset + 5] * 16_777_216;
      if (magic === 0xaf_b1_ac_a7) {
        break;
      }
    }

    // Check validity
    if (nextIndex === 0 || nextIndex > 60) {
      break;
    }

    if (nextIndex <= currentIndex) {
      break;
    }

    offset += 2;

    // Read preset name (10 bytes: 8 chars + 2 pad)
    let name = '';
    for (let i = 0; i < 8; i++) {
      const char = data[offset + i];
      if (char >= 32 && char <= 126) {
        name += String.fromCodePoint(char);
      }
    }

    name = name.trim();
    offset += 10;

    // Apply deltas from current preset to create next preset
    const nextPreset = [...currentPreset];
    let srcPos = 0;

    while (srcPos < PRESET_SIZE) {
      // Read skip count (words to copy unchanged)
      const skipCount = data[offset] + data[offset + 1] * 256;
      offset += 2;
      srcPos += skipCount;

      if (srcPos >= PRESET_SIZE) {
        break;
      }

      // Read change count (words with new values)
      const changeCount = data[offset] + data[offset + 1] * 256;
      offset += 2;

      // Read new values from file
      for (let i = 0; i < changeCount; i++) {
        if (srcPos + i < PRESET_SIZE) {
          const newWord = data[offset] + data[offset + 1] * 256;
          offset += 2;
          nextPreset[srcPos + i] = newWord;
        }
      }

      srcPos += changeCount;
    }

    const nextState = parsePresetWords(nextPreset);
    nextState.presetName = name;

    presets.push({
      slot: nextIndex + 1, // Convert to 1-based
      name,
      isLocked: lockFlags[nextIndex],
      state: nextState,
    });

    // Update current preset for next iteration
    for (let i = 0; i < PRESET_SIZE; i++) {
      currentPreset[i] = nextPreset[i];
    }

    currentIndex = nextIndex;
  }

  return {presets, lockFlags};
}

/**
 * Parse memory pages from device dump into presets.
 *
 * @param pages - Array of 12 decoded pages (875 bytes each)
 * @returns Array of parsed presets
 */
export function parseMemoryPages(pages: Uint8Array[]): MemoryDumpResult {
  // Combine pages into a single buffer with DCX file structure
  // Page 0 contains: 7-byte preamble + XSNP header (76 bytes) + preset data
  // We need to reconstruct the file format

  if (pages.length === 0) {
    return {presets: [], lockFlags: Array.from({length: 60}, () => false)};
  }

  // The memory pages from the device are essentially the same as
  // the data portion of a .dcx file (after the XSNP header).
  // We need to extract the presets from the combined page data.

  // Combine all pages
  const totalSize = pages.reduce((sum, p) => sum + p.length, 0);
  const combined = new Uint8Array(totalSize);
  let pos = 0;
  for (const page of pages) {
    combined.set(page, pos);
    pos += page.length;
  }

  // Page 0 structure (from protocol_findings.md):
  // Offset 0-6: Preamble [LenLo LenHi 00 00 00 00 00]
  // Offset 7-82: XSNP header (76 bytes)
  // Offset 83+: Full preset data starts here

  // Check for XSNP signature at offset 7
  if (
    combined[7] !== 0x58 || // 'X'
    combined[8] !== 0x53 || // 'S'
    combined[9] !== 0x4e || // 'N'
    combined[10] !== 0x50 // 'P'
  ) {
    throw new Error(
      'Invalid memory dump: XSNP signature not found at expected offset',
    );
  }

  // Extract lock flags from XSNP header (offset 7 + 0x0C = 0x13)
  const lockFlagsOffset = 7 + 0x0c;
  const lockFlags: boolean[] = [];
  for (let i = 0; i < 60; i++) {
    lockFlags.push(combined[lockFlagsOffset + i] !== 0);
  }

  // First preset index at offset 7 + 0x48 = 0x4F
  const indexOffset = 7 + 0x48;
  const firstIndex =
    combined[indexOffset] +
    combined[indexOffset + 1] * 256 +
    combined[indexOffset + 2] * 65_536 +
    combined[indexOffset + 3] * 16_777_216;

  if (firstIndex >= 60) {
    return {presets: [], lockFlags};
  }

  const presets: ParsedPreset[] = [];

  // First preset name at offset 7 + 0x4C = 0x53
  const nameOffset = 7 + 0x4c;
  let firstName = '';
  for (let i = 0; i < 8; i++) {
    const char = combined[nameOffset + i];
    if (char >= 32 && char <= 126) {
      firstName += String.fromCodePoint(char);
    }
  }

  firstName = firstName.trim();

  // First preset data at offset 7 + 0x56 = 0x5D (word offset 83 in the documented layout)
  const dataOffset = 7 + 0x56;
  const currentPreset: number[] = [];
  for (let i = 0; i < PRESET_SIZE; i++) {
    const byteOffset = dataOffset + i * 2;
    if (byteOffset + 1 < combined.length) {
      currentPreset.push(combined[byteOffset] + combined[byteOffset + 1] * 256);
    } else {
      currentPreset.push(0);
    }
  }

  presets.push({
    slot: firstIndex + 1,
    name: firstName,
    isLocked: lockFlags[firstIndex],
    state: parsePresetWords(currentPreset),
  });

  // Continue with delta chain (same logic as parseDcxFile)
  let currentIndex = firstIndex;
  let offset = dataOffset + PRESET_SIZE * 2;

  while (offset < combined.length - 10) {
    const nextIndex = combined[offset] + combined[offset + 1] * 256;

    if (nextIndex === 60) {
      break;
    }

    if (nextIndex === 0 || nextIndex > 60 || nextIndex <= currentIndex) {
      break;
    }

    offset += 2;

    let name = '';
    for (let i = 0; i < 8; i++) {
      const char = combined[offset + i];
      if (char >= 32 && char <= 126) {
        name += String.fromCodePoint(char);
      }
    }

    name = name.trim();
    offset += 10;

    const nextPreset = [...currentPreset];
    let srcPos = 0;

    while (srcPos < PRESET_SIZE && offset < combined.length - 4) {
      const skipCount = combined[offset] + combined[offset + 1] * 256;
      offset += 2;
      srcPos += skipCount;

      if (srcPos >= PRESET_SIZE) break;

      const changeCount = combined[offset] + combined[offset + 1] * 256;
      offset += 2;

      for (let i = 0; i < changeCount && offset < combined.length - 1; i++) {
        if (srcPos + i < PRESET_SIZE) {
          nextPreset[srcPos + i] =
            combined[offset] + combined[offset + 1] * 256;
          offset += 2;
        }
      }

      srcPos += changeCount;
    }

    presets.push({
      slot: nextIndex + 1,
      name,
      isLocked: lockFlags[nextIndex],
      state: parsePresetWords(nextPreset),
    });

    for (let i = 0; i < PRESET_SIZE; i++) {
      currentPreset[i] = nextPreset[i];
    }

    currentIndex = nextIndex;
  }

  return {presets, lockFlags};
}

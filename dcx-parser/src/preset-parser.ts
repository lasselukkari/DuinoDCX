/**
 * Preset parser for DCX2496 memory page dumps.
 *
 * Parses the 12-page memory dump (pages 0-11) containing all 60 presets.
 * This is different from the edit buffer format - presets use:
 * - 16-bit words (little-endian)
 * - Delta compression for slots 2-60
 * - Different memory layout than edit buffer
 *
 * Based on reverse-engineered protocol from dcx-preset-parser.py
 */

import type { State, Channel, Eq } from './types.js';
import constants from './constants.js';

// ============================================================================
// Constants
// ============================================================================

/** Total words per preset (720 params + 38 labels/marker) */
const PRESET_SIZE = 758;

/** Output section size in words */
const OUTPUT_SECTION_SIZE = 74;

/** Number of EQ bands per channel */
const EQ_BANDS = 9;

/** Words per EQ band */
const EQ_BAND_SIZE = 5;

// Channel offsets (word index from preset data start)
const INPUT_A_OFFSET = 21;
const INPUT_B_OFFSET = 83;
const INPUT_C_OFFSET = 145;
const SUM_OFFSET = 207;
const OUTPUT_1_OFFSET = 269;

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

function lookupFrequency(index: number): string {
  return constants.logFrequencyScale[index] ?? String(index);
}

function lookupQ(index: number): string {
  return constants.EQ_Q_VALUES[index] ?? String(index);
}

function lookupEqType(index: number): string {
  return constants.EQ_TYPES[index] ?? String(index);
}

function lookupSlope(index: number): string {
  return constants.EQ_SHELVING_SLOPES[index] ?? String(index);
}

function lookupOutputConfig(index: number): string {
  return constants.OUTPUT_CONFIGS[index] ?? String(index);
}

function lookupAttack(index: number): string {
  return constants.attackTimes[index] ?? String(index);
}

function lookupRelease(index: number): string {
  return constants.logZeroTo4000Ms[index] ?? String(index);
}

function lookupRatio(index: number): string {
  return constants.eqRatios[index] ?? String(index);
}

function lookupOutputName(index: number): string {
  return constants.outputNames[index] ?? String(index);
}

function lookupSource(index: number): string {
  return constants.outputSources[index] ?? String(index);
}

function lookupCrossoverFilter(index: number): string {
  return constants.crossoverFilters[index] ?? String(index);
}

function lookupPolarity(index: number): string {
  return constants.POLARITIES[index] ?? String(index);
}

function rawToGain(raw: number): number {
  // 150 = 0dB, each unit = 0.1dB, range 0-300 = -15dB to +15dB
  return (raw - 150) / 10;
}

function rawToTemperature(raw: number): number {
  // 40 = 20°C, raw/2 = Celsius
  return raw / 2;
}

// ============================================================================
// State Initialization
// ============================================================================

function createEmptyEq(): Eq {
  return {
    eqType: '',
    eqFrequency: '',
    eqGain: 0,
    eqQ: '',
    eqShelving: '',
  };
}

function createEmptyChannel(): Channel {
  const eqs: Record<string, Eq> = {};
  for (let i = 1; i <= 9; i++) {
    eqs[String(i)] = createEmptyEq();
  }

  return {
    channelName: '',
    gain: 0,
    mute: false,
    isDelayOn: false,
    longDelay: 0,
    isEqOn: false,
    eqNumber: 0,
    eqIndex: 0,
    isDynamicEqOn: false,
    dynamicEqType: '',
    dynamicEqFrequency: '',
    dynamicEqGain: 0,
    dynamicEqQ: '',
    dynamicEqShelving: '',
    dynamicEqAttack: '',
    dynamicEqRelease: '',
    dynamicEqRatio: '',
    dynamicEqThreshold: 0,
    eqs,
  };
}

function createEmptyState(): State {
  return {
    setup: {
      inputSumType: '',
      inputAbSource: '',
      inputCGain: '',
      outputConfig: '',
      stereolink: false,
      stereolinkMode: '',
      delayLink: false,
      crossoverLink: false,
      isDelayCorrectionOn: false,
      airTemperature: 0,
      delayUnits: '',
      muteOutsWhenPowered: false,
      inputASumGain: 0,
      inputBSumGain: 0,
      inputCSumGain: 0,
    },
    inputs: {
      A: createEmptyChannel(),
      B: createEmptyChannel(),
      C: createEmptyChannel(),
      Sum: createEmptyChannel(),
    },
    outputs: {
      '1': createEmptyChannel(),
      '2': createEmptyChannel(),
      '3': createEmptyChannel(),
      '4': createEmptyChannel(),
      '5': createEmptyChannel(),
      '6': createEmptyChannel(),
    },
  };
}

function parseEqBands(
  words: number[],
  sectionStart: number,
): Record<string, Eq> {
  const eqs: Record<string, Eq> = {};

  // Regular bands start at section_start + 10 (after 4-word prefix + 6-word dynamic EQ)
  const bandStart = sectionStart + 10;

  for (let i = 0; i < EQ_BANDS; i++) {
    const offset = bandStart + i * EQ_BAND_SIZE;
    eqs[String(i + 1)] = {
      eqFrequency: lookupFrequency(words[offset]),
      eqQ: lookupQ(words[offset + 1]),
      eqGain: rawToGain(words[offset + 2]),
      eqType: lookupEqType(words[offset + 3]),
      eqShelving: lookupSlope(words[offset + 4]),
    };
  }

  return eqs;
}

function parseDynamicEq(
  words: number[],
  sectionStart: number,
): Partial<Channel> {
  // Dynamic EQ: attack at +0, release at +1, ratio at +2, threshold at +3
  return {
    dynamicEqAttack: lookupAttack(words[sectionStart]),
    dynamicEqRelease: lookupRelease(words[sectionStart + 1]),
    dynamicEqRatio: lookupRatio(words[sectionStart + 2]),
    dynamicEqThreshold: words[sectionStart + 3],
    isDynamicEqOn: words[sectionStart + 4] !== 0,
    dynamicEqFrequency: lookupFrequency(words[sectionStart + 5]),
    dynamicEqQ: lookupQ(words[sectionStart + 6]),
    dynamicEqGain: rawToGain(words[sectionStart + 7]),
    dynamicEqType: lookupEqType(words[sectionStart + 8]),
    dynamicEqShelving: lookupSlope(words[sectionStart + 9]),
  };
}

function parseInputChannel(words: number[], sectionStart: number): Channel {
  const channel = createEmptyChannel();

  // Dynamic EQ
  Object.assign(channel, parseDynamicEq(words, sectionStart));

  // EQ bands
  channel.eqs = parseEqBands(words, sectionStart);

  // Trailing settings (section_start + 55 onwards)
  const trailStart = sectionStart + 55;
  channel.gain = rawToGain(words[trailStart]);
  channel.mute = words[trailStart + 1] !== 0;
  channel.isDelayOn = words[trailStart + 2] !== 0;
  // Short delay at trailStart + 3
  channel.longDelay = words[trailStart + 4];

  return channel;
}

function parseOutputChannel(words: number[], sectionStart: number): Channel {
  const channel = createEmptyChannel();

  // Dynamic EQ
  Object.assign(channel, parseDynamicEq(words, sectionStart));

  // EQ bands
  channel.eqs = parseEqBands(words, sectionStart);

  // Output settings block (section_start + 55)
  const settingsStart = sectionStart + 55;

  // Output settings layout (verified via delta comparison 2026-01-04):
  // +0: name_index, +1: source, +2: hp_filter, +3: hp_freq
  // +4: lp_filter, +5: lp_freq, +6: reserved
  // +7: long_delay_low, +8: long_delay_high (32-bit combined)
  // +9: polarity, +10: phase, +11: short_delay
  // +12: gain, +13: mute, +14: limiter_on, +15: limiter_threshold
  // +16: limiter_release

  channel.channelName = lookupOutputName(words[settingsStart]);
  channel.source = lookupSource(words[settingsStart + 1]);
  channel.highpassFilter = lookupCrossoverFilter(words[settingsStart + 2]);
  channel.highpassFrequency = words[settingsStart + 3];
  channel.lowpassFilter = lookupCrossoverFilter(words[settingsStart + 4]);
  channel.lowpassFrequency = words[settingsStart + 5];
  // Long delay is 32-bit: low word at +7, high word at +8
  channel.longDelay = words[settingsStart + 7] + words[settingsStart + 8] * 256;
  channel.polarity = lookupPolarity(words[settingsStart + 9]);
  channel.phase = words[settingsStart + 10];
  channel.shortDelay = words[settingsStart + 11];
  channel.gain = rawToGain(words[settingsStart + 12]);
  channel.mute = words[settingsStart + 13] !== 0;
  channel.isLimiterOn = words[settingsStart + 14] !== 0;
  channel.limiterThreshold = words[settingsStart + 15];
  channel.limiterRelease = lookupRelease(words[settingsStart + 16]);
  channel.isDelayOn = true; // Outputs always have delay capability

  return channel;
}

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

  // Global settings
  state.setup.outputConfig = lookupOutputConfig(words[5]);
  state.setup.airTemperature = rawToTemperature(words[10]);

  // Input gains from global section
  state.setup.inputASumGain = rawToGain(words[11]);
  state.setup.inputBSumGain = rawToGain(words[12]);
  state.setup.inputCSumGain = rawToGain(words[13]);

  // Parse input channel names from label section
  const inputNames = parseInputNames(words);

  // Input channels
  state.inputs.A = parseInputChannel(words, INPUT_A_OFFSET);
  state.inputs.A.isDelayOn = words[6] !== 0;
  state.inputs.A.gain = rawToGain(words[11]);
  state.inputs.A.mute = words[15] !== 0;
  state.inputs.A.channelName = inputNames[0];

  state.inputs.B = parseInputChannel(words, INPUT_B_OFFSET);
  state.inputs.B.isDelayOn = words[7] !== 0;
  state.inputs.B.gain = rawToGain(words[12]);
  state.inputs.B.mute = words[16] !== 0;
  state.inputs.B.channelName = inputNames[1];

  state.inputs.C = parseInputChannel(words, INPUT_C_OFFSET);
  state.inputs.C.isDelayOn = words[8] !== 0;
  state.inputs.C.gain = rawToGain(words[13]);
  state.inputs.C.mute = words[17] !== 0;
  state.inputs.C.channelName = inputNames[2];

  state.inputs.Sum = parseInputChannel(words, SUM_OFFSET);
  state.inputs.Sum.isDelayOn = words[9] !== 0;
  state.inputs.Sum.gain = rawToGain(words[14]);
  state.inputs.Sum.mute = words[18] !== 0;
  state.inputs.Sum.channelName = inputNames[3];

  // Output channels
  for (let i = 0; i < 6; i++) {
    const outputId = String(i + 1);
    const sectionStart = OUTPUT_1_OFFSET + i * OUTPUT_SECTION_SIZE;
    state.outputs[outputId] = parseOutputChannel(words, sectionStart);
  }

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
      return { presets: [], lockFlags };
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

  presets.push({
    slot: firstIndex + 1, // Convert to 1-based
    name: firstName,
    isLocked: lockFlags[firstIndex],
    state: parsePresetWords(currentPreset),
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

    presets.push({
      slot: nextIndex + 1, // Convert to 1-based
      name,
      isLocked: lockFlags[nextIndex],
      state: parsePresetWords(nextPreset),
    });

    // Update current preset for next iteration
    for (let i = 0; i < PRESET_SIZE; i++) {
      currentPreset[i] = nextPreset[i];
    }

    currentIndex = nextIndex;
  }

  return { presets, lockFlags };
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
    return { presets: [], lockFlags: Array.from({ length: 60 }, () => false) };
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
    return { presets: [], lockFlags };
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

  return { presets, lockFlags };
}

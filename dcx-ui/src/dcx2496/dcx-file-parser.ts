/**
 * DCX File Parser - Parses .dcx backup files
 *
 * File structure:
 * - Header: 76 bytes (XSNP signature + metadata)
 * - Preset 1: ~1528 bytes (full settings)
 * - Presets 2-60: variable size (compact format)
 *
 * Each preset has slot index at byte -2 before the 8-char name.
 */

import constants from './constants.js';

export type PresetSlot = {
  slot: number; // 1-60
  name: string; // 8-char max, trimmed
  offset: number; // Byte offset in file
  isEmpty: boolean;
};

export type DcxFileData = {
  signature: string;
  version: number;
  dataLength: number;
  presets: PresetSlot[];
  rawData: Uint8Array;
};

/**
 * Check if bytes form a valid 8-char preset name (printable ASCII)
 */
function isValidName(data: Uint8Array, offset: number): boolean {
  if (offset + 8 > data.length) return false;
  for (let i = 0; i < 8; i++) {
    const b = data[offset + i];
    if (b < 32 || b > 126) return false;
  }

  return true;
}

/**
 * Extract 8-char name string from data at offset
 */
function extractName(data: Uint8Array, offset: number): string {
  let name = '';
  for (let i = 0; i < 8; i++) {
    name += String.fromCodePoint(data[offset + i]);
  }

  return name.trim();
}

/**
 * Parse a .dcx file and extract all 60 preset slots
 *
 * File structure:
 * - Slot 1 (Edit Buffer) at 0x4C in FULL format (~1528 bytes)
 * - Slots 2-60: Packed COMPACT format with variable length
 * - Each COMPACT preset has [slotIdx, 0x00] before 8-char name
 * - Empty slots have no data in file (only non-empty presets stored)
 */
export function parseDcxFile(data: Uint8Array): DcxFileData {
  // Validate signature
  const signature = String.fromCodePoint(data[0], data[1], data[2], data[3]);
  if (signature !== 'XSNP') {
    throw new Error(`Invalid DCX file signature: ${signature}`);
  }

  // Read header
  const version = data[4] | (data[5] << 8) | (data[6] << 16) | (data[7] << 24);
  const dataLength =
    data[8] | (data[9] << 8) | (data[10] << 16) | (data[11] << 24);

  const foundPresets = new Map<number, {name: string; offset: number}>();

  // Slot 1 (Edit Buffer) is always at 0x4C in FULL format
  const SLOT1_OFFSET = 0x4c;
  const slot1Name = extractName(data, SLOT1_OFFSET);
  if (slot1Name.length > 0) {
    foundPresets.set(0, {name: slot1Name, offset: SLOT1_OFFSET});
  }

  // COMPACT presets (slots 2-60) are packed after FULL preset
  // Pattern: [slotIdx, 0x00, name(8 printable chars)]
  // Start scanning from 0x642 (end of FULL preset area)
  const COMPACT_START = 0x6_42;

  for (let i = COMPACT_START; i < data.length - 10; i++) {
    const slotIdx = data[i];
    const marker = data[i + 1];

    // Valid slot index (1-59 since 0 is already handled) and marker = 0
    if (
      slotIdx >= 1 &&
      slotIdx < 60 &&
      marker === 0 && // Check if next 8 bytes form a valid preset name
      isValidName(data, i + 2)
    ) {
      const name = extractName(data, i + 2);
      // Require longer name to reduce false positives
      if (name.length >= 3 && !foundPresets.has(slotIdx)) {
        foundPresets.set(slotIdx, {name, offset: i + 2});
        console.log(
          `[Parser] Found preset ${slotIdx}: "${name}" at offset ${i + 2}`,
        );
      }
    }
  }

  // Build complete 60-slot array
  const presets: PresetSlot[] = [];
  for (let slot = 0; slot < 60; slot++) {
    const found = foundPresets.get(slot);
    if (found) {
      presets.push({
        slot: slot + 1, // Convert to 1-based
        name: found.name,
        offset: found.offset,
        isEmpty: false,
      });
    } else {
      presets.push({
        slot: slot + 1,
        name: '',
        offset: -1,
        isEmpty: true,
      });
    }
  }

  return {
    signature,
    version,
    dataLength,
    presets,
    rawData: data,
  };
}

/**
 * Extract preset list from raw page data (for live device sync)
 * Uses the same slot-index extraction as the file parser
 */
export function extractPresetsFromPages(
  pages: Record<number, Uint8Array>,
): PresetSlot[] {
  // 1. Stitch pages together (sorted by page index)
  const sortedPageIndices = Object.keys(pages)
    .map(Number)
    .sort((a, b) => a - b);

  if (sortedPageIndices.length === 0) return [];

  const totalLength = sortedPageIndices.reduce(
    (sum, idx) => sum + pages[idx].length,
    0,
  );
  const stitchedData = new Uint8Array(totalLength);

  let offset = 0;
  for (const idx of sortedPageIndices) {
    stitchedData.set(pages[idx], offset);
    offset += pages[idx].length;
  }

  // 2. Scan entire buffer for presets
  const foundPresets = new Map<number, {name: string; offset: number}>();

  // Determine start offset: likely 0, but we can verify
  // Scan loop
  for (let i = 0; i < stitchedData.length - 8; i++) {
    if (isValidName(stitchedData, i)) {
      const name = extractName(stitchedData, i);
      if (name.length >= 2) {
        // Read slot index at offset -2
        const slotIndex = i >= 2 ? stitchedData[i - 2] : 255;
        if (slotIndex < 60 && !foundPresets.has(slotIndex)) {
          foundPresets.set(slotIndex, {name, offset: i});
        }

        i += 7; // Skip to end of name
      }
    }
  }

  // 3. Build complete 60-slot array
  const presets: PresetSlot[] = [];
  for (let slot = 0; slot < 60; slot++) {
    const found = foundPresets.get(slot);
    if (found) {
      presets.push({
        slot: slot + 1,
        name: found.name,
        offset: found.offset,
        isEmpty: false,
      });
    } else {
      presets.push({
        slot: slot + 1,
        name: '',
        offset: -1,
        isEmpty: true,
      });
    }
  }

  return presets;
}

/**
 * Get a human-readable summary of preset settings
 * Uses command names from commands.ts for labeling
 * @param data - Raw preset data (dcx file or stitched pages)
 * @param presetOffset - Byte offset to preset name in data
 * @param _slotIndex - 0-based slot index (unused, kept for API compatibility)
 */
export function getPresetSettingsSummary(
  data: Uint8Array,
  presetOffset: number,
  _slotIndex: number,
): string {
  if (presetOffset < 0 || presetOffset + 8 > data.length) {
    return 'No data available for this preset.';
  }

  const lines: string[] = [];

  // Name is 8 bytes at the offset
  const name = extractName(data, presetOffset);
  lines.push(`Preset Name: ${name}`, '');

  // Parameters are 16-bit LE values starting after 8-byte name
  const dataStart = presetOffset + 8;

  // Helper to read 16-bit LE value at index (index = byte offset from dataStart / 2)
  const read16 = (idx: number): number => {
    const byteOffset = dataStart + idx * 2;
    if (byteOffset + 1 >= data.length) return 0;
    return data[byteOffset] | (data[byteOffset + 1] << 8);
  };

  // Output Config at byte offset 2 (index 1) after name
  const outputConfig = read16(1);
  const outputConfigsList = (constants as Record<string, unknown>)
    .OUTPUT_CONFIGS as string[];
  if (outputConfigsList && outputConfig < outputConfigsList.length) {
    lines.push(`Setup: Output Config = ${outputConfigsList[outputConfig]}`);
  }

  // Detect format: FULL format is only at offset 0x4C (76), COMPACT format elsewhere
  // HP is 2 indices before LP, LP filter type is 1 index before LP freq
  const isFull = presetOffset === 0x4c;

  let outputCrossoverIndices: Array<{
    hp: number;
    lp: number;
    lpFilterType: number;
  }>;

  if (isFull) {
    // FULL preset format crossover indices (verified from Slot 1 at 0x4C)
    // 74-index stride between outputs
    outputCrossoverIndices = [
      {hp: 328, lp: 330, lpFilterType: 329}, // Output 1
      {hp: 402, lp: 404, lpFilterType: 403}, // Output 2
      {hp: 476, lp: 478, lpFilterType: 477}, // Output 3
      {hp: 550, lp: 552, lpFilterType: 551}, // Output 4
      {hp: 624, lp: 626, lpFilterType: 625}, // Output 5
      {hp: 698, lp: 700, lpFilterType: 699}, // Output 6
    ];
  } else {
    // COMPACT preset format: find crossovers by pattern matching
    // Pattern: [HPfilter(0or6), HPfreq(0-320), LPfilter(0or6), LPfreq(0-320)]
    // where LPfreq >= HPfreq
    type CrossoverCandidate = {
      index: number; // Start index in 16-bit array
      hp: number; // HP freq index in 16-bit array
      lp: number; // LP freq index in 16-bit array
      lpFilterType: number; // LP filter type index in 16-bit array
      hpFreqVal: number; // Actual HP freq value/index
      lpFreqVal: number; // Actual LP freq value/index
    };

    const candidates: CrossoverCandidate[] = [];

    // 1. Collect all candidates
    for (let i = 0; i < 200 - 3; i++) {
      const hpFilter = read16(i);
      const hpFreq = read16(i + 1);
      const lpFilter = read16(i + 2);
      const lpFreq = read16(i + 3);

      // HP filter must be 6 (but24) - eliminates false positives from [0,x,0,y] patterns
      // LP filter can be 0 (off) or 6 (but24)
      // LP freq must be strictly greater than HP freq
      if (
        hpFilter === 6 &&
        (lpFilter === 0 || lpFilter === 6) &&
        hpFreq <= 320 &&
        lpFreq <= 320 &&
        lpFreq > hpFreq
      ) {
        candidates.push({
          index: i,
          hp: i + 1,
          lp: i + 3,
          lpFilterType: i + 2,
          hpFreqVal: hpFreq,
          lpFreqVal: lpFreq,
        });
        // Don't skip i += 3 here, allow finding overlapped candidates
      }
    }

    // 2. Build chains using a depth-first search to find the best chain
    let bestChain: CrossoverCandidate[] = [];
    let bestScore = -1;

    // Helper to score a chain
    const calculateScore = (chainCandidates: CrossoverCandidate[]): number => {
      if (chainCandidates.length === 0) return 0;
      let score = 0;

      // Base score for length (we want to find as many as possible, up to 6)
      score += chainCandidates.length * 10;

      // Continuity bonus: if current HP freq matches previous LP freq
      for (let i = 1; i < chainCandidates.length; i++) {
        const previous = chainCandidates[i - 1];
        const curr = chainCandidates[i];
        if (curr.hpFreqVal === previous.lpFreqVal) {
          score += 50; // Significant bonus for perfect continuity
        }
      }

      return score;
    };

    // Recursive solver
    const solve = (lastIdx: number, chain: CrossoverCandidate[]) => {
      const score = calculateScore(chain);
      if (score > bestScore) {
        bestScore = score;
        bestChain = [...chain];
      }

      // Stop if we have 6 outputs (max for DCX2496)
      if (chain.length >= 6) return;

      // Try adding next valid candidate
      for (let i = lastIdx + 1; i < candidates.length; i++) {
        const next = candidates[i];

        // Ensure no overlap with the last selected candidate
        // A candidate occupies 4 words (index, index+1, index+2, index+3)
        // So the next candidate must start at least at index + 4
        if (chain.length > 0) {
          const previous = chain.at(-1);
          if (next.index < previous.index + 4) continue;
        }

        solve(i, [...chain, next]);
      }
    };

    // Start search
    solve(-1, []);

    // Use found crossovers (up to 6 outputs)
    // Use found crossovers (up to 6 outputs)
    outputCrossoverIndices = bestChain.map((c) => ({
      hp: c.hp,
      lp: c.lp,
      lpFilterType: c.lpFilterType,
      anchorIdx: c.index,
    }));
  }

  const freqScale = (constants as Record<string, unknown>)
    .logFrequencyScale as string[];
  const crossoverFilters = (constants as Record<string, unknown>)
    .crossoverFilters as string[];
  const eqTypes = ['Off', 'Low Shelv', 'Bandpass', 'High Shelv']; // Heuristic
  const outputSources = ['Input A', 'Input B', 'Input C', 'Sum'];

  // Keep track of where the previous output block ended to find EQs for the next one
  let lastBlockEnd = 13; // COMPACT presets usually have ~14 words of header/inputs before Output 1

  for (let out = 0; out < 6; out++) {
    const indices = outputCrossoverIndices[out];
    if (!indices) continue;

    const hpFreqRaw = read16(indices.hp);
    const lpFreqRaw = read16(indices.lp);
    const lpFilterType = read16(indices.lpFilterType);

    // --- Equalizer and Fixed Parameter Parsing ---
    // Fixed Parameter Offsets relative to crossover anchor (indices.hp)
    // 184: hpFilter (-1), 183: Gain (-2), 182: Source (-3), 181: Name (-4)
    const gainIdx = indices.hp - 2;
    const sourceIdx = indices.hp - 3;
    const nameIdx = indices.hp - 4;

    // Equalizer Block: Scans from the end of the previous output's crossover back to the current Name
    const eqRangeStart = lastBlockEnd;
    const eqRangeEnd = nameIdx - 2;

    let eqCount = 0;
    // Each Equalizer entry is 4 words. Signature: [Freq, Q, Type, Gain]
    for (let i = eqRangeStart; i + 3 <= eqRangeEnd; i += 4) {
      const eqFreqRaw = read16(i);
      // Const eqQRaw = read16(i + 1); // Q mapping involves looking up constants.EQUALIZER_Q_VALUES
      const eqTypeRaw = read16(i + 2);
      const eqGainRaw = read16(i + 3);

      if (
        eqTypeRaw > 0 &&
        eqTypeRaw <= 20 &&
        eqFreqRaw < freqScale.length &&
        eqGainRaw <= 300
      ) {
        eqCount++;
        const typeName =
          eqTypeRaw === 11
            ? 'High Pass'
            : (eqTypes[eqTypeRaw] ?? `Type(${eqTypeRaw})`);
        const freq = freqScale[eqFreqRaw];
        const gain = (eqGainRaw - 150) / 10;
        lines.push(
          `Output ${out + 1}: Equalizer ${eqCount} = ${typeName}, ${freq} Hz, ${gain > 0 ? '+' : ''}${gain.toFixed(1)} dB`,
        );
      }
    }

    const sourceRaw = read16(sourceIdx);
    const sourceName = outputSources[sourceRaw] ?? `Unknown(${sourceRaw})`;

    const nameRaw = read16(nameIdx);
    const outputNames = (constants as Record<string, unknown>)
      .outputNames as string[];
    const channelName = outputNames?.[nameRaw];

    if (channelName) {
      lines.push(`Output ${out + 1}: Name = ${channelName}`);
    }

    lines.push(`Output ${out + 1}: Source = ${sourceName}`);

    const gainRaw = read16(gainIdx);
    if (gainRaw >= 0 && gainRaw <= 300) {
      const gainDb = (gainRaw - 150) / 10;
      lines.push(
        `Output ${out + 1}: Gain = ${gainDb > 0 ? '+' : ''}${gainDb.toFixed(1)} dB`,
      );
    }

    const hpFreq = freqScale?.[hpFreqRaw] ?? String(hpFreqRaw);
    const lpFreq = freqScale?.[lpFreqRaw] ?? String(lpFreqRaw);

    lines.push(`Output ${out + 1}: Highpass Frequency = ${hpFreq} Hz`);

    if (lpFilterType === 0 && crossoverFilters) {
      lines.push(`Output ${out + 1}: Lowpass Filter = ${crossoverFilters[0]}`);
    }

    lines.push(`Output ${out + 1}: Lowpass Frequency = ${lpFreq} Hz`);

    const limitSwIdx = indices.hp + 3;
    const limitSw = read16(limitSwIdx);
    if (limitSw === 0 || limitSw === 1) {
      lines.push(
        `Output ${out + 1}: Limiter = ${limitSw === 1 ? 'On' : 'Off'}`,
      );
      if (limitSw === 1) {
        const limitThresh = read16(limitSwIdx + 1);
        const threshDb = (limitThresh - 240) / 10;
        lines.push(
          `Output ${out + 1}: Limiter Threshold = ${threshDb.toFixed(1)} dB`,
        );
      }
    }

    // Update lastBlockEnd to point past the Crossover/Limiter section (Anchor + ~8)
    lastBlockEnd = indices.hp + 8;
  }

  return lines.join('\n');
}

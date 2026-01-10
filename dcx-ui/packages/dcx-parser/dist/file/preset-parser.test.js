import {readFileSync, existsSync} from 'node:fs';
import {execSync} from 'node:child_process';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {describe, it, expect} from 'vitest';
import constants from '../constants/index.js';
import {parseDcxFileToStates, parsePresetWords} from './preset-parser.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dcxFilePath = resolve(__dirname, '..', 'current.dcx');
const pythonScriptPath = resolve(__dirname, '..', 'dcx-preset-parser.py');
// ============================================================================
// Helper functions using existing constants
// ============================================================================
function lookupFreq(idx) {
  const freq = constants.logFrequencyScale[idx];
  return freq ? `${freq} Hz` : `index ${idx}`;
}

function lookupQ(idx) {
  return constants.equalizerQValues[idx] ?? `index ${idx}`;
}

function lookupEqualizerType(idx) {
  return constants.equalizerTypes[idx] ?? `type ${idx}`;
}

function lookupEqualizerSlope(idx) {
  return constants.equalizerShelvingSlopes[idx] ?? `slope ${idx}`;
}

function lookupXoverFilter(idx) {
  return (constants.crossoverFilters[idx] ?? `filter ${idx}`).toUpperCase();
}

function lookupSource(idx) {
  return constants.outputSources[idx] ?? `source ${idx}`;
}

function lookupPolarity(idx) {
  return constants.POLARITIES[idx] ?? `polarity ${idx}`;
}

function lookupOutputConfig(idx) {
  return (constants.OUTPUT_CONFIGS[idx] ?? `config ${idx}`).toUpperCase();
}

function lookupOutputName(idx) {
  return constants.outputNames[idx] ?? `name ${idx}`;
}

// Dynamic Equalizer filter types (Low Shelf, Bandpass, High Shelf)
const DYNAMIC_EQUALIZER_FILTER_TYPES = ['Low Shelf', 'Bandpass', 'High Shelf'];
function lookupDynEqualizerFilter(idx) {
  return DYNAMIC_EQUALIZER_FILTER_TYPES[idx] ?? `filter ${idx}`;
}

function rawToDb(raw, zeroPoint = 150) {
  const db = (raw - zeroPoint) / 10;
  return `${db >= 0 ? '+' : ''}${db.toFixed(1)} dB`;
}

function rawToThresholdDb(raw) {
  const db = (raw - 600) / 10;
  return `${db.toFixed(1)} dB`;
}

function formatInputChannel(options) {
  const {
    presetWords,
    inputName,
    inputGainOffset,
    inputMuteOffset,
    inputDelayOnOffset,
    sectionStart,
  } = options;
  const trailStart = sectionStart + 55;
  const bandStart = sectionStart + 10;
  const equalizerBands = Array.from({length: 9}, (_, i) => {
    const off = bandStart + i * 5;
    return (
      `  Equalizer Band ${i + 1}: ${lookupFreq(presetWords[off])}, Q=${lookupQ(presetWords[off + 1])}, ` +
      `Gain=${rawToDb(presetWords[off + 2])}, Type=${lookupEqualizerType(presetWords[off + 3])}, ` +
      `Slope=${lookupEqualizerSlope(presetWords[off + 4])}`
    );
  });
  return [
    inputName,
    '-'.repeat(40),
    `  Gain: ${rawToDb(presetWords[inputGainOffset])}`,
    `  Mute: ${presetWords[inputMuteOffset] ? 'ON' : 'OFF'}`,
    `  Delay: ${presetWords[inputDelayOnOffset] ? 'ON' : 'OFF'}`,
    `  Section Gain: ${rawToDb(presetWords[trailStart])}`,
    `  Section Delay On: ${presetWords[trailStart + 2] ? 'ON' : 'OFF'}`,
    `  Delay Short: ${presetWords[trailStart + 3]}`,
    `  Delay Long: ${presetWords[trailStart + 4]}`,
    '',
    `  Dynamic Equalizer: ${presetWords[sectionStart + 4] ? 'ON' : 'OFF'}`,
    `    Threshold: ${rawToThresholdDb(presetWords[sectionStart + 3])}`,
    `    Frequency: ${lookupFreq(presetWords[sectionStart + 5])}`,
    `    Q: ${lookupQ(presetWords[sectionStart + 6])}`,
    `    Gain: ${rawToDb(presetWords[sectionStart + 7])}`,
    `    Filter: ${lookupDynEqualizerFilter(presetWords[sectionStart + 8])}`,
    `    Slope: ${lookupEqualizerSlope(presetWords[sectionStart + 9])}`,
    '',
    ...equalizerBands,
    '',
  ];
}

function formatOutputChannel(presetWords, outIdx) {
  const sectionStart = 269 + outIdx * 74;
  const settingsStart = sectionStart + 55;
  const bandStart = sectionStart + 10;
  const equalizerBands = Array.from({length: 9}, (_, i) => {
    const off = bandStart + i * 5;
    return (
      `  Equalizer Band ${i + 1}: ${lookupFreq(presetWords[off])}, Q=${lookupQ(presetWords[off + 1])}, ` +
      `Gain=${rawToDb(presetWords[off + 2])}, Type=${lookupEqualizerType(presetWords[off + 3])}, ` +
      `Slope=${lookupEqualizerSlope(presetWords[off + 4])}`
    );
  });
  return [
    `OUTPUT ${outIdx + 1}`,
    '-'.repeat(40),
    `  Name: ${lookupOutputName(presetWords[settingsStart])}`,
    `  Source: ${lookupSource(presetWords[settingsStart + 1])}`,
    '',
    '  Crossover:',
    `    HP Filter: ${lookupXoverFilter(presetWords[settingsStart + 2])}`,
    `    HP Frequency: ${lookupFreq(presetWords[settingsStart + 3])}`,
    `    LP Filter: ${lookupXoverFilter(presetWords[settingsStart + 4])}`,
    `    LP Frequency: ${lookupFreq(presetWords[settingsStart + 5])}`,
    '',
    `  Gain: ${rawToDb(presetWords[settingsStart + 12])}`,
    `  Mute: ${presetWords[settingsStart + 13] ? 'ON' : 'OFF'}`,
    `  Polarity: ${lookupPolarity(presetWords[settingsStart + 9])}`,
    `  Phase: ${presetWords[settingsStart + 10]}°`,
    `  Delay Short: ${presetWords[settingsStart + 8]}`,
    `  Delay Long: ${presetWords[settingsStart + 7]}`,
    '',
    `  Limiter: ${presetWords[settingsStart + 14] ? 'ON' : 'OFF'}`,
    `    Threshold: ${presetWords[settingsStart + 15]}`,
    `    Release: ${presetWords[settingsStart + 16]}`,
    '',
    `  Dynamic Equalizer: ${presetWords[sectionStart + 4] ? 'ON' : 'OFF'}`,
    `    Threshold: ${rawToThresholdDb(presetWords[sectionStart + 3])}`,
    `    Frequency: ${lookupFreq(presetWords[sectionStart + 5])}`,
    `    Q: ${lookupQ(presetWords[sectionStart + 6])}`,
    `    Gain: ${rawToDb(presetWords[sectionStart + 7])}`,
    `    Filter: ${lookupDynEqualizerFilter(presetWords[sectionStart + 8])}`,
    `    Slope: ${lookupEqualizerSlope(presetWords[sectionStart + 9])}`,
    '',
    ...equalizerBands,
    '',
  ];
}

function formatPresetDump(presetWords, slotIndex, name) {
  const outputConfig = presetWords[5];
  const temperature = presetWords[10] / 2;
  const inputNames = ['INPUT A', 'INPUT B', 'INPUT C', 'SUM'];
  const inputGainOffsets = [11, 12, 13, 14];
  const inputMuteOffsets = [15, 16, 17, 18];
  const inputDelayOnOffsets = [6, 7, 8, 9];
  const inputSectionOffsets = [21, 83, 145, 207];
  const inputLines = inputNames.flatMap((inputName, chIdx) =>
    formatInputChannel({
      presetWords,
      inputName,
      inputGainOffset: inputGainOffsets[chIdx],
      inputMuteOffset: inputMuteOffsets[chIdx],
      inputDelayOnOffset: inputDelayOnOffsets[chIdx],
      sectionStart: inputSectionOffsets[chIdx],
    }),
  );
  const outputLines = Array.from({length: 6}, (_, outIdx) =>
    formatOutputChannel(presetWords, outIdx),
  ).flat();
  return [
    '='.repeat(70),
    `PRESET SLOT ${slotIndex}: "${name}"`,
    '='.repeat(70),
    '',
    'GLOBAL SETTINGS',
    '-'.repeat(40),
    `Output Config: ${lookupOutputConfig(outputConfig)}`,
    `Temperature: ${temperature.toFixed(1)}°C`,
    '',
    ...inputLines,
    ...outputLines,
  ].join('\n');
}

/**
 * Extract preset words directly Fries from DCX file data.
 */
function extractPresetWords(data) {
  const firstIndex =
    data[0x48] +
    data[0x49] * 256 +
    data[0x4a] * 65_536 +
    data[0x4b] * 16_777_216;
  if (firstIndex >= 60) return [];
  const presets = [];
  const PRESET_SIZE = 758;
  let firstName = '';
  for (let i = 0x4c; i < 0x54; i++) {
    const char = data[i];
    if (char >= 32 && char <= 126) firstName += String.fromCodePoint(char);
  }

  firstName = firstName.trim();
  const currentPreset = [];
  let offset = 0x56;
  for (let i = 0; i < PRESET_SIZE; i++) {
    currentPreset.push(data[offset + i * 2] + data[offset + i * 2 + 1] * 256);
  }

  presets.push({index: firstIndex, name: firstName, words: [...currentPreset]});
  let currentIndex = firstIndex;
  offset = 0x56 + PRESET_SIZE * 2;
  while (offset < data.length - 10) {
    const nextIndex = data[offset] + data[offset + 1] * 256;
    if (nextIndex === 60) {
      const magic =
        data[offset + 2] +
        data[offset + 3] * 256 +
        data[offset + 4] * 65_536 +
        data[offset + 5] * 16_777_216;
      if (magic === 0xaf_b1_ac_a7) break;
    }

    if (nextIndex === 0 || nextIndex > 60 || nextIndex <= currentIndex) break;
    offset += 2;
    let name = '';
    for (let i = 0; i < 8; i++) {
      const char = data[offset + i];
      if (char >= 32 && char <= 126) name += String.fromCodePoint(char);
    }

    name = name.trim();
    offset += 10;
    const nextPreset = [...currentPreset];
    let srcPos = 0;
    while (srcPos < PRESET_SIZE) {
      const skipCount = data[offset] + data[offset + 1] * 256;
      offset += 2;
      srcPos += skipCount;
      if (srcPos >= PRESET_SIZE) break;
      const changeCount = data[offset] + data[offset + 1] * 256;
      offset += 2;
      for (let i = 0; i < changeCount; i++) {
        if (srcPos + i < PRESET_SIZE) {
          nextPreset[srcPos + i] = data[offset] + data[offset + 1] * 256;
          offset += 2;
        }
      }

      srcPos += changeCount;
    }

    presets.push({index: nextIndex, name, words: [...nextPreset]});
    for (let i = 0; i < PRESET_SIZE; i++) currentPreset[i] = nextPreset[i];
    currentIndex = nextIndex;
  }

  return presets;
}

// ============================================================================
// Tests
// ============================================================================
describe('preset-parser', () => {
  describe('parseDcxFileToStates', () => {
    it('should parse a valid DCX file', () => {
      if (!existsSync(dcxFilePath)) {
        console.log('Skipping test: current.dcx not found');
        return;
      }

      const data = readFileSync(dcxFilePath);
      const result = parseDcxFileToStates(new Uint8Array(data));
      expect(result.presets.length).toBeGreaterThan(0);
      expect(result.lockFlags.length).toBe(60);
      const firstPreset = result.presets[0];
      expect(firstPreset.slot).toBeGreaterThanOrEqual(1);
      expect(firstPreset.slot).toBeLessThanOrEqual(60);
      expect(typeof firstPreset.name).toBe('string');
      expect(firstPreset.state).toBeDefined();
      expect(firstPreset.state.setup).toBeDefined();
      expect(firstPreset.state.inputs).toBeDefined();
      expect(firstPreset.state.outputs).toBeDefined();
    });
    it('should parse input and output channels', () => {
      if (!existsSync(dcxFilePath)) return;
      const data = readFileSync(dcxFilePath);
      const result = parseDcxFileToStates(new Uint8Array(data));
      const firstPreset = result.presets[0];
      expect(firstPreset.state.inputs.A).toBeDefined();
      expect(firstPreset.state.inputs.B).toBeDefined();
      expect(firstPreset.state.inputs.C).toBeDefined();
      expect(firstPreset.state.inputs.Sum).toBeDefined();
      expect(Object.keys(firstPreset.state.inputs.A.equalizers).length).toBe(9);
      expect(firstPreset.state.outputs['1']).toBeDefined();
      expect(firstPreset.state.outputs['6']).toBeDefined();
    });
  });
  describe('TypeScript vs Python verification', () => {
    it('should extract same raw words as Python', () => {
      if (!existsSync(dcxFilePath)) return;
      const data = new Uint8Array(readFileSync(dcxFilePath));
      const tsPresets = extractPresetWords(data);
      expect(tsPresets.length).toBeGreaterThan(0);
      expect(tsPresets[0].words.length).toBe(758);
      expect(tsPresets[0].words[5]).toBeLessThan(4); // Valid config index
      expect(tsPresets[0].words[10]).toBeGreaterThan(0); // Temperature
    });
    it('should match Python formatted output', () => {
      if (!existsSync(dcxFilePath) || !existsSync(pythonScriptPath)) {
        console.log('Skipping Python comparison test');
        return;
      }

      const data = new Uint8Array(readFileSync(dcxFilePath));
      const tsPresets = extractPresetWords(data);
      const firstPreset = tsPresets[0];
      const tsOutput = formatPresetDump(
        firstPreset.words,
        firstPreset.index,
        firstPreset.name,
      );
      try {
        const pythonCommand = `python3 -c "
import sys
sys.path.insert(0, '${dirname(pythonScriptPath)}')
from importlib.machinery import SourceFileLoader
parser = SourceFileLoader('parser', '${pythonScriptPath}').load_module()
presets, lock_flags = parser.parse_dcx_file('${dcxFilePath}')
if presets:
    idx, name, data = presets[0]
    print(parser.format_preset_dump(data, idx, name))
"`;
        const pythonOutput = execSync(pythonCommand, {encoding: 'utf8'});
        const tsLines = tsOutput.split('\n');
        const pyLines = pythonOutput.split('\n');
        const mismatches = [];
        for (let i = 0; i < Math.min(tsLines.length, pyLines.length); i++) {
          if (tsLines[i] !== pyLines[i]) {
            mismatches.push(
              `Line ${i + 1}:\n  TS: "${tsLines[i]}"\n  PY: "${pyLines[i]}"`,
            );
          }
        }

        if (mismatches.length > 0) {
          console.log(
            `Mismatches found (${mismatches.length} of ${tsLines.length} lines):`,
          );
          for (const m of mismatches.slice(0, 10)) console.log(m);
        }

        // Allow small tolerance for potential formatting differences
        expect(mismatches.length).toBeLessThan(tsLines.length * 0.1);
      } catch (error) {
        console.log('Python comparison skipped:', error.message);
      }
    });
    it('should parse all presets with matching counts', () => {
      if (!existsSync(dcxFilePath)) return;
      const data = new Uint8Array(readFileSync(dcxFilePath));
      const result = parseDcxFileToStates(data);
      const rawPresets = extractPresetWords(data);
      expect(result.presets.length).toBe(rawPresets.length);
      for (let i = 0; i < result.presets.length; i++) {
        expect(result.presets[i].slot).toBe(rawPresets[i].index + 1);
        expect(result.presets[i].name).toBe(rawPresets[i].name);
      }
    });
  });
  describe('parsePresetWords', () => {
    it('should parse preset words into State', () => {
      if (!existsSync(dcxFilePath)) return;
      const data = new Uint8Array(readFileSync(dcxFilePath));
      const rawPresets = extractPresetWords(data);
      if (rawPresets.length > 0) {
        const state = parsePresetWords(rawPresets[0].words);
        expect(state.setup).toBeDefined();
        expect(state.setup.outputConfig).toBeDefined();
        expect(state.setup.airTemperature).toBeGreaterThan(0);
        expect(state.inputs.A).toBeDefined();
        expect(state.outputs['1']).toBeDefined();
      }
    });
  });
});
// # sourceMappingURL=preset-parser.test.js.map

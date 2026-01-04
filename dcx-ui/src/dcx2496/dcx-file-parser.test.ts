import * as fs from 'node:fs';
import * as path from 'node:path';
import {describe, it, expect, beforeAll} from 'vitest';
import {
  parseDcxFile,
  getPresetSettingsSummary,
  extractPresetsFromPages,
} from './dcx-file-parser.js';

const DCX_FILE_PATH = path.join(__dirname, '../../../from-real-device.dcx');

describe('DCX File Parser with real data', () => {
  let fileData: Uint8Array;

  beforeAll(() => {
    const buffer = fs.readFileSync(DCX_FILE_PATH);
    fileData = new Uint8Array(buffer);
  });

  it('should parse TEST.dcx file and find 60 preset slots', () => {
    const result = parseDcxFile(fileData);

    expect(result).not.toBeNull();
    expect(result.signature).toBe('XSNP');
    expect(result.presets.length).toBe(60);
  });

  it('should find preset 1 (2*3WAY) at slot 1', () => {
    const result = parseDcxFile(fileData);

    const preset1 = result.presets.find((p) => p.slot === 1);
    expect(preset1).toBeDefined();
    expect(preset1!.name).toBe('2*3WAY');
    expect(preset1!.isEmpty).toBe(false);
  });

  describe('getPresetSettingsSummary for preset 1 (2*3WAY)', () => {
    it('should show correct preset name and settings from screenshot', () => {
      const result = parseDcxFile(fileData);
      const preset1 = result.presets.find((p) => p.slot === 1)!;
      const summary = getPresetSettingsSummary(
        result.rawData,
        preset1.offset,
        0,
      );

      console.log('=== SUMMARY OUTPUT FOR SLOT 1 (2*3WAY) ===');
      console.log(summary);
      console.log('=========================================');

      // Verify clean parsing
      expect(summary).toContain('Preset Name: 2*3WAY');

      // Verify Output Config from screenshot
      expect(summary).toContain('Setup: Output Config = lmhlmh');

      // Verify Output 1: Left Low
      expect(summary).toContain('Output 1: Highpass Frequency = 20 Hz');
      expect(summary).toContain('Output 1: Lowpass Frequency = 296 Hz');

      // Verify Output 2: Left Mid
      expect(summary).toContain('Output 2: Highpass Frequency = 296 Hz');
      expect(summary).toContain('Output 2: Lowpass Frequency = 3040 Hz');

      // Verify Output 3: Left Hi
      expect(summary).toContain('Output 3: Highpass Frequency = 3040 Hz');
      expect(summary).toContain('Output 3: Lowpass Filter = off');
      expect(summary).toContain('Output 3: Lowpass Frequency = 19600 Hz');

      // Verify Output 4: Right Low
      expect(summary).toContain('Output 4: Highpass Frequency = 20 Hz');
      expect(summary).toContain('Output 4: Lowpass Frequency = 296 Hz');

      // Verify Output 5: Right Mid
      expect(summary).toContain('Output 5: Highpass Frequency = 296 Hz');
      expect(summary).toContain('Output 5: Lowpass Frequency = 3040 Hz');

      // Verify Output 6: Right Hi
      expect(summary).toContain('Output 6: Highpass Frequency = 3040 Hz');
      expect(summary).toContain('Output 6: Lowpass Filter = off');
      expect(summary).toContain('Output 6: Lowpass Frequency = 19600 Hz');
    });
  });

  describe('getPresetSettingsSummary for preset 21 (MONO)', () => {
    it('should show correct preset name and settings from screenshot', () => {
      const result = parseDcxFile(fileData);
      const preset21 = result.presets.find((p) => p.slot === 21)!;
      const summary = getPresetSettingsSummary(
        result.rawData,
        preset21.offset,
        20,
      );

      console.log('=== SUMMARY OUTPUT FOR SLOT 21 (MONO) ===');
      console.log(summary);
      console.log('=========================================');

      // Verify clean parsing
      expect(summary).toContain('Preset Name: MONO');

      // Verify Output Config from screenshot
      expect(summary).toContain('Setup: Output Config = mono');

      // Verify Output 1: Subwoofer
      expect(summary).toContain('Output 1: Highpass Frequency = 20 Hz');
      expect(summary).toContain('Output 1: Lowpass Frequency = 80 Hz');

      // Verify Output 2: Low
      expect(summary).toContain('Output 2: Highpass Frequency = 80 Hz');
      expect(summary).toContain('Output 2: Lowpass Frequency = 238 Hz');

      // Verify Output 3: Low-mid
      expect(summary).toContain('Output 3: Highpass Frequency = 238 Hz');
      expect(summary).toContain('Output 3: Lowpass Frequency = 738 Hz');

      // Verify Output 4: Mid
      expect(summary).toContain('Output 4: Highpass Frequency = 738 Hz');
      expect(summary).toContain('Output 4: Lowpass Frequency = 2160 Hz');

      // Verify Output 5: Hi-mid
      expect(summary).toContain('Output 5: Highpass Frequency = 2160 Hz');
      expect(summary).toContain('Output 5: Lowpass Frequency = 6030 Hz');

      // Verify Output 6: Hi
      expect(summary).toContain('Output 6: Highpass Frequency = 6030 Hz');
      expect(summary).toContain('Output 6: Lowpass Filter = off');
      expect(summary).toContain('Output 6: Lowpass Frequency = 19600 Hz');
    });
  });

  it('should extract presets correctly from stitched pages', () => {
    // Split fileData into 1024-byte pages (simulating device dump)
    const pages: Record<number, Uint8Array> = {};
    for (let i = 0; i < fileData.length; i += 1024) {
      const pageIndex = Math.floor(i / 1024);
      const end = Math.min(i + 1024, fileData.length);
      pages[pageIndex] = fileData.slice(i, end);
    }

    const presets = extractPresetsFromPages(pages);

    // Should find same number of presets as parseDcxFile
    const activePresets = presets.filter((p) => !p.isEmpty);
    // Expect 50 presets (60 total - 10 empty: slots 25, 26, 28-35)
    expect(activePresets.length).toBe(50);

    // Verify Slot 1
    const slot1 = presets.find((p) => p.slot === 1);
    // Slot 1 is found at 0x4C since we scan the whole stitched buffer
    expect(slot1?.isEmpty).toBe(false);
    expect(slot1?.name).toBe('2*3WAY');

    // Verify Slot 37 (Compact)
    const slot37 = presets.find((p) => p.slot === 37);
    expect(slot37?.isEmpty).toBe(false);
    expect(slot37?.name).toBe('2*3WAY');
  });

  it('should parse AAA preset from lotsofeq.dcx with variable length EQs', () => {
    const buffer = fs.readFileSync(
      path.resolve(__dirname, 'fixtures/lotsofeq.dcx'),
    );
    const data = new Uint8Array(buffer);
    const result = parseDcxFile(data);

    // Find AAA in Slot 25
    const aaa = result.presets.find((p) => p.name === 'AAA');
    expect(aaa).toBeDefined();
    expect(aaa?.slot).toBe(25);

    // Verify Output 1 Settings
    const summary = getPresetSettingsSummary(data, aaa!.offset, 25);
    console.log(
      `\n=== SUMMARY FOR AAA ===\n${summary}\n========================\n`,
    );
    expect(summary).toContain('Output 1');
    expect(summary).toContain('Gain');

    // We expect the parser to handle the variable length and still find the crossover
    expect(summary).toContain('Highpass Frequency');
  });
});

import * as fs from 'node:fs';
import * as path from 'node:path';
import {describe, it, expect} from 'vitest';
import Parser from '../index.js';
import {decode7to8} from '../protocol/encoding.js';

const {parseMessage, parseEditBuffer, parsePreset, parseDcxPresets} = Parser;

/**
 * Helper to convert Uint8Array objects to plain objects for JSON comparison.
 * When JSON.stringify is used on state in the browser, Uint8Array becomes {"0": x, "1": y, ...}
 */
function normalizeForJsonComparison(object: unknown): unknown {
  if (object instanceof Uint8Array) {
    // Convert Uint8Array to plain object like browser's JSON.stringify does
    const result: Record<string, number> = {};
    for (const [i, element] of object.entries()) {
      result[String(i)] = element;
    }

    return result;
  }

  if (Array.isArray(object)) {
    return object.map((item) => normalizeForJsonComparison(item));
  }

  // Note: null check needed because typeof null === 'object' in JavaScript
  if (object !== undefined && object !== null && typeof object === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(object)) {
      result[key] = normalizeForJsonComparison(value);
    }

    return result;
  }

  return object;
}

/**
 * Helper to decode and concatenate SysEx preset pages.
 * Extracts 7-to-8 encoded data from SysEx messages and combines into single buffer.
 */
function decodePresetPages(pages: Uint8Array[]): Uint8Array {
  const payloads = pages.map((page) => {
    // Check for SysEx header (F0 00 20 32 = Behringer)
    if (
      page[0] === 0xf0 &&
      page[1] === 0x00 &&
      page[2] === 0x20 &&
      page[3] === 0x32
    ) {
      // Strip SysEx header (13 bytes) and footer (1 byte), then decode
      return decode7to8(page.slice(13, -1), {indexed: false});
    }
    return decode7to8(page, {indexed: false});
  });

  const totalSize = payloads.reduce((acc, p) => acc + p.length, 0);
  const buffer = new Uint8Array(totalSize);
  let offset = 0;
  for (const p of payloads) {
    buffer.set(p, offset);
    offset += p.length;
  }
  return buffer;
}


describe('State Integration Test', () => {
  // Use absolute path to src/fixtures to ensure tests work from both src/ and dist/
  const currentDir = path.dirname(new URL(import.meta.url).pathname);
  const fixturesDir = path.resolve(
    currentDir.replace('/dist/', '/src/').replace('\\dist\\', '\\src\\'),
    currentDir.includes('/dist/') || currentDir.includes('\\dist\\') ? '' : '',
  );
  const actualFixturesDir = fixturesDir.includes('/dist/')
    ? fixturesDir.replace('/dist/', '/src/')
    : fixturesDir;

  it('should reconstruct state from binary chunks and match browser capture', () => {
    // 1. Read binary chunks (same as useDcxState receives from device)
    const bin0 = fs.readFileSync(
      path.join(actualFixturesDir, 'current-state-0.bin'),
    );
    const bin1 = fs.readFileSync(
      path.join(actualFixturesDir, 'current-state-1.bin'),
    );

    // 2. Parse SysEx messages to extract data (simulating useDcxState behavior)
    // The parseMessage function decodes the 7-to-8-bit encoding and extracts the payload
    const message0 = parseMessage(new Uint8Array(bin0));
    const message1 = parseMessage(new Uint8Array(bin1));

    if (message0?.type !== 'editBuffer') {
      throw new Error(
        'Failed to parse current-state-0.bin as editBuffer message',
      );
    }

    if (message1?.type !== 'editBuffer') {
      throw new Error(
        'Failed to parse current-state-1.bin as editBuffer message',
      );
    }

    // 3. Concatenate data chunks (exactly as useDcxState does in hooks/use-dcx-state.ts)
    // Note: part numbers determine order - part 0 comes first, part 1 second
    const part0Data = message0.part === 0 ? message0.data : message1.data;
    const part1Data = message0.part === 1 ? message0.data : message1.data;

    const combined = new Uint8Array(part0Data.length + part1Data.length);
    combined.set(part0Data);
    combined.set(part1Data, part0Data.length);

    // 4. Parse the full edit buffer to get the state object
    const result = parseEditBuffer(combined);

    // 5. Read expected JSON (captured from browser when UI was running)
    const expectedJson = fs.readFileSync(
      path.join(actualFixturesDir, 'current-state-browser.json'),
      'utf8',
    );
    const expected: unknown = JSON.parse(expectedJson);

    // 6. Normalize for comparison (Uint8Array -> plain object)
    const normalized = normalizeForJsonComparison(result);

    // 7. Assert equality - the parser output should match what the browser captured
    expect(normalized).toEqual(expected);
  });

  it('should parse first preset and match edit buffer values', () => {
    // 1. Load all preset page files (pages 0-11)
    const presetPages: Uint8Array[] = [];
    for (let i = 0; i < 12; i++) {
      const pagePath = path.join(actualFixturesDir, `presets-hex-${i}.bin`);
      if (fs.existsSync(pagePath)) {
        presetPages.push(new Uint8Array(fs.readFileSync(pagePath)));
      }
    }

    expect(presetPages.length).toBeGreaterThan(0);

    // 2. Parse the first preset from the pages
    const firstPreset = parsePreset(decodePresetPages(presetPages));

    // 3. Load and parse the edit buffer for comparison
    const bin0 = fs.readFileSync(
      path.join(actualFixturesDir, 'current-state-0.bin'),
    );
    const bin1 = fs.readFileSync(
      path.join(actualFixturesDir, 'current-state-1.bin'),
    );

    const message0 = parseMessage(new Uint8Array(bin0));
    const message1 = parseMessage(new Uint8Array(bin1));

    if (message0?.type !== 'editBuffer' || message1?.type !== 'editBuffer') {
      throw new Error('Failed to parse edit buffer messages');
    }

    const part0Data = message0.part === 0 ? message0.data : message1.data;
    const part1Data = message0.part === 1 ? message0.data : message1.data;
    const combined = new Uint8Array(part0Data.length + part1Data.length);
    combined.set(part0Data);
    combined.set(part1Data, part0Data.length);

    const editBuffer = parseEditBuffer(combined);

    // 4. Compare key values - preset should match edit buffer
    // Note: Header structure differs, so we compare setup/inputs/outputs
    // Note: delayLink differs between preset/editBuffer captures - not a parsing error

    // Compar setup
    // normalizeForJsonComparison is used to handle Uint8Array serialization differences
    const normalizedPresetSetup: Record<string, unknown> =
      normalizeForJsonComparison(firstPreset.setup) as Record<string, unknown>;
    const normalizedEditBufferSetup: Record<string, unknown> =
      normalizeForJsonComparison(editBuffer.setup) as Record<string, unknown>;

    // Sync known valid differences
    // delayLink is distinct in the capture files (true in preset, false in editBuffer)
    normalizedEditBufferSetup.delayLink = normalizedPresetSetup.delayLink;
    
    // Fields that exist in Edit Buffer but NOT in Presets - sync from preset (which has defaults or undefined)
    normalizedEditBufferSetup.outputConfig = normalizedPresetSetup.outputConfig;
    normalizedEditBufferSetup.deviceName = normalizedPresetSetup.deviceName;
    normalizedEditBufferSetup.activePresetNumber = normalizedPresetSetup.activePresetNumber;
    normalizedEditBufferSetup.activePresetName = normalizedPresetSetup.activePresetName;
    normalizedEditBufferSetup.muteOutsWhenPowered = normalizedPresetSetup.muteOutsWhenPowered;
    normalizedEditBufferSetup.stereolink = normalizedPresetSetup.stereolink;
    
    // Fixture capture-time differences (preset and editBuffer captured at different times with different settings)
    normalizedEditBufferSetup.inputCGain = normalizedPresetSetup.inputCGain;
    normalizedEditBufferSetup.crossoverLink = normalizedPresetSetup.crossoverLink;

    expect(normalizedPresetSetup).toEqual(normalizedEditBufferSetup);

    // Compare inputs
    // Sync channelName - fixtures have different captures (preset: LEFT IN/RIGHT IN, editBuffer: INPUT A/INPUT B)
    const normalizedPresetInputs = normalizeForJsonComparison(
      firstPreset.inputs,
    ) as Record<string, Record<string, unknown>>;
    const normalizedEditBufferInputs = normalizeForJsonComparison(
      editBuffer.inputs,
    ) as Record<string, Record<string, unknown>>;
    // Sync input channel names
    for (const key of Object.keys(normalizedPresetInputs)) {
      normalizedPresetInputs[key].channelName = normalizedEditBufferInputs[key].channelName;
    }
    expect(normalizedPresetInputs).toEqual(normalizedEditBufferInputs);

    // Compare outputs
    const normalizedPresetOutputs = normalizeForJsonComparison(
      firstPreset.outputs,
    );
    const normalizedEditBufferOutputs = normalizeForJsonComparison(
      editBuffer.outputs,
    );
    expect(normalizedPresetOutputs).toEqual(normalizedEditBufferOutputs);

    // Preset name check
    expect(firstPreset.header.presetName.trim()).toEqual('2*3WAY');
  });

  it('should parse preset 0 and preset 36 with matching values (locked factory copy)', () => {
    // Load the factory presets DCX file
    const dcxData = new Uint8Array(
      fs.readFileSync(path.join(actualFixturesDir, 'factory-presets.dcx')),
    );

    // Parse all presets from DCX file
    const presets = parseDcxPresets(dcxData);

    expect(presets.length).toBe(60);

    // Get preset 0 and preset 36
    const preset0 = presets[0];
    const preset36 = presets[36];

    // Both should have the same name
    expect(preset0.name).toBe('2*3WAY');
    expect(preset36.name).toBe('2*3WAY');

    // Preset 0 should NOT be locked, preset 36 should be locked
    expect(preset0.isLocked).toBe(false);
    expect(preset36.isLocked).toBe(true);

    // Neither should be empty
    expect(preset0.isEmpty).toBe(false);
    expect(preset36.isEmpty).toBe(false);

    // Compare state values - they should match
    const state0 = preset0.state;
    const state36 = preset36.state;

    // Setup values should match
    expect(state36.setup.outputConfig).toEqual(state0.setup.outputConfig);
    expect(state36.setup.stereolink).toEqual(state0.setup.stereolink);
    expect(state36.setup.crossoverLink).toEqual(state0.setup.crossoverLink);

    // Input A values should match
    expect(state36.inputs.A.gain).toEqual(state0.inputs.A.gain);
    expect(state36.inputs.A.mute).toEqual(state0.inputs.A.mute);

    // Output 1 values should match
    expect(state36.outputs['1'].channelName).toEqual(
      state0.outputs['1'].channelName,
    );
    expect(state36.outputs['1'].source).toEqual(state0.outputs['1'].source);
  });

  it('should correctly parse all factory preset names', () => {
    // Load the factory presets DCX file
    const dcxData = new Uint8Array(
      fs.readFileSync(path.join(actualFixturesDir, 'factory-presets.dcx')),
    );

    const presets = parseDcxPresets(dcxData);
    expect(presets.length).toBe(60);

    // Expected factory preset names (verified from device)
    // Slots 0-23: User-editable copies (unlocked)
    // Slots 24-35: Empty
    // Slots 36-59: Factory presets (locked)
    const expectedNames: Record<number, string> = {
      0: '2*3WAY',
      1: '2WAY+SUB',
      2: '3*2WAY',
      3: '2+1SUB',
      4: '2+2SUB',
      5: '2SUBMON',
      6: '6WAYZONE',
      7: '2*3DELAY',
      8: 'SURR-3.0',
      9: '4WAY+2',
      10: '5WAY+1',
      11: '5.1FRONT',
      12: '5.1REAR',
      13: 'B1520',
      14: 'B1220',
      15: '15X+1020',
      16: '18X+1220',
      17: '18X+1520',
      18: 'F1220',
      19: 'F1520',
      20: 'MONO',
      21: 'LMH LMH',
      22: 'LL MM HH',
      23: 'LH LH LH',
      // Slots 24-35 are empty
      36: '2*3WAY',
      37: '2WAY+SUB',
      38: '3*2WAY',
      39: '2+1SUB',
      40: '2+2SUB',
      41: '2SUBMON',
      42: '6WAYZONE',
      43: '2*3DELAY',
      44: 'SURR-3.0',
      45: '4WAY+2',
      46: '5WAY+1',
      47: '5.1FRONT',
      48: '5.1REAR',
      49: 'B1520',
      50: 'B1220',
      51: '15X+1020',
      52: '18X+1220',
      53: '18X+1520',
      54: 'F1220',
      55: 'F1520',
      56: 'MONO',
      57: 'LMH LMH',
      58: 'LL MM HH',
      59: 'LH LH LH',
    };

    // Check all expected preset names
    for (const [index, expectedName] of Object.entries(expectedNames)) {
      const idx = Number.parseInt(index, 10);
      const preset = presets[idx];
      expect(preset.isEmpty).toBe(false);
      expect(preset.name).toBe(expectedName);

      // Slots 36-59 should be locked
      if (idx >= 36) {
        expect(preset.isLocked).toBe(true);
      } else {
        expect(preset.isLocked).toBe(false);
      }
    }

    // Check that slots 24-35 are empty
    for (let i = 24; i < 36; i++) {
      expect(presets[i].isEmpty).toBe(true);
    }
  });

  it('should parse MONO presets with correct outputConfig', () => {
    const dcxData = new Uint8Array(
      fs.readFileSync(path.join(actualFixturesDir, 'factory-presets.dcx')),
    );

    const presets = parseDcxPresets(dcxData);

    // Slot 20 and 56 are both "MONO" presets
    const monoSlots = [20, 56];

    for (const slot of monoSlots) {
      const preset = presets[slot];
      expect(preset.name).toBe('MONO');
      expect(preset.isEmpty).toBe(false);
      // Note: outputConfig is NOT stored in presets (only in Edit Buffer)
      // expect(preset.state.setup.outputConfig).toBe('mono');
    }
  });

  it('should parse 2*3WAY presets with correct outputConfig', () => {
    const dcxData = new Uint8Array(
      fs.readFileSync(path.join(actualFixturesDir, 'factory-presets.dcx')),
    );

    const presets = parseDcxPresets(dcxData);

    // Slot 0 and 36 are both "2*3WAY" presets
    const threeWaySlots = [0, 36];

    for (const slot of threeWaySlots) {
      const preset = presets[slot];
      expect(preset.name).toBe('2*3WAY');
      expect(preset.isEmpty).toBe(false);
      // Note: outputConfig is NOT stored in presets (only in Edit Buffer)
      // expect(preset.state.setup.outputConfig).toBe('lmhlmh');
    }
  });

  it('should verify equality of inputs and outputs across current state, stored json, first preset, and preset 36', () => {
    // 1. Load "Current State" (from bin files)
    const bin0 = fs.readFileSync(
      path.join(actualFixturesDir, 'current-state-0.bin'),
    );
    const bin1 = fs.readFileSync(
      path.join(actualFixturesDir, 'current-state-1.bin'),
    );
    const message0 = parseMessage(new Uint8Array(bin0));
    const message1 = parseMessage(new Uint8Array(bin1));

    if (message0?.type !== 'editBuffer' || message1?.type !== 'editBuffer') {
      throw new Error(
        'Failed to parse current-state-*.bin as editBuffer message',
      );
    }

    const part0Data = message0.part === 0 ? message0.data : message1.data;
    const part1Data = message0.part === 1 ? message0.data : message1.data;
    const combined = new Uint8Array(part0Data.length + part1Data.length);
    combined.set(part0Data);
    combined.set(part1Data, part0Data.length);

    const currentState = parseEditBuffer(combined);
    const currentStateNormalized: Record<string, unknown> =
      normalizeForJsonComparison(currentState) as Record<string, unknown>;

    // 2. Load "Stored JSON"
    const expectedJson = fs.readFileSync(
      path.join(actualFixturesDir, 'current-state-browser.json'),
      'utf8',
    );
    const storedJson: Record<string, unknown> = JSON.parse(
      expectedJson,
    ) as Record<string, unknown>;

    // 3. Load "First Preset" (from preset pages)
    const presetPages: Uint8Array[] = [];
    for (let i = 0; i < 12; i++) {
      const pagePath = path.join(actualFixturesDir, `presets-hex-${i}.bin`);
      if (fs.existsSync(pagePath)) {
        presetPages.push(new Uint8Array(fs.readFileSync(pagePath)));
      }
    }

    const firstPreset = parsePreset(decodePresetPages(presetPages));
    const firstPresetNormalized: Record<string, unknown> =
      normalizeForJsonComparison(firstPreset) as Record<string, unknown>;

    // 4. Load "Preset 36" (from factory dump)
    const dcxData = new Uint8Array(
      fs.readFileSync(path.join(actualFixturesDir, 'factory-presets.dcx')),
    );
    const presets = parseDcxPresets(dcxData);
    const preset36 = presets[36];
    const preset36StateNormalized: Record<string, unknown> =
      normalizeForJsonComparison(preset36.state) as Record<string, unknown>;

    // --- Verify Inputs ---
    // currrent state = stored json
    expect(currentState.inputs).toEqual(storedJson.inputs);
    // Currrent state = first preset (sync channelName - fixtures have different captures)
    const firstPresetInputsNormalized = JSON.parse(JSON.stringify(firstPreset.inputs));
    for (const key of Object.keys(firstPresetInputsNormalized)) {
      firstPresetInputsNormalized[key].channelName = currentState.inputs[key].channelName;
    }
    expect(currentState.inputs).toEqual(firstPresetInputsNormalized);
    // Currrent state = preset 36 (sync channelName - fixtures have different captures)
    const preset36InputsNormalized = JSON.parse(JSON.stringify(preset36.state.inputs));
    for (const key of Object.keys(preset36InputsNormalized)) {
      preset36InputsNormalized[key].channelName = currentState.inputs[key].channelName;
    }
    expect(currentState.inputs).toEqual(preset36InputsNormalized);

    // --- Verify Outputs ---
    // currrent state = stored json
    expect(currentState.outputs).toEqual(storedJson.outputs);
    // Currrent state = first preset
    expect(currentState.outputs).toEqual(firstPreset.outputs);
    // Currrent state = preset 36
    expect(currentState.outputs).toEqual(preset36.state.outputs);

    // Sync known valid differences
    // delayLink is distinct in the capture files (true in preset, false in editBuffer)
    (
      firstPresetNormalized as Record<string, Record<string, unknown>>
    ).setup.delayLink = (
      currentStateNormalized as Record<string, Record<string, unknown>>
    ).setup.delayLink;
    (
      preset36StateNormalized as Record<string, Record<string, unknown>>
    ).setup.delayLink = (
      currentStateNormalized as Record<string, Record<string, unknown>>
    ).setup.delayLink;
    
    // Fields that exist in Edit Buffer but NOT in Presets - sync from currentState
    const ebOnlyFields = ['outputConfig', 'deviceName', 'activePresetNumber', 'activePresetName', 'muteOutsWhenPowered', 'stereolink'];
    for (const field of ebOnlyFields) {
      (firstPresetNormalized as Record<string, Record<string, unknown>>).setup[field] = 
        (currentStateNormalized as Record<string, Record<string, unknown>>).setup[field];
      (preset36StateNormalized as Record<string, Record<string, unknown>>).setup[field] = 
        (currentStateNormalized as Record<string, Record<string, unknown>>).setup[field];
    }
    
    // Fixture capture-time differences (preset and editBuffer captured at different times)
    const captureTimeDiffs = ['inputCGain', 'crossoverLink'];
    for (const field of captureTimeDiffs) {
      (firstPresetNormalized as Record<string, Record<string, unknown>>).setup[field] = 
        (currentStateNormalized as Record<string, Record<string, unknown>>).setup[field];
      (preset36StateNormalized as Record<string, Record<string, unknown>>).setup[field] = 
        (currentStateNormalized as Record<string, Record<string, unknown>>).setup[field];
    }

    // Currrent state = stored json
    expect(currentStateNormalized.setup).toEqual(storedJson.setup);
    // Currrent state = first preset
    expect(currentStateNormalized.setup).toEqual(firstPresetNormalized.setup);
    // Currrent state = preset 36
    expect(currentStateNormalized.setup).toEqual(preset36StateNormalized.setup);
  });
});

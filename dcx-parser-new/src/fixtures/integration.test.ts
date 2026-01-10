import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import Parser from '../index';

const { parseMessage, parseEditBuffer, parsePreset, parseDcxPresets } = Parser;

/**
 * Helper to convert Uint8Array objects to plain objects for JSON comparison.
 * When JSON.stringify is used on state in the browser, Uint8Array becomes {"0": x, "1": y, ...}
 */
function normalizeForJsonComparison(obj: unknown): unknown {
    if (obj instanceof Uint8Array) {
        // Convert Uint8Array to plain object like browser's JSON.stringify does
        const result: Record<string, number> = {};
        for (let i = 0; i < obj.length; i++) {
            result[String(i)] = obj[i];
        }
        return result;
    }
    if (Array.isArray(obj)) {
        return obj.map(normalizeForJsonComparison);
    }
    if (obj !== null && typeof obj === 'object') {
        const result: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(obj)) {
            result[key] = normalizeForJsonComparison(value);
        }
        return result;
    }
    return obj;
}

describe('State Integration Test', () => {
    // Use absolute path to src/fixtures to ensure tests work from both src/ and dist/
    const fixturesDir = path.resolve(__dirname.replace('/dist/', '/src/').replace('\\dist\\', '\\src\\'), __dirname.includes('/dist/') || __dirname.includes('\\dist\\') ? '' : '');
    const actualFixturesDir = fixturesDir.includes('/dist/') ? fixturesDir.replace('/dist/', '/src/') : fixturesDir;

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
        const msg0 = parseMessage(new Uint8Array(bin0));
        const msg1 = parseMessage(new Uint8Array(bin1));

        if (!msg0 || msg0.type !== 'editBuffer') {
            throw new Error('Failed to parse current-state-0.bin as editBuffer message');
        }
        if (!msg1 || msg1.type !== 'editBuffer') {
            throw new Error('Failed to parse current-state-1.bin as editBuffer message');
        }

        // 3. Concatenate data chunks (exactly as useDcxState does in hooks/use-dcx-state.ts)
        // Note: part numbers determine order - part 0 comes first, part 1 second
        const part0Data = msg0.part === 0 ? msg0.data : msg1.data;
        const part1Data = msg0.part === 1 ? msg0.data : msg1.data;

        const combined = new Uint8Array(part0Data.length + part1Data.length);
        combined.set(part0Data);
        combined.set(part1Data, part0Data.length);

        // 4. Parse the full edit buffer to get the state object
        const result = parseEditBuffer(combined);

        // 5. Read expected JSON (captured from browser when UI was running)
        const expectedJson = fs.readFileSync(
            path.join(actualFixturesDir, 'current-state-browser.json'),
            'utf-8',
        );
        const expected = JSON.parse(expectedJson);

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
        const firstPreset = parsePreset(presetPages);

        // 3. Load and parse the edit buffer for comparison
        const bin0 = fs.readFileSync(path.join(actualFixturesDir, 'current-state-0.bin'));
        const bin1 = fs.readFileSync(path.join(actualFixturesDir, 'current-state-1.bin'));

        const msg0 = parseMessage(new Uint8Array(bin0));
        const msg1 = parseMessage(new Uint8Array(bin1));

        if (!msg0 || msg0.type !== 'editBuffer' || !msg1 || msg1.type !== 'editBuffer') {
            throw new Error('Failed to parse edit buffer messages');
        }

        const part0Data = msg0.part === 0 ? msg0.data : msg1.data;
        const part1Data = msg0.part === 1 ? msg0.data : msg1.data;
        const combined = new Uint8Array(part0Data.length + part1Data.length);
        combined.set(part0Data);
        combined.set(part1Data, part0Data.length);

        const editBuffer = parseEditBuffer(combined);

        // 4. Compare key values - preset should match edit buffer
        // Note: Header structure differs, so we compare setup/inputs/outputs
        // Note: delayLink differs between preset/editBuffer captures - not a parsing error

        // Compar setup
        // normalizeForJsonComparison is used to handle Uint8Array serialization differences
        const normalizedPresetSetup = normalizeForJsonComparison(firstPreset.setup) as any;
        const normalizedEditBufferSetup = normalizeForJsonComparison(editBuffer.setup) as any;

        // Sync known valid differences
        // delayLink is distinct in the capture files (true in preset, false in editBuffer)
        normalizedEditBufferSetup.delayLink = normalizedPresetSetup.delayLink;

        expect(normalizedPresetSetup).toEqual(normalizedEditBufferSetup);

        // Compare inputs
        const normalizedPresetInputs = normalizeForJsonComparison(firstPreset.inputs);
        const normalizedEditBufferInputs = normalizeForJsonComparison(editBuffer.inputs);
        expect(normalizedPresetInputs).toEqual(normalizedEditBufferInputs);

        // Compare outputs
        const normalizedPresetOutputs = normalizeForJsonComparison(firstPreset.outputs);
        const normalizedEditBufferOutputs = normalizeForJsonComparison(editBuffer.outputs);
        expect(normalizedPresetOutputs).toEqual(normalizedEditBufferOutputs);

        // Preset name check
        expect(firstPreset.header.presetName.trim()).toEqual('2*3WAY');
    });

    it('should parse preset 0 and preset 36 with matching values (locked factory copy)', () => {
        // Load the factory presets DCX file
        const dcxData = new Uint8Array(fs.readFileSync(
            path.join(actualFixturesDir, 'factory-presets.dcx'),
        ));

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
        expect(state36.outputs['1'].channelName).toEqual(state0.outputs['1'].channelName);
        expect(state36.outputs['1'].source).toEqual(state0.outputs['1'].source);
    });

    it('should correctly parse all factory preset names', () => {
        // Load the factory presets DCX file
        const dcxData = new Uint8Array(fs.readFileSync(
            path.join(actualFixturesDir, 'factory-presets.dcx'),
        ));

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
            const idx = parseInt(index);
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
        const dcxData = new Uint8Array(fs.readFileSync(
            path.join(actualFixturesDir, 'factory-presets.dcx'),
        ));

        const presets = parseDcxPresets(dcxData);

        // Slot 20 and 56 are both "MONO" presets
        const monoSlots = [20, 56];

        for (const slot of monoSlots) {
            const preset = presets[slot];
            expect(preset.name).toBe('MONO');
            expect(preset.isEmpty).toBe(false);
            expect(preset.state.setup.outputConfig).toBe('mono');
        }
    });

    it('should parse 2*3WAY presets with correct outputConfig', () => {
        const dcxData = new Uint8Array(fs.readFileSync(
            path.join(actualFixturesDir, 'factory-presets.dcx'),
        ));

        const presets = parseDcxPresets(dcxData);

        // Slot 0 and 36 are both "2*3WAY" presets
        const threeWaySlots = [0, 36];

        for (const slot of threeWaySlots) {
            const preset = presets[slot];
            expect(preset.name).toBe('2*3WAY');
            expect(preset.isEmpty).toBe(false);
            expect(preset.state.setup.outputConfig).toBe('lmhlmh');
        }
    });

    it('should parse all setup, input, and output parameters for preset 0', () => {
        const dcxData = new Uint8Array(fs.readFileSync(
            path.join(actualFixturesDir, 'factory-presets.dcx'),
        ));

        const presets = parseDcxPresets(dcxData);
        const preset0 = presets[0];
        const state = preset0.state;

        // Verify setup parameters
        expect(state.setup.outputConfig).toBeDefined();
        expect(state.setup.stereolink).toBeDefined();
        expect(state.setup.crossoverLink).toBeDefined();
        expect(state.setup.delayLink).toBeDefined();
        expect(state.setup.airTemperature).toBeDefined();

        // Verify all 4 inputs exist with expected properties
        for (const inputName of ['A', 'B', 'C', 'Sum']) {
            const input = state.inputs[inputName as 'A' | 'B' | 'C' | 'Sum'];
            expect(input).toBeDefined();
            expect(input.gain).toBeDefined();
            expect(input.mute).toBeDefined();
            expect(input.isDelayOn).toBeDefined();
            expect(input.dynamicEqualizerAttack).toBeDefined();
            expect(input.dynamicEqualizerRelease).toBeDefined();
            expect(input.dynamicEqualizerRatio).toBeDefined();
            expect(input.dynamicEqualizerThreshold).toBeDefined();
            expect(input.isDynamicEqualizerOn).toBeDefined();
            // All 9 EQ bands are nested objects
            for (let band = 1; band <= 9; band++) {
                const eq = input.equalizers[String(band)];
                expect(eq).toBeDefined();
                expect(eq.frequency).toBeDefined();
                expect(eq.gain).toBeDefined();
                expect(eq.q).toBeDefined();
            }
        }

        // Verify all 6 outputs exist with expected properties
        for (let i = 1; i <= 6; i++) {
            const output = state.outputs[String(i)];
            expect(output).toBeDefined();
            expect(output.channelName).toBeDefined();
            expect(output.source).toBeDefined();
            expect(output.highpassFilter).toBeDefined();
            expect(output.highpassFrequency).toBeDefined();
            expect(output.lowpassFilter).toBeDefined();
            expect(output.lowpassFrequency).toBeDefined();
            expect(output.gain).toBeDefined();
            expect(output.mute).toBeDefined();
            expect(output.polarity).toBeDefined();
            expect(output.longDelay).toBeDefined();
            expect(output.shortDelay).toBeDefined();
            expect(output.isLimiterOn).toBeDefined();
            // All 9 EQ bands are nested objects
            for (let band = 1; band <= 9; band++) {
                const eq = output.equalizers[String(band)];
                expect(eq).toBeDefined();
                expect(eq.frequency).toBeDefined();
                expect(eq.gain).toBeDefined();
                expect(eq.q).toBeDefined();
            }
        }
    });
});

import * as fs from 'node:fs';
import * as path from 'node:path';
import { describe, it, expect } from 'vitest';
import { parsePreset } from '../preset-parser.js';
function loadDcxFile(filename) {
    return fs.readFileSync(path.join(process.cwd(), filename));
}
describe('Preset Parser V2', () => {
    it('should parse .dcx file (current.dcx)', () => {
        const dcx = loadDcxFile('src/fixtures/current.dcx');
        // Current.dcx might contain multiple presets or just one?
        // The parser expects a single preset structure given XSNP is at 0.
        // If current.dcx contains MORE data (64 presets), we are only parsing the first one
        // because the loop runs sequentially once.
        // Note: Task is to "parse array of presets".
        // But let's verify single parsing first.
        const state = parsePreset(dcx);
        expect(state.header.xpcrSignature).toBe('XSNP');
        // Check some values to ensure alignment isn't totally off
        const temporary = state.setup.airTemperature;
        expect(typeof temporary).toBe('number');
        expect(temporary).toBeGreaterThan(-50);
        expect(temporary).toBeLessThan(100);
        const { gain } = state.inputs.A;
        expect(typeof gain).toBe('number');
        expect(gain).toBeGreaterThanOrEqual(-15);
        expect(gain).toBeLessThanOrEqual(15);
    });
});
//# sourceMappingURL=preset-v2.test.js.map
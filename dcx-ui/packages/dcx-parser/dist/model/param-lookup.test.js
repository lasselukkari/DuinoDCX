import { describe, it, expect } from 'vitest';
import { getParameterByByte, getParameterByDirect, convertValue, applyToState, } from './param-lookup.js';
import { createEmptyState } from './helpers.js';
describe('param-lookup', () => {
    describe('getParameterByByte', () => {
        it('should find setup parameters', () => {
            const def = getParameterByByte(115); // Output Config
            expect(def).toBeDefined();
            expect(def?.key).toBe('outputConfig');
            expect(def?.target.kind).toBe('setup');
        });
        it('should find channel parameters', () => {
            const def = getParameterByByte(138); // Input A Gain
            expect(def).toBeDefined();
            expect(def?.key).toBe('gain');
            expect(def?.target.kind).toBe('channel');
            if (def?.target.kind === 'channel') {
                expect(def.target.group).toBe('inputs');
                expect(def.target.id).toBe('A');
            }
        });
        it('should find equalizer parameters', () => {
            const def = getParameterByByte(177); // Equalizer 1 Freq block start
            expect(def).toBeDefined();
            expect(def?.key).toBe('equalizerFrequency');
            expect(def?.target.kind).toBe('equalizer');
        });
        it('should return undefined for unknown index', () => {
            expect(getParameterByByte(9999)).toBeUndefined();
        });
    });
    describe('getParameterByDirect', () => {
        it('should find setup parameters', () => {
            const def = getParameterByDirect(0, 5); // Channel 0, Param 5 (Output Config)
            expect(def).toBeDefined();
            expect(def?.key).toBe('outputConfig');
        });
        it('should find channel parameters', () => {
            const def = getParameterByDirect(1, 2); // Channel 1 (Input A), Param 2 (Gain)
            expect(def).toBeDefined();
            expect(def?.key).toBe('gain');
        });
        it('should find equalizer parameters', () => {
            const def = getParameterByDirect(1, 19); // Channel 1 (Input A), Param 19 (Equalizer 1 Freq)
            expect(def).toBeDefined();
            expect(def?.key).toBe('equalizerFrequency');
        });
    });
    describe('convertValue', () => {
        it('should convert boolean values', () => {
            const def = getParameterByDirect(1, 3); // Mute
            expect(convertValue(def, 1)).toBe(true);
            expect(convertValue(def, 0)).toBe(false);
        });
        it('should convert enum values', () => {
            const def = getParameterByDirect(0, 5); // Output Config
            expect(convertValue(def, 1)).toBe('lmhlmh');
        });
        it('should convert number values', () => {
            const def = getParameterByDirect(1, 2); // Gain
            // Gain is -15 to 15 with 0.1 step. Raw 150 = 0dB
            expect(convertValue(def, 150)).toBe(0);
            expect(convertValue(def, 200)).toBe(5);
        });
    });
    describe('applyToState', () => {
        it('should apply setup values', () => {
            const state = createEmptyState();
            const def = getParameterByDirect(0, 5);
            applyToState(state, def, 'llmmhh');
            expect(state.setup.outputConfig).toBe('llmmhh');
        });
        it('should apply channel values', () => {
            const state = createEmptyState();
            const def = getParameterByDirect(1, 2);
            applyToState(state, def, 5.5);
            expect(state.inputs.A.gain).toBe(5.5);
        });
        it('should apply equalizer values', () => {
            const state = createEmptyState();
            const def = getParameterByDirect(1, 19);
            applyToState(state, def, '1000 Hz');
            expect(state.inputs.A.equalizers['1'].equalizerFrequency).toBe('1000 Hz');
        });
    });
});
//# sourceMappingURL=param-lookup.test.js.map
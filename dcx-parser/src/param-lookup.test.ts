import { describe, it, expect } from 'vitest';
import {
  byteLookup,
  getParameterByByte,
  getParameterByDirect,
  convertValue,
  toRawValue,
} from './param-lookup.js';

describe('param-lookup', () => {
  describe('byteLookup', () => {
    it('should have entries for setup parameters', () => {
      // Input Sum Type is at absolute index 109
      const parameter = getParameterByByte(109);
      expect(parameter).toBeDefined();
      expect(parameter?.key).toBe('inputSumType');
      expect(parameter?.type).toBe('enum');
      expect(parameter?.target.kind).toBe('setup');
    });

    it('should have entries for channel parameters', () => {
      // Gain for input A is at absolute index 138
      const parameter = getParameterByByte(138);
      expect(parameter).toBeDefined();
      expect(parameter?.key).toBe('gain');
      if (parameter?.target.kind === 'channel') {
        expect(parameter.target.group).toBe('inputs');
        expect(parameter.target.id).toBe('A');
      }
    });

    it('should have entries for EQ parameters', () => {
      // EQ Frequency for input A, band 1 is at absolute index 177
      const parameter = getParameterByByte(177);
      expect(parameter).toBeDefined();
      expect(parameter?.key).toBe('eqFrequency');
      if (parameter?.target.kind === 'eq') {
        expect(parameter.target.group).toBe('inputs');
        expect(parameter.target.channelId).toBe('A');
        expect(parameter.target.band).toBe(1);
      }
    });

    it('should have many entries', () => {
      // Should have hundreds of entries for all parameters
      expect(byteLookup.size).toBeGreaterThan(100);
    });
  });

  describe('directLookup', () => {
    it('should have entries for setup parameters', () => {
      // Channel 0, param 2 = first setup parameter
      const parameter = getParameterByDirect(0, 2);
      expect(parameter).toBeDefined();
      expect(parameter?.target.kind).toBe('setup');
    });

    it('should have entries for input channel parameters', () => {
      // Channel 1 = Input A, param 2 = Gain
      const parameter = getParameterByDirect(1, 2);
      expect(parameter).toBeDefined();
      expect(parameter?.key).toBe('gain');
      if (parameter?.target.kind === 'channel') {
        expect(parameter.target.group).toBe('inputs');
        expect(parameter.target.id).toBe('A');
      }
    });

    it('should have entries for output channel parameters', () => {
      // Channel 5 = Output 1, param 64 = first output-only param
      const parameter = getParameterByDirect(5, 64);
      expect(parameter).toBeDefined();
      if (parameter?.target.kind === 'channel') {
        expect(parameter.target.group).toBe('outputs');
        expect(parameter.target.id).toBe('1');
      }
    });

    it('should have entries for EQ parameters', () => {
      // Channel 1 = Input A, param 19 = EQ band 1, first EQ param
      const parameter = getParameterByDirect(1, 19);
      expect(parameter).toBeDefined();
      if (parameter?.target.kind === 'eq') {
        expect(parameter.target.band).toBe(1);
      }
    });
  });

  describe('convertValue', () => {
    it('should convert bool values', () => {
      const def = {
        key: 'test',
        type: 'bool' as const,
        target: { kind: 'setup' as const },
      };
      expect(convertValue(def, 0)).toBe(false);
      expect(convertValue(def, 1)).toBe(true);
      expect(convertValue(def, 5)).toBe(true);
    });

    it('should convert enum values', () => {
      const def = {
        key: 'test',
        type: 'enum' as const,
        values: ['Off', 'A', 'B', 'C'] as const,
        target: { kind: 'setup' as const },
      };
      expect(convertValue(def, 0)).toBe('Off');
      expect(convertValue(def, 1)).toBe('A');
      expect(convertValue(def, 3)).toBe('C');
    });

    it('should convert number values with min and step', () => {
      const def = {
        key: 'test',
        type: 'number' as const,
        min: -15,
        step: 0.1,
        target: { kind: 'setup' as const },
      };
      expect(convertValue(def, 0)).toBe(-15);
      expect(convertValue(def, 150)).toBe(0); // -15 + 150 * 0.1 = 0
      expect(convertValue(def, 300)).toBe(15); // -15 + 300 * 0.1 = 15
    });
  });

  describe('toRawValue', () => {
    it('should convert bool values', () => {
      const def = {
        key: 'test',
        type: 'bool' as const,
        target: { kind: 'setup' as const },
      };
      expect(toRawValue(def, false)).toBe(0);
      expect(toRawValue(def, true)).toBe(1);
    });

    it('should convert enum values', () => {
      const def = {
        key: 'test',
        type: 'enum' as const,
        values: ['Off', 'A', 'B', 'C'] as const,
        target: { kind: 'setup' as const },
      };
      expect(toRawValue(def, 'Off')).toBe(0);
      expect(toRawValue(def, 'A')).toBe(1);
      expect(toRawValue(def, 'C')).toBe(3);
    });

    it('should convert number values', () => {
      const def = {
        key: 'test',
        type: 'number' as const,
        min: -15,
        step: 0.1,
        target: { kind: 'setup' as const },
      };
      expect(toRawValue(def, -15)).toBe(0);
      expect(toRawValue(def, 0)).toBe(150);
      expect(toRawValue(def, 15)).toBe(300);
    });

    it('should round-trip with convertValue', () => {
      const def = {
        key: 'test',
        type: 'number' as const,
        min: -15,
        step: 0.1,
        target: { kind: 'setup' as const },
      };
      const original = 5.5;
      const raw = toRawValue(def, original);
      const converted = convertValue(def, raw);
      expect(converted).toBeCloseTo(original, 1);
    });
  });
});

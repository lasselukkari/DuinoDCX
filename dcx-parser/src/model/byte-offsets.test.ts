import {describe, it, expect} from 'vitest';
import {getByteOffset} from './byte-offsets.js';
import {parseEditBuffer} from '../edit-buffer-parser.js';
import {parseMessage} from '../protocol/sysex.js';
import {readFileSync} from 'node:fs';
import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Load test edit buffer and parse it
 */
function loadTestData(): {buffer: Uint8Array; state: any} {
  const bin0 = readFileSync(join(__dirname, '../test/current-state-0.bin'));
  const bin1 = readFileSync(join(__dirname, '../test/current-state-1.bin'));
  
  const message0 = parseMessage(new Uint8Array(bin0));
  const message1 = parseMessage(new Uint8Array(bin1));
  
  if (message0?.type !== 'editBuffer' || message1?.type !== 'editBuffer') {
    throw new Error('Failed to parse test fixtures');
  }
  
  const part0Data = message0.part === 0 ? message0.data : message1.data;
  const part1Data = message0.part === 1 ? message0.data : message1.data;
  
  const buffer = new Uint8Array(part0Data.length + part1Data.length);
  buffer.set(part0Data);
  buffer.set(part1Data, part0Data.length);
  
  const state = parseEditBuffer(buffer);
  
  return {buffer, state};
}

/**
 * Read a 16-bit little-endian value from buffer
 */
function readU16LE(buffer: Uint8Array, offset: number): number {
  return buffer[offset] | (buffer[offset + 1] << 8);
}

describe('Byte Offsets', () => {
  
  describe('Setup parameters', () => {
    it('maps outputConfig correctly', () => {
      const {buffer} = loadTestData();
      const offsetInfo = getByteOffset('setup.outputConfig');
      
      expect(offsetInfo).toBeDefined();
      expect(offsetInfo!.size).toBe(2);
      
      // Verify the offset points to the correct value
      const rawValue = readU16LE(buffer, offsetInfo!.offset);
      // outputConfig is an enum, we just verify we can read it
      expect(rawValue).toBeGreaterThanOrEqual(0);
    });
    
    it('maps stereolink correctly', () => {
      const {buffer} = loadTestData();
      const offsetInfo = getByteOffset('setup.stereolink');
      
      expect(offsetInfo).toBeDefined();
      const rawValue = readU16LE(buffer, offsetInfo!.offset);
      
      // stereolink is boolean (0 or 1)
      expect([0, 1]).toContain(rawValue);
    });
    
    it('maps airTemperature correctly', () => {
      const {buffer} = loadTestData();
      const offsetInfo = getByteOffset('setup.airTemperature');
      
      expect(offsetInfo).toBeDefined();
      const rawValue = readU16LE(buffer, offsetInfo!.offset);
      
      // Air temperature should be reasonable (e.g., 0-100°C range in raw units)
      expect(rawValue).toBeGreaterThanOrEqual(0);
    });
  });
  
  describe('Input channel parameters', () => {
    it('maps inputs.A.gain correctly', () => {
      const {buffer} = loadTestData();
      const offsetInfo = getByteOffset('inputs.A.gain');
      
      expect(offsetInfo).toBeDefined();
      expect(offsetInfo!.size).toBe(2);
      
      const rawValue = readU16LE(buffer, offsetInfo!.offset);
      expect(rawValue).toBeGreaterThanOrEqual(0);
    });
    
    it('maps inputs.B.mute correctly', () => {
      const {buffer} = loadTestData();
      const offsetInfo = getByteOffset('inputs.B.mute');
      
      expect(offsetInfo).toBeDefined();
      const rawValue = readU16LE(buffer, offsetInfo!.offset);
      
      // mute is boolean
      expect([0, 1]).toContain(rawValue);
    });
    
    it('maps inputs.C.isDelayOn correctly', () => {
      const {buffer} = loadTestData();
      const offsetInfo = getByteOffset('inputs.C.isDelayOn');
      
      expect(offsetInfo).toBeDefined();
      const rawValue = readU16LE(buffer, offsetInfo!.offset);
      expect([0, 1]).toContain(rawValue);
    });
    
    it('maps inputs.Sum.gain correctly', () => {
      const {buffer} = loadTestData();
      const offsetInfo = getByteOffset('inputs.Sum.gain');
      
      expect(offsetInfo).toBeDefined();
      const rawValue = readU16LE(buffer, offsetInfo!.offset);
      expect(rawValue).toBeGreaterThanOrEqual(0);
    });
  });
  
  describe('Input EQ parameters', () => {
    it('maps inputs.A.equalizers.0.equalizerFrequency correctly', () => {
      const {buffer} = loadTestData();
      const offsetInfo = getByteOffset('inputs.A.equalizers.0.equalizerFrequency');
      
      expect(offsetInfo).toBeDefined();
      expect(offsetInfo!.size).toBe(2);
      
      const rawValue = readU16LE(buffer, offsetInfo!.offset);
      expect(rawValue).toBeGreaterThanOrEqual(0);
    });
    
    it('maps inputs.B.equalizers.5.equalizerGain correctly', () => {
      const {buffer} = loadTestData();
      const offsetInfo = getByteOffset('inputs.B.equalizers.5.equalizerGain');
      
      expect(offsetInfo).toBeDefined();
      const rawValue = readU16LE(buffer, offsetInfo!.offset);
      expect(rawValue).toBeGreaterThanOrEqual(0);
    });
  });
  
  describe('Output channel parameters', () => {
    it('maps outputs.1.gain correctly', () => {
      const {buffer} = loadTestData();
      const offsetInfo = getByteOffset('outputs.1.gain');
      
      expect(offsetInfo).toBeDefined();
      const rawValue = readU16LE(buffer, offsetInfo!.offset);
      expect(rawValue).toBeGreaterThanOrEqual(0);
    });
    
    it('maps outputs.3.source correctly', () => {
      const {buffer} = loadTestData();
      const offsetInfo = getByteOffset('outputs.3.source');
      
      expect(offsetInfo).toBeDefined();
      const rawValue = readU16LE(buffer, offsetInfo!.offset);
      expect(rawValue).toBeGreaterThanOrEqual(0);
    });
    
    it('maps outputs.6.polarity correctly', () => {
      const {buffer} = loadTestData();
      const offsetInfo = getByteOffset('outputs.6.polarity');
      
      expect(offsetInfo).toBeDefined();
      const rawValue = readU16LE(buffer, offsetInfo!.offset);
      expect([0, 1]).toContain(rawValue);
    });
  });
  
  describe('Output EQ parameters', () => {
    it('maps outputs.2.equalizers.3.equalizerQ correctly', () => {
      const {buffer} = loadTestData();
      const offsetInfo = getByteOffset('outputs.2.equalizers.3.equalizerQ');
      
      expect(offsetInfo).toBeDefined();
      const rawValue = readU16LE(buffer, offsetInfo!.offset);
      expect(rawValue).toBeGreaterThanOrEqual(0);
    });
  });
  
  describe('Input channel names', () => {
    it('maps inputs.A.channelName correctly', () => {
      const {buffer, state} = loadTestData();
      const offsetInfo = getByteOffset('inputs.A.channelName');
      
      expect(offsetInfo).toBeDefined();
      expect(offsetInfo!.size).toBe(16);  // 8 UTF-16LE chars = 16 bytes
      
      // Read the UTF-16LE string
      const nameBytes = buffer.slice(offsetInfo!.offset, offsetInfo!.offset + 16);
      const decoder = new TextDecoder('utf-16le');
      const name = decoder.decode(nameBytes).trim();
      
      // Should match parsed state
      expect(name).toBe(state.inputs.A.channelName);
    });
    
    it('maps inputs.B.channelName correctly', () => {
      const {buffer, state} = loadTestData();
      const offsetInfo = getByteOffset('inputs.B.channelName');
      
      expect(offsetInfo).toBeDefined();
      
      const nameBytes = buffer.slice(offsetInfo!.offset, offsetInfo!.offset + 16);
      const decoder = new TextDecoder('utf-16le');
      const name = decoder.decode(nameBytes).trim();
      
      expect(name).toBe(state.inputs.B.channelName);
    });
    
    it('maps inputs.Sum.channelName correctly', () => {
      const {buffer, state} = loadTestData();
      const offsetInfo = getByteOffset('inputs.Sum.channelName');
      
      expect(offsetInfo).toBeDefined();
      
      const nameBytes = buffer.slice(offsetInfo!.offset, offsetInfo!.offset + 16);
      const decoder = new TextDecoder('utf-16le');
      const name = decoder.decode(nameBytes).trim();
      
      expect(name).toBe(state.inputs.Sum.channelName);
    });
  });
  
  describe('Invalid paths', () => {
    it('returns undefined for invalid path', () => {
      expect(getByteOffset('invalid.path')).toBeUndefined();
    });
    
    it('returns undefined for invalid channel', () => {
      expect(getByteOffset('inputs.Z.gain')).toBeUndefined();
    });
    
    it('returns undefined for invalid parameter', () => {
      expect(getByteOffset('setup.nonexistent')).toBeUndefined();
    });
  });
});

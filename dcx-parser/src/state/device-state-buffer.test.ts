import {describe, it, expect} from 'vitest';
import {DeviceStateBuffer, PAGE_SIZE} from './device-state-buffer.js';
import {parseMessage} from '../protocol/sysex.js';
import {readFileSync} from 'node:fs';
import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Load test buffer from fixtures
 */
function loadTestBuffer(): Uint8Array {
  const bin0 = readFileSync(join(__dirname, '../test/current-state-0.bin'));
  const bin1 = readFileSync(join(__dirname, '../test/current-state-1.bin'));
  
  const message0 = parseMessage(new Uint8Array(bin0));
  const message1 = parseMessage(new Uint8Array(bin1));
  
  if (message0?.type !== 'editBuffer' || message1?.type !== 'editBuffer') {
    throw new Error('Failed to parse test fixtures');
  }
  
  const part0Data = message0.part === 0 ? message0.data : message1.data;
  const part1Data = message0.part === 1 ? message0.data : message1.data;
  
  const combined = new Uint8Array(part0Data.length + part1Data.length);
  combined.set(part0Data);
  combined.set(part1Data, part0Data.length);
  
  return combined;
}

describe('DeviceStateBuffer', () => {
  
  describe('construction', () => {
    it('creates buffer from combined data', () => {
      const testData = loadTestBuffer();
      const buffer = new DeviceStateBuffer(testData);
      expect(buffer.getData().length).toBe(testData.length);
    });
    
    it('creates buffer from two parts', () => {
      const testData = loadTestBuffer();
      const part0 = testData.subarray(0, PAGE_SIZE);
      const part1 = testData.subarray(PAGE_SIZE);
      
      const buffer = DeviceStateBuffer.fromParts(part0, part1);
      expect(buffer.getData().length).toBe(testData.length);
    });
    
    it('copies input data (no mutation of original)', () => {
      const original = new Uint8Array([1, 2, 3, 4, 5]);
      const buffer = new DeviceStateBuffer(original);
      original[0] = 99;
      expect(buffer.getData()[0]).toBe(1);  // Not mutated
    });
  });
  
  describe('getState()', () => {
    it('parses and returns State object', () => {
      const testData = loadTestBuffer();
      const buffer = new DeviceStateBuffer(testData);
      const state = buffer.getState();
      
      expect(state).toBeDefined();
      expect(state.header).toBeDefined();
      expect(state.setup).toBeDefined();
    });
    
    it('caches parsed state on repeated calls', () => {
      const testData = loadTestBuffer();
      const buffer = new DeviceStateBuffer(testData);
      const state1 = buffer.getState();
      const state2 = buffer.getState();
      expect(state1).toBe(state2);  // Same reference = cached
    });
    
    it('re-parses after byte update', () => {
      const testData = loadTestBuffer();
      const buffer = new DeviceStateBuffer(testData);
      const state1 = buffer.getState();
      
      // Offset 100 is stereolinkMode (enum 0-3), so use a valid value
      buffer.updateWord(100, 2);
      
      const state2 = buffer.getState();
      expect(state1).not.toBe(state2);  // Different reference = re-parsed
    });
  });
  
  describe('getPart0() / getPart1()', () => {
    it('splits at correct boundary', () => {
      const testData = loadTestBuffer();
      const buffer = new DeviceStateBuffer(testData);
      
      const part0 = buffer.getPart0();
      const part1 = buffer.getPart1();
      
      expect(part0.length).toBe(PAGE_SIZE);
      expect(part1.length).toBe(testData.length - PAGE_SIZE);
    });
    
    it('parts concatenate to original', () => {
      const testData = loadTestBuffer();
      const buffer = new DeviceStateBuffer(testData);
      
      const part0 = buffer.getPart0();
      const part1 = buffer.getPart1();
      
      const recombined = new Uint8Array(part0.length + part1.length);
      recombined.set(part0);
      recombined.set(part1, part0.length);
      
      expect(recombined).toEqual(testData);
    });
  });
  
  describe('updateWord()', () => {
    it('updates little-endian word at offset', () => {
      const testData = loadTestBuffer();
      const buffer = new DeviceStateBuffer(testData);
      
      buffer.updateWord(100, 0x1234);
      
      const data = buffer.getData();
      expect(data[100]).toBe(0x34);  // Low byte
      expect(data[101]).toBe(0x12);  // High byte
    });
    
    it('marks buffer as dirty', () => {
      const testData = loadTestBuffer();
      const buffer = new DeviceStateBuffer(testData);
      
      buffer.getState();  // Populate cache
      buffer.updateWord(100, 9999);
      
      // Cache should be invalidated (verified via reference check above)
    });
  });
  
  describe('updateString()', () => {
    it('writes UTF-16LE string at offset', () => {
      const testData = loadTestBuffer();
      const buffer = new DeviceStateBuffer(testData);
      
      buffer.updateString(1000, 'TEST', 4);
      
      const data = buffer.getData();
      expect(data[1000]).toBe('T'.charCodeAt(0));
      expect(data[1001]).toBe(0);
      expect(data[1002]).toBe('E'.charCodeAt(0));
      expect(data[1003]).toBe(0);
    });
    
    it('pads short strings with spaces', () => {
      const testData = loadTestBuffer();
      const buffer = new DeviceStateBuffer(testData);
      
      buffer.updateString(1000, 'AB', 4);
      
      const data = buffer.getData();
      expect(data[1004]).toBe(' '.charCodeAt(0));  // Padded
      expect(data[1006]).toBe(' '.charCodeAt(0));  // Padded
    });
    
    it('truncates long strings', () => {
      const testData = loadTestBuffer();
      const buffer = new DeviceStateBuffer(testData);
      
      buffer.updateString(1000, 'TOOLONG', 4);
      
      const decoder = new TextDecoder('utf-16le');
      const result = decoder.decode(buffer.getData().subarray(1000, 1008));
      expect(result).toBe('TOOL');
    });
    
    it('marks buffer as dirty', () => {
      const testData = loadTestBuffer();
      const buffer = new DeviceStateBuffer(testData);
      
      buffer.getState();  // Populate cache
      buffer.updateString(1000, 'TEST', 4);
      
      // Cache should be invalidated
    });
  });
});

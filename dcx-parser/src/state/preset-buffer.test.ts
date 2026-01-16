import {describe, it, expect} from 'vitest';
import {PresetBuffer} from './preset-buffer.js';
import {PAGE_SIZE} from './device-state-buffer.js';
import {parseMessage} from '../index.js';
import {readFileSync} from 'node:fs';
import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Load test preset data (.dcx file)
 */
function loadTestPresets(): Uint8Array {
  const dcxPath = join(__dirname, '../test/factory-presets.dcx');
  return new Uint8Array(readFileSync(dcxPath));
}

/**
 * Load test edit buffer
 */
function loadTestEditBuffer(): Uint8Array {
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

describe('PresetBuffer', () => {
  
  describe('construction', () => {
    it('creates buffer from .dcx data', () => {
      const dcxData = loadTestPresets();
      const buffer = new PresetBuffer(dcxData);
      expect(buffer.getData().length).toBe(dcxData.length);
    });
    
    it('creates buffer from pages', () => {
      const dcxData = loadTestPresets();
      
      // Split into pages
      const pages: Uint8Array[] = [];
      for (let i = 0; i < dcxData.length; i += PAGE_SIZE) {
        const end = Math.min(i + PAGE_SIZE, dcxData.length);
        pages.push(dcxData.subarray(i, end));
      }
      
      const buffer = PresetBuffer.fromPages(pages);
      expect(buffer.getData().length).toBe(dcxData.length);
    });
    
    it('copies input data (no mutation of original)', () => {
      const original = new Uint8Array([1, 2, 3, 4, 5]);
      const buffer = new PresetBuffer(original);
      original[0] = 99;
      expect(buffer.getData()[0]).toBe(1);  // Not mutated
    });
  });
  
  describe('getPresets()', () => {
    it('parses and returns preset list', () => {
      const dcxData = loadTestPresets();
      const buffer = new PresetBuffer(dcxData);
      const presets = buffer.getPresets();
      
      expect(presets).toBeDefined();
      expect(presets.length).toBe(60);  // Factory presets have 60 slots
      expect(presets[0].name).toBe('2*3WAY');
    });
    
    it('caches parsed presets on repeated calls', () => {
      const dcxData = loadTestPresets();
      const buffer = new PresetBuffer(dcxData);
      const presets1 = buffer.getPresets();
      const presets2 = buffer.getPresets();
      expect(presets1).toBe(presets2);  // Same reference = cached
    });
  });
  
  describe('getPages()', () => {
    it('splits buffer into pages', () => {
      const dcxData = loadTestPresets();
      const buffer = new PresetBuffer(dcxData);
      const pages = buffer.getPages();
      
      expect(pages.length).toBeGreaterThan(0);
      
      // Most pages should be PAGE_SIZE (875 bytes)
      for (let i = 0; i < pages.length - 1; i++) {
        expect(pages[i].length).toBe(PAGE_SIZE);
      }
      
      // Last page might be smaller
      expect(pages[pages.length - 1].length).toBeLessThanOrEqual(PAGE_SIZE);
    });
    
    it('pages concatenate to original', () => {
      const dcxData = loadTestPresets();
      const buffer = new PresetBuffer(dcxData);
      const pages = buffer.getPages();
      
      const recombined = new Uint8Array(
        pages.reduce((sum, page) => sum + page.length, 0)
      );
      
      let offset = 0;
      for (const page of pages) {
        recombined.set(page, offset);
        offset += page.length;
      }
      
      expect(recombined).toEqual(buffer.getData());
    });
  });
  
  describe('copyFromEditBuffer()', () => {
    it('throws error - not yet implemented', () => {
      const dcxData = loadTestPresets();
      const buffer = new PresetBuffer(dcxData);
      const editBuffer = loadTestEditBuffer();
      
      expect(() => {
        buffer.copyFromEditBuffer(0, editBuffer);
      }).toThrow('not yet implemented');
    });
  });
});

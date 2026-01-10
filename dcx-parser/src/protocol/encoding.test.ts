import {describe, it, expect} from 'vitest';
import {encode8to7, decode7to8} from './encoding.js';

describe('encoding', () => {
  describe('encode8to7', () => {
    it('should encode 8 bytes (7 data + 1 slot) to 8 bytes', () => {
      // Input: 7 data bytes with MSBs set, plus a clean slot byte
      const input = new Uint8Array([
        0x81, 0x82, 0x83, 0x84, 0x85, 0x86, 0x87, 0x00,
      ]);
      const encoded = encode8to7(input, {indexed: true});

      expect(encoded.length).toBe(8);
      // Low 7 bits of each byte (MSBs stripped)
      expect(encoded[0]).toBe(0x01);
      expect(encoded[1]).toBe(0x02);
      expect(encoded[2]).toBe(0x03);
      expect(encoded[3]).toBe(0x04);
      expect(encoded[4]).toBe(0x05);
      expect(encoded[5]).toBe(0x06);
      expect(encoded[6]).toBe(0x07);
      // Flag byte (all have MSB set)
      expect(encoded[7]).toBe(0x7f);
    });

    it('should handle data with no MSBs set', () => {
      const input = new Uint8Array([
        0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x00,
      ]);
      const encoded = encode8to7(input, {indexed: true});

      expect(encoded.length).toBe(8);
      expect(encoded[7]).toBe(0x00); // No MSBs
    });

    it('should preserve data in the flag slot byte', () => {
      // Input: Data bytes + Data in slot byte
      const input = new Uint8Array([
        0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x55,
      ]);
      const encoded = encode8to7(input, {indexed: true});

      expect(encoded.length).toBe(8);
      expect(encoded[7]).toBe(0x55); // 0x55 preserved (no MSBs from data)
    });

    it('should merge calculated MSBs with data in flag slot', () => {
      // Input: Data bytes with MSBs + Data in slot byte
      const input = new Uint8Array([
        0x81, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x01,
      ]);
      const encoded = encode8to7(input, {indexed: true});

      expect(encoded.length).toBe(8);
      // Byte 0 MSB is set -> bit 0 of flag byte set (1)
      // Slot byte has value 1 -> bit 0 set (1)
      // Result: 1 | 1 = 1
      expect(encoded[7]).toBe(0x01); // Wait, purely merging logic: 0x01 | 0x01 = 0x01

      // Try distinct bits
      // bit 0 of flag corresponds to byte 0.
      const input2 = new Uint8Array([
        0x81, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x02,
      ]);
      const encoded2 = encode8to7(input2, {indexed: true});
      // Byte 0 MSB set -> Flag bit 0 = 1.
      // Slot byte val 2 -> Flag bit 1 = 1.
      // Result: 1 | 2 = 3.
      expect(encoded2[7]).toBe(0x03);
    });
  });

  describe('decode7to8', () => {
    it('should decode 8 bytes to 8 bytes (preserving flag byte)', () => {
      const input = new Uint8Array([
        0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x7f,
      ]);
      const decoded = decode7to8(input);

      expect(decoded.length).toBe(8);
      // Restored MSBs
      expect(decoded[0]).toBe(0x81);
      expect(decoded[1]).toBe(0x82);
      expect(decoded[2]).toBe(0x83);
      expect(decoded[3]).toBe(0x84);
      expect(decoded[4]).toBe(0x85);
      expect(decoded[5]).toBe(0x86);
      expect(decoded[6]).toBe(0x87);
      // Preserved flag byte
      expect(decoded[7]).toBe(0x7f);
    });

    it('should handle no MSBs', () => {
      const input = new Uint8Array([
        0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x00,
      ]);
      const decoded = decode7to8(input);

      expect(decoded.length).toBe(8);
      expect(decoded[0]).toBe(0x01);
      expect(decoded[7]).toBe(0x00);
    });
  });

  describe('round-trip', () => {
    it('should encode and decode back to original (for valid 7-bit data)', () => {
      // Data bytes must be 7-bit (<128). Flag byte can be anything.
      // But if we want perfect round trip, the flag byte bits must match the data MSBs.
      // Since data MSBs are 0, flag byte bits 0-6 must be 0?
      // No, encode8to7 GENERATES the flag byte.
      // We start with "Decoded" data.
      // "Decoded" data is 8 bytes.
      // The device memory has 8-bit bytes.
      // Use case: We have 8 bytes of memory [0-255].
      // We encode it to 8 bytes [0-127, ..., flags].
      // We decode it back.
      // Does it match?
      // encode8to7 takes 8 bytes. It writes 7 data + 1 flag.
      // The 8th byte of input is used as "base" for flags.
      // If Base flags + Calculated flags collide...

      const original = new Uint8Array([
        0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x00,
      ]);
      const encoded = encode8to7(original, {indexed: true});
      const decoded = decode7to8(encoded);

      expect(decoded).toEqual(original);
    });

    it('should handle MSB preservation', () => {
      // If we have values > 127 in first 7 bytes.
      const original = new Uint8Array([
        0x81, 0x82, 0x83, 0x84, 0x85, 0x86, 0x87, 0x00,
      ]);
      const encoded = encode8to7(original, {indexed: true});
      const decoded = decode7to8(encoded);

      // Data bytes should be preserved
      expect(decoded.subarray(0, 7)).toEqual(original.subarray(0, 7));
      // Flag byte (original[7]) will be overwritten by calculated flags (0x7F)
      expect(decoded[7]).toBe(0x7f);
    });

    it('should add MSBs if flag byte demands it', () => {
      const original = new Uint8Array([
        0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x55,
      ]);
      const encoded = encode8to7(original, {indexed: true});
      const decoded = decode7to8(encoded);

      // 0x55 = 0101 0101. Bits 0, 2, 4, 6 set.
      // So bytes 0, 2, 4, 6 get MSB (0x80) added.
      expect(decoded[0]).toBe(0x01 | 0x80); // 0x81
      expect(decoded[1]).toBe(0x02);
      expect(decoded[2]).toBe(0x03 | 0x80); // 0x83
      expect(decoded[3]).toBe(0x04);
      expect(decoded[4]).toBe(0x05 | 0x80); // 0x85
      expect(decoded[5]).toBe(0x06);
      expect(decoded[6]).toBe(0x07 | 0x80); // 0x87
      expect(decoded[7]).toBe(0x55); // Flag byte preserved
    });
  });
});

import {describe, it, expect} from 'vitest';
import {calculateChecksum, verifyChecksum} from './checksum.js';

describe('checksum', () => {
  describe('calculateChecksum', () => {
    it('should calculate correct checksum for simple data', () => {
      const data = new Uint8Array([0x01, 0x02, 0x03]);
      // (1+1) + (2+1) + (3+1) = 9
      // ~9 & 0x7F = 0x76 = 118
      expect(calculateChecksum(data)).toBe(118);
    });

    it('should handle overflow', () => {
      const data = new Uint8Array([0x7f, 0x01]);
      // (127+1) + (1+1) = 130
      // 130 = 0x82
      // ~0x82 & 0x7F = 0x7D = 125
      expect(calculateChecksum(data)).toBe(125);
    });

    it('should handle empty data', () => {
      // Sum = 0
      // ~0 & 0x7F = 127
      expect(calculateChecksum(new Uint8Array([]))).toBe(127);
    });
  });

  describe('verifyChecksum', () => {
    it('should return true for valid message', () => {
      // Data portion: bytes 13 to (length-2)
      // Real protocol uses index 13 as start of data for checksum
      const data = new Uint8Array([0x01, 0x02, 0x03, 0x00]);
      const checksum = calculateChecksum(data);

      const message = new Uint8Array([
        0xf0,
        0x00,
        0x20,
        0x32,
        0x00,
        0x0e,
        0x10, // Header (7)
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00, // Padding (6) - total 13
        ...data,
        checksum,
        0xf7,
      ]);

      expect(verifyChecksum(message)).toBe(true);
    });

    it('should return false for invalid checksum', () => {
      const message = new Uint8Array([
        0xf0, 0x00, 0x20, 0x32, 0x00, 0x0e, 0x10, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x01, 0x02, 0x03, 0xff, 0xf7,
      ]);
      expect(verifyChecksum(message)).toBe(false);
    });

    it('should return false for too short message', () => {
      expect(verifyChecksum(new Uint8Array([0xf0, 0xf7]))).toBe(false);
    });
  });
});

import {describe, it, expect} from 'vitest';
import {calculateChecksum, verifyChecksum} from './checksum.js';

describe('checksum', () => {
  describe('calculateChecksum', () => {
    it('should calculate DCX checksum correctly', () => {
      // The DCX checksum is: (~sum(byte + 1)) & 0x7F
      const data = new Uint8Array([0x00]);
      // Sum = 0 + 1 = 1
      // ~1 = -2 (in two's complement)
      // -2 & 0x7F = 0x7E
      expect(calculateChecksum(data)).toBe(0x7e);
    });

    it('should handle multiple bytes', () => {
      const data = new Uint8Array([0x01, 0x02, 0x03]);
      // Sum = (1+1) + (2+1) + (3+1) = 2 + 3 + 4 = 9
      // ~9 & 0x7F = 0x76
      expect(calculateChecksum(data)).toBe(0x76);
    });

    it('should handle empty data', () => {
      const data = new Uint8Array([]);
      // Sum = 0, ~0 & 0x7F = 0x7F
      expect(calculateChecksum(data)).toBe(0x7f);
    });
  });

  describe('verifyChecksum', () => {
    it('should verify valid checksum', () => {
      // Build a packet with valid checksum
      const header = new Uint8Array([
        0xf0, 0x00, 0x20, 0x32, 0x00, 0x0e, 0x10, 0x00, 0x01, 0x00, 0x0c, 0x00,
        0x00,
      ]);
      const data = new Uint8Array([0x01, 0x02, 0x03]);
      const checksum = calculateChecksum(data);

      const packet = new Uint8Array([...header, ...data, checksum, 0xf7]);
      expect(verifyChecksum(packet)).toBe(true);
    });

    it('should reject invalid checksum', () => {
      const header = new Uint8Array([
        0xf0, 0x00, 0x20, 0x32, 0x00, 0x0e, 0x10, 0x00, 0x01, 0x00, 0x0c, 0x00,
        0x00,
      ]);
      const data = new Uint8Array([0x01, 0x02, 0x03]);
      const wrongChecksum = 0x00;

      const packet = new Uint8Array([...header, ...data, wrongChecksum, 0xf7]);
      expect(verifyChecksum(packet)).toBe(false);
    });

    it('should reject packets that are too short', () => {
      const shortPacket = new Uint8Array([0xf0, 0x00, 0xf7]);
      expect(verifyChecksum(shortPacket)).toBe(false);
    });
  });
});

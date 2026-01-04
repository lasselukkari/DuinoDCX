import {describe, it, expect} from 'vitest';
import {
  buildPageDumpRequest,
  parseDumpResponse,
  stitchPagesToFile,
} from './backup-process.js';
import {decode7to8} from './dcx-file.js';

describe('backup-process', () => {
  describe('buildPageDumpRequest', () => {
    it('should build correct dump request for page 0', () => {
      const request = buildPageDumpRequest(0x00, 0);
      expect(request).toEqual(
        new Uint8Array([
          0xf0, 0x00, 0x20, 0x32, 0x00, 0x0e, 0x50, 0x00, 0x00, 0x00, 0xf7,
        ]),
      );
    });

    it('should build correct dump request for page 5', () => {
      const request = buildPageDumpRequest(0x00, 5);
      expect(request).toEqual(
        new Uint8Array([
          0xf0, 0x00, 0x20, 0x32, 0x00, 0x0e, 0x50, 0x00, 0x00, 0x05, 0xf7,
        ]),
      );
    });

    it('should handle different device IDs', () => {
      const request = buildPageDumpRequest(0x20, 10);
      expect(request[4]).toBe(0x20); // Device ID
      expect(request[9]).toBe(10); // Page number
    });
  });

  describe('parseDumpResponse', () => {
    it('should parse valid dump response', () => {
      // Build a mock dump response: F0 <vendor> DevID ModelID CMD ...header... <payload> F7
      const header = new Uint8Array([
        0xf0,
        0x00,
        0x20,
        0x32, // Start + Vendor
        0x00,
        0x0e,
        0x10, // DevID, ModelID, CMD (Dump Response)
        0x00,
        0x01,
        0x00,
        0x0d,
        0x00, // Header bytes
        0x03, // Page number (index 12)
      ]);
      const payload = new Uint8Array([
        0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
      ]);
      const end = new Uint8Array([0xf7]);

      const message = new Uint8Array(
        header.length + payload.length + end.length,
      );
      message.set(header, 0);
      message.set(payload, header.length);
      message.set(end, header.length + payload.length);

      const result = parseDumpResponse(message);
      expect(result).not.toBeNull();
      expect(result?.page).toBe(3);
      expect(result?.payload).toEqual(payload);
    });

    it('should return null for non-dump response', () => {
      const message = new Uint8Array([
        0xf0,
        0x00,
        0x20,
        0x32,
        0x00,
        0x0e,
        0x52, // ACK, not DUMP
        0x00,
        0x50,
        0x52,
        0x45,
        0x53,
        0x45,
        0x54,
        0x53,
        0x00,
        0xf7,
      ]);
      expect(parseDumpResponse(message)).toBeNull();
    });

    it('should return null for short messages', () => {
      const message = new Uint8Array([0xf0, 0x00, 0x20, 0x32, 0xf7]);
      expect(parseDumpResponse(message)).toBeNull();
    });
  });

  describe('stitchPagesToFile', () => {
    it('should concatenate pages and find XSNP', () => {
      // Create pages with XSNP in middle of page 1
      const page0 = new Uint8Array([0x00, 0x01, 0x02, 0x03, 0x04]);
      const page1 = new Uint8Array([
        0x58, 0x53, 0x4e, 0x50, 0x01, 0x00, 0x00, 0x00,
      ]); // XSNP...
      const page2 = new Uint8Array([0x10, 0x11, 0x12, 0x13]);

      const result = stitchPagesToFile([page0, page1, page2]);

      // Should start with XSNP
      expect(result[0]).toBe(0x58);
      expect(result[1]).toBe(0x53);
      expect(result[2]).toBe(0x4e);
      expect(result[3]).toBe(0x50);

      // Should include rest of page1 and page2
      expect(result.length).toBe(8 + 4); // Page1 + page2
    });

    it('should return full data if XSNP not found', () => {
      const page0 = new Uint8Array([0x00, 0x01, 0x02]);
      const page1 = new Uint8Array([0x03, 0x04, 0x05]);

      const result = stitchPagesToFile([page0, page1]);

      expect(result.length).toBe(6);
      expect(result).toEqual(
        new Uint8Array([0x00, 0x01, 0x02, 0x03, 0x04, 0x05]),
      );
    });
  });

  describe('decode7to8 integration', () => {
    it('should properly decode 7-bit payload', () => {
      // DCX encoding format: [msbByte, byte0, byte1, byte2, byte3, byte4, byte5, byte6]
      // MSB byte at index 0 contains bit 7 of each of the 7 data bytes
      // With msbByte = 0, none of the bytes have bit 7 set
      const encoded = new Uint8Array([
        0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06,
      ]);
      const decoded = decode7to8(encoded);

      expect(decoded.length).toBe(7);
      // With msbByte = 0, output should be same as data bytes (indices 1-7)
      expect(decoded[0]).toBe(0x00);
      expect(decoded[1]).toBe(0x01);
      expect(decoded[2]).toBe(0x02);
    });
  });
});

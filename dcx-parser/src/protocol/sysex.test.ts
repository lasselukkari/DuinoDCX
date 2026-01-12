import {describe, it, expect} from 'vitest';
import {SYSEX_END} from '../constants/protocol.js';
import {
  buildPingCommand,
  buildPageDumpRequest,
  buildEditBufferRequest,
  buildRecallCommand,
  buildStoreCommand,
  buildDirectCommand,
  buildDataPacket,
} from '../commands/builders.js';
import {parseMessage, isValidSysex, extractSysexMessages} from './sysex.js';
import {calculateChecksum} from './checksum.js';

describe('sysex', () => {
  describe('buildPingCommand', () => {
    it('should build correct ping command', () => {
      const cmd = buildPingCommand(0x00);
      // Command 0x44 requests status, device responds with 0x04
      // Format: F0 00 20 32 {deviceId} 0E 44 00 00 F7
      expect(cmd).toEqual(
        new Uint8Array([0xf0, 0x00, 0x20, 0x32, 0x00, 0x0e, 0x44, 0x00, 0x00, 0xf7]),
      );
    });
  });

  describe('buildPageDumpRequest', () => {
    it('should build correct page dump request', () => {
      const cmd = buildPageDumpRequest(0x05, 0x01);
      expect(cmd).toEqual(
        new Uint8Array([
          0xf0, 0x00, 0x20, 0x32, 0x01, 0x0e, 0x50, 0x00, 0x00, 0x05, 0xf7,
        ]),
      );
    });

    it('should use default device ID', () => {
      const cmd = buildPageDumpRequest(0x00);
      expect(cmd[4]).toBe(0x00);
    });
  });

  describe('buildEditBufferRequest', () => {
    it('should build correct edit buffer request for part 0', () => {
      const cmd = buildEditBufferRequest(0, 0x00);
      expect(cmd).toEqual(
        new Uint8Array([
          0xf0, 0x00, 0x20, 0x32, 0x00, 0x0e, 0x50, 0x01, 0x00, 0x00, 0xf7,
        ]),
      );
    });

    it('should build correct edit buffer request for part 1', () => {
      const cmd = buildEditBufferRequest(1, 0x00);
      expect(cmd).toEqual(
        new Uint8Array([
          0xf0, 0x00, 0x20, 0x32, 0x00, 0x0e, 0x50, 0x01, 0x00, 0x01, 0xf7,
        ]),
      );
    });
  });

  describe('buildRecallCommand', () => {
    it('should build correct recall command', () => {
      const cmd = buildRecallCommand(10, 0x00);
      expect(cmd).toEqual(
        new Uint8Array([0xf0, 0x00, 0x20, 0x32, 0x00, 0x0e, 0x52, 10, 0xf7]),
      );
    });
  });

  describe('buildStoreCommand', () => {
    it('should build correct store command', () => {
      const cmd = buildStoreCommand(60, 0x00);
      expect(cmd).toEqual(
        new Uint8Array([0xf0, 0x00, 0x20, 0x32, 0x00, 0x0e, 0x53, 60, 0xf7]),
      );
    });
  });

  describe('buildDirectCommand', () => {
    it('should build correct direct command for single parameter', () => {
      const cmd = buildDirectCommand(
        [{channel: 0, param: 1, value: 300}],
        0x00,
      );
      // F0 00 20 32 00 0E 20 01 00 01 02 2C F7
      // 300 = 2 * 128 + 44
      // Hi = 2, Lo = 44 (0x2C)
      expect(cmd).toEqual(
        new Uint8Array([
          0xf0, 0x00, 0x20, 0x32, 0x00, 0x0e, 0x20, 0x01, 0x00, 0x01, 0x02,
          0x2c, 0xf7,
        ]),
      );
    });
  });

  describe('isValidSysex', () => {
    it('should return true for valid message', () => {
      const message = new Uint8Array([
        0xf0, 0x00, 0x20, 0x32, 0x00, 0x0e, 0x40, 0xf7,
      ]);
      expect(isValidSysex(message)).toBe(true);
    });

    it('should return false for too short message', () => {
      const message = new Uint8Array([0xf0, 0xf7]);
      expect(isValidSysex(message)).toBe(false);
    });

    it('should return false for invalid vendor ID', () => {
      const message = new Uint8Array([
        0xf0, 0x00, 0x00, 0x00, 0x00, 0x0e, 0x40, 0xf7,
      ]);
      expect(isValidSysex(message)).toBe(false);
    });
  });

  describe('extractSysexMessages', () => {
    it('should extract multiple messages', () => {
      const data = new Uint8Array([
        0xf0, 0x00, 0x20, 0x32, 0x00, 0x0e, 0x40, 0xf7, 0xf0, 0x00, 0x20, 0x32,
        0x01, 0x0e, 0x40, 0xf7,
      ]);
      const {messages, remaining} = extractSysexMessages(data);
      expect(messages).toHaveLength(2);
      expect(remaining).toHaveLength(0);
    });

    it('should handle incomplete messages', () => {
      const data = new Uint8Array([
        0xf0, 0x00, 0x20, 0x32, 0x00, 0x0e, 0x40, 0xf7, 0xf0, 0x00, 0x20, 0x32,
      ]);
      const {messages, remaining} = extractSysexMessages(data);
      expect(messages).toHaveLength(1);
      expect(remaining).toHaveLength(4);
    });
  });

  describe('parseMessage', () => {
    it('should parse search response', () => {
      const message = new Uint8Array([
        0xf0, 0x00, 0x20, 0x32, 0x00, 0x0e, 0x00, 0x01, 0x01, 0x44, 0x43, 0x58,
        0x32, 0x34, 0x39, 0x36, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20,
        0x20, 0xf7,
      ]);
      const parsed = parseMessage(message);
      expect(parsed?.type).toBe('search');
      if (parsed?.type === 'search') {
        expect(parsed.version).toBe(1.1);
        expect(parsed.name).toBe('DCX2496');
      }
    });

    it('should parse ACK response', () => {
      const message = new Uint8Array([
        0xf0, 0x00, 0x20, 0x32, 0x00, 0x0e, 0x52, 0x01, 0x02, 0xf7,
      ]);
      const parsed = parseMessage(message);
      expect(parsed?.type).toBe('ack');
      if (parsed?.type === 'ack') {
        expect(parsed.payload).toEqual(new Uint8Array([0x01, 0x02]));
      }
    });

    it('should parse page request', () => {
      const message = new Uint8Array([
        0xf0, 0x00, 0x20, 0x32, 0x00, 0x0e, 0x50, 0x00, 0x00, 0x05, 0xf7,
      ]);
      const parsed = parseMessage(message);
      expect(parsed?.type).toBe('pageRequest');
      if (parsed?.type === 'pageRequest') {
        expect(parsed.page).toBe(5);
        expect(parsed.requestType).toBe(0x00);
      }
    });

    it('should parse direct parameter command', () => {
      const message = new Uint8Array([
        0xf0, 0x00, 0x20, 0x32, 0x00, 0x0e, 0x20, 0x01, 0x00, 0x01, 0x02, 0x2c,
        0xf7,
      ]);
      const parsed = parseMessage(message);
      expect(parsed?.type).toBe('direct');
      if (parsed?.type === 'direct') {
        expect(parsed.parameters).toHaveLength(1);
        expect(parsed.parameters[0]).toEqual({
          channel: 0,
          param: 1,
          value: 300,
        });
      }
    });
  });

  describe('buildDataPacket', () => {
    it('should build correct data packet with checksum', () => {
      const data = new Uint8Array([0x01, 0x02, 0x03]);
      const packet = buildDataPacket(0x0c, 5, data, 0x00);

      // Header: F0 00 20 32 00 0E 10
      // Prefix: 00 01 00 0C 00 05
      // Decoded data: 01 02 03
      // Checksum is ONLY calculated on the data portion (index 13+)
      // as per original logic if HEADER_SIZE = 13.
      const dataForChecksum = packet.slice(13, -2);
      const expectedChecksum = calculateChecksum(dataForChecksum);

      expect(packet.slice(0, 7)).toEqual(
        new Uint8Array([0xf0, 0x00, 0x20, 0x32, 0x00, 0x0e, 0x10]),
      );
      expect(packet.slice(7, 13)).toEqual(
        new Uint8Array([0x00, 0x01, 0x00, 0x0c, 0x00, 0x05]),
      );
      expect(packet.at(-2)).toBe(expectedChecksum);
      expect(packet.at(-1)).toBe(SYSEX_END);
    });
  });
});

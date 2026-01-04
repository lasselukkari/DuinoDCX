import {describe, it, expect} from 'vitest';
import {
  buildPingCommand,
  buildPageDumpRequest,
  buildEditBufferRequest,
  buildRecallCommand,
  buildStoreCommand,
  buildDirectCommand,
  parseMessage,
  isValidSysex,
  extractSysexMessages,
  SYSEX_START,
  SYSEX_END,
} from './sysex.js';

describe('sysex', () => {
  describe('buildPingCommand', () => {
    it('should build correct ping command', () => {
      const cmd = buildPingCommand(0x00);
      expect(cmd).toEqual(
        new Uint8Array([0xf0, 0x00, 0x20, 0x32, 0x00, 0x0e, 0x40, 0xf7]),
      );
    });

    it('should use specified device ID', () => {
      const cmd = buildPingCommand(0x05);
      expect(cmd[4]).toBe(0x05);
    });
  });

  describe('buildPageDumpRequest', () => {
    it('should build correct page dump request', () => {
      const cmd = buildPageDumpRequest(3);
      expect(cmd).toEqual(
        new Uint8Array([
          0xf0, 0x00, 0x20, 0x32, 0x00, 0x0e, 0x50, 0x00, 0x00, 0x03, 0xf7,
        ]),
      );
    });

    it('should mask page number to 7 bits', () => {
      const cmd = buildPageDumpRequest(0x8a); // 10001010
      expect(cmd[9]).toBe(0x0a); // Should be masked to 7 bits
    });
  });

  describe('buildEditBufferRequest', () => {
    it('should build part 0 request', () => {
      const cmd = buildEditBufferRequest(0);
      expect(cmd).toEqual(
        new Uint8Array([
          0xf0, 0x00, 0x20, 0x32, 0x00, 0x0e, 0x50, 0x01, 0x00, 0x00, 0xf7,
        ]),
      );
    });

    it('should build part 1 request', () => {
      const cmd = buildEditBufferRequest(1);
      expect(cmd[9]).toBe(0x01);
    });
  });

  describe('buildRecallCommand', () => {
    it('should build recall command for slot 1', () => {
      const cmd = buildRecallCommand(1);
      expect(cmd).toEqual(
        new Uint8Array([0xf0, 0x00, 0x20, 0x32, 0x00, 0x0e, 0x52, 0x01, 0xf7]),
      );
    });
  });

  describe('buildStoreCommand', () => {
    it('should build store command for slot 5', () => {
      const cmd = buildStoreCommand(5);
      expect(cmd).toEqual(
        new Uint8Array([0xf0, 0x00, 0x20, 0x32, 0x00, 0x0e, 0x53, 0x05, 0xf7]),
      );
    });
  });

  describe('buildDirectCommand', () => {
    it('should build direct command with single parameter', () => {
      const cmd = buildDirectCommand([{channel: 1, param: 2, value: 100}]);
      expect(cmd[0]).toBe(SYSEX_START);
      expect(cmd[6]).toBe(0x20); // CMD_DIRECT
      expect(cmd[7]).toBe(1); // Count
      expect(cmd[8]).toBe(1); // Channel
      expect(cmd[9]).toBe(2); // Param
      expect(cmd[10]).toBe(0); // High byte (100 / 128 = 0)
      expect(cmd[11]).toBe(100); // Low byte (100 % 128 = 100)
      expect(cmd.at(-1)).toBe(SYSEX_END);
    });

    it('should build direct command with multiple parameters', () => {
      const cmd = buildDirectCommand([
        {channel: 1, param: 2, value: 100},
        {channel: 5, param: 64, value: 256},
      ]);
      expect(cmd[7]).toBe(2); // Count
    });

    it('should encode values larger than 127', () => {
      const cmd = buildDirectCommand([{channel: 0, param: 0, value: 300}]);
      // 300 = 2 * 128 + 44
      expect(cmd[10]).toBe(2); // High byte
      expect(cmd[11]).toBe(44); // Low byte
    });
  });

  describe('parseMessage', () => {
    it('should parse search response', () => {
      const message = new Uint8Array([
        0xf0,
        0x00,
        0x20,
        0x32,
        0x00,
        0x0e,
        0x00, // Header
        0x01,
        0x10, // Version 1.16
        0x44,
        0x43,
        0x58,
        0x32,
        0x34,
        0x39,
        0x36,
        0x20, // "DCX2496 "
        0x20,
        0x20,
        0x20,
        0x20,
        0x20,
        0x20,
        0x20,
        0x20, // Padding
        0xf7,
      ]);
      const parsed = parseMessage(message);
      expect(parsed?.type).toBe('search');
      if (parsed?.type === 'search') {
        expect(parsed.version).toBe(1.16);
        expect(parsed.name).toBe('DCX2496');
      }
    });

    it('should parse direct command', () => {
      const message = new Uint8Array([
        0xf0,
        0x00,
        0x20,
        0x32,
        0x00,
        0x0e,
        0x20, // Header
        0x01, // Count
        0x01,
        0x02,
        0x00,
        0x64, // Channel=1, param=2, value=100
        0xf7,
      ]);
      const parsed = parseMessage(message);
      expect(parsed?.type).toBe('direct');
      if (parsed?.type === 'direct') {
        expect(parsed.parameters).toHaveLength(1);
        expect(parsed.parameters[0]).toEqual({
          channel: 1,
          param: 2,
          value: 100,
        });
      }
    });

    it('should return undefined for invalid messages', () => {
      expect(parseMessage(new Uint8Array([0x00]))).toBeUndefined();
      expect(parseMessage(new Uint8Array([0xf0, 0x00, 0xf7]))).toBeUndefined();
    });
  });

  describe('isValidSysex', () => {
    it('should validate correct sysex', () => {
      const message = new Uint8Array([
        0xf0, 0x00, 0x20, 0x32, 0x00, 0x0e, 0x40, 0xf7,
      ]);
      expect(isValidSysex(message)).toBe(true);
    });

    it('should reject wrong vendor ID', () => {
      const message = new Uint8Array([
        0xf0, 0x00, 0x00, 0x00, 0x00, 0x0e, 0x40, 0xf7,
      ]);
      expect(isValidSysex(message)).toBe(false);
    });

    it('should reject missing terminator', () => {
      const message = new Uint8Array([
        0xf0, 0x00, 0x20, 0x32, 0x00, 0x0e, 0x40, 0x00,
      ]);
      expect(isValidSysex(message)).toBe(false);
    });
  });

  describe('extractSysexMessages', () => {
    it('should extract multiple messages', () => {
      const buffer = new Uint8Array([
        0xf0, 0x00, 0x20, 0x32, 0x00, 0x0e, 0x40, 0xf7, 0xf0, 0x00, 0x20, 0x32,
        0x00, 0x0e, 0x52, 0x01, 0xf7,
      ]);
      const {messages, remaining} = extractSysexMessages(buffer);
      expect(messages).toHaveLength(2);
      expect(remaining.length).toBe(0);
    });

    it('should handle incomplete messages', () => {
      const buffer = new Uint8Array([
        0xf0,
        0x00,
        0x20,
        0x32,
        0x00,
        0x0e,
        0x40,
        0xf7,
        0xf0,
        0x00,
        0x20, // Incomplete
      ]);
      const {messages, remaining} = extractSysexMessages(buffer);
      expect(messages).toHaveLength(1);
      expect(remaining).toEqual(new Uint8Array([0xf0, 0x00, 0x20]));
    });
  });
});

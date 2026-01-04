import {describe, expect, it} from 'vitest';
import Parser from './parser.ts';

describe('parseDirectCommand', () => {
  it('parses a mute command correctly', () => {
    // DIRECT_COMMAND: mute input A (channel 1, param 3 = mute, value = 1)
    // Header: F0 00 20 32 00 0E 20
    // Count: 01
    // Command: 01 03 00 01 (channel=1, param=3, hi=0, lo=1)
    // Terminator: F7
    const buffer = new Uint8Array([
      0xf0,
      0x00,
      0x20,
      0x32,
      0x00,
      0x0e,
      0x20, // Header
      0x01, // Count = 1
      0x01,
      0x03,
      0x00,
      0x01, // Channel=1, param=3, hi=0, lo=1
      0xf7, // Terminator
    ]);

    const deltas = Parser.parseDirectCommand(buffer);
    expect(deltas).toHaveLength(1);
    expect(deltas[0].group).toBe('inputs');
    expect(deltas[0].channelId).toBe('A');
    expect(deltas[0].property).toBe('mute');
    expect(deltas[0].value).toBe(true);
    expect(deltas[0].rawValue).toBe(1);
  });

  it('parses a gain command correctly', () => {
    // Gain for output 1 (channel 5, param 2 = gain)
    // Gain value: -3.0 dB = raw value 120 (min=-15, step=0.1, so (120 * 0.1) - 15 = -3)
    const buffer = new Uint8Array([
      0xf0,
      0x00,
      0x20,
      0x32,
      0x00,
      0x0e,
      0x20,
      0x01, // Count = 1
      0x05,
      0x02,
      0x00,
      0x78, // Channel=5, param=2, hi=0, lo=120
      0xf7,
    ]);

    const deltas = Parser.parseDirectCommand(buffer);
    expect(deltas).toHaveLength(1);
    expect(deltas[0].group).toBe('outputs');
    expect(deltas[0].channelId).toBe('1');
    expect(deltas[0].property).toBe('gain');
    expect(deltas[0].value).toBeCloseTo(-3, 1);
  });

  it('parses multiple commands correctly', () => {
    const buffer = new Uint8Array([
      0xf0,
      0x00,
      0x20,
      0x32,
      0x00,
      0x0e,
      0x20,
      0x02, // Count = 2
      0x01,
      0x03,
      0x00,
      0x01, // Mute input A
      0x02,
      0x03,
      0x00,
      0x00, // Unmute input B
      0xf7,
    ]);

    const deltas = Parser.parseDirectCommand(buffer);
    expect(deltas).toHaveLength(2);
    expect(deltas[0].channelId).toBe('A');
    expect(deltas[0].value).toBe(true);
    expect(deltas[1].channelId).toBe('B');
    expect(deltas[1].value).toBe(false);
  });

  it('parses setup command correctly', () => {
    // Setup: airTemperature (channel 0, param 11 = airTemperature)
    // Value 45 = 25°C (min=-20, step=1, so 45 - 20 = 25)
    const buffer = new Uint8Array([
      0xf0,
      0x00,
      0x20,
      0x32,
      0x00,
      0x0e,
      0x20,
      0x01,
      0x00,
      0x0b,
      0x00,
      0x2d, // Channel=0, param=11, hi=0, lo=45
      0xf7,
    ]);

    const deltas = Parser.parseDirectCommand(buffer);
    expect(deltas).toHaveLength(1);
    expect(deltas[0].group).toBe('setup');
    expect(deltas[0].property).toBe('airTemperature');
    expect(deltas[0].value).toBe(25);
  });

  it('parses Equalizer command correctly', () => {
    // EQ1 Q for input A (channel 1, param 20)
    // param 19 = EQ1 freq, 20 = EQ1 Q, 21 = EQ1 gain, 22 = EQ1 type, 23 = EQ1 shelving
    const buffer = new Uint8Array([
      0xf0,
      0x00,
      0x20,
      0x32,
      0x00,
      0x0e,
      0x20,
      0x01,
      0x01,
      0x14,
      0x00,
      0x32, // Channel=1, param=20 (0x14), hi=0, lo=50
      0xf7,
    ]);

    const deltas = Parser.parseDirectCommand(buffer);
    expect(deltas).toHaveLength(1);
    expect(deltas[0].group).toBe('inputs');
    expect(deltas[0].channelId).toBe('A');
    expect(deltas[0].eq).toBe(1);
    expect(deltas[0].property).toBe('equalizerQ');
  });

  it('parses output-only command correctly', () => {
    // Output polarity (param 73 = outputCommands[9])
    const buffer = new Uint8Array([
      0xf0,
      0x00,
      0x20,
      0x32,
      0x00,
      0x0e,
      0x20,
      0x01,
      0x05,
      0x49,
      0x00,
      0x01, // Channel=5, param=73 (0x49), hi=0, lo=1
      0xf7,
    ]);

    const deltas = Parser.parseDirectCommand(buffer);
    expect(deltas).toHaveLength(1);
    expect(deltas[0].group).toBe('outputs');
    expect(deltas[0].channelId).toBe('1');
    expect(deltas[0].property).toBe('polarity');
  });

  it('handles high byte values correctly', () => {
    // Long delay for output 1: value > 127 uses high byte
    // Value = 5000 cm = lo=104 (5000 % 128), hi=39 (5000 / 128)
    const buffer = new Uint8Array([
      0xf0,
      0x00,
      0x20,
      0x32,
      0x00,
      0x0e,
      0x20,
      0x01,
      0x05,
      0x05,
      0x27,
      0x68, // Channel=5, param=5 (longDelay), hi=39, lo=104
      0xf7,
    ]);

    const deltas = Parser.parseDirectCommand(buffer);
    expect(deltas).toHaveLength(1);
    expect(deltas[0].rawValue).toBe(104 + 39 * 128); // 5096
  });
});

describe('decode7to8 / encode7to8', () => {
  it('decodes a simple 8-byte group correctly', () => {
    // Input: 7 data bytes (with MSB stripped) + 1 highBits byte
    // Original data: [0x85, 0x42, 0x00, 0x7F, 0xFF, 0x01, 0x80]
    // Encoded: [0x05, 0x42, 0x00, 0x7F, 0x7F, 0x01, 0x00, 0b01010001]
    //           ^MSB=1                ^MSB=1      ^MSB=1  highBits
    const encoded = new Uint8Array([
      0x05,
      0x42,
      0x00,
      0x7f,
      0x7f,
      0x01,
      0x00, // 7 data bytes
      0b0001_0001, // HighBits: bit0=1 (for 0x85), bit4=1 (for 0xFF)
    ]);

    const decoded = Parser.decode7to8(encoded);

    expect(decoded).toHaveLength(7);
    expect(decoded[0]).toBe(0x85); // 0x05 | 0x80
    expect(decoded[1]).toBe(0x42);
    expect(decoded[2]).toBe(0x00);
    expect(decoded[3]).toBe(0x7f);
    expect(decoded[4]).toBe(0xff); // 0x7F | 0x80
    expect(decoded[5]).toBe(0x01);
    expect(decoded[6]).toBe(0x00);
  });

  it('encodes data correctly', () => {
    const raw = new Uint8Array([0x85, 0x42, 0x00, 0x7f, 0xff, 0x01, 0x00]);
    const encoded = Parser.encode7to8(raw);

    expect(encoded).toHaveLength(8);
    expect(encoded[0]).toBe(0x05); // 0x85 & 0x7F
    expect(encoded[4]).toBe(0x7f); // 0xFF & 0x7F
    expect(encoded[7]).toBe(0b0001_0001); // HighBits
  });

  it('roundtrips correctly', () => {
    // Test that encode->decode produces original data
    const original = new Uint8Array([0x00, 0x7f, 0x80, 0xff, 0x55, 0xaa, 0x01]);

    const encoded = Parser.encode7to8(original);
    const decoded = Parser.decode7to8(encoded);

    expect(decoded).toEqual(original);
  });

  it('handles multiple groups', () => {
    // 14 bytes = 2 groups of 7
    const original = new Uint8Array([
      0x80,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00, // Group 1
      0xff,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00, // Group 2
    ]);

    const encoded = Parser.encode7to8(original);
    expect(encoded).toHaveLength(16); // 2 groups × 8 bytes

    const decoded = Parser.decode7to8(encoded);
    expect(decoded).toEqual(original);
  });

  it('pads incomplete groups with zeros when encoding', () => {
    // 5 bytes → 1 group, padded to 7 data bytes
    const raw = new Uint8Array([0x85, 0x42, 0x00, 0x7f, 0xff]);
    const encoded = Parser.encode7to8(raw);

    expect(encoded).toHaveLength(8);
    expect(encoded[5]).toBe(0x00); // Padding
    expect(encoded[6]).toBe(0x00); // Padding
  });
});

describe('parseDumpResponse', () => {
  it('extracts part number and decodes payload', () => {
    // Build a minimal DUMP_RESPONSE message
    // Header (13 bytes): F0 00 20 32 00 0E 10 ... with part=0 at byte 12
    // Payload: one 8-byte group with 7 data bytes + flag byte
    // Terminator: F7
    const header = new Uint8Array([
      0xf0,
      0x00,
      0x20,
      0x32,
      0x00,
      0x0e,
      0x10, // Bytes 0-6
      0x01,
      0x00,
      0x00,
      0x00,
      0x00, // Bytes 7-11
      0x00, // Byte 12 = part 0
    ]);

    // Encoded payload: [0x05, 0x42, 0x00, 0x00, 0x00, 0x00, 0x00, 0b00000001]
    // Decodes to: [0x85, 0x42, 0x00, 0x00, 0x00, 0x00, 0x00]
    const payload = new Uint8Array([
      0x05, 0x42, 0x00, 0x00, 0x00, 0x00, 0x00, 0b0000_0001,
    ]);
    const terminator = new Uint8Array([0xf7]);

    const message = new Uint8Array([...header, ...payload, ...terminator]);

    const {part, values} = Parser.parseDumpResponse(message);

    expect(part).toBe(0);
    expect(values).toHaveLength(7);
    expect(values[0]).toBe(0x85); // MSB restored from flag byte
    expect(values[1]).toBe(0x42);
  });

  it('handles part 1 correctly', () => {
    const header = new Uint8Array([
      0xf0,
      0x00,
      0x20,
      0x32,
      0x00,
      0x0e,
      0x10,
      0x01,
      0x00,
      0x00,
      0x00,
      0x00,
      0x01, // Byte 12 = part 1
    ]);
    const payload = new Uint8Array([
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    ]);
    const terminator = new Uint8Array([0xf7]);

    const message = new Uint8Array([...header, ...payload, ...terminator]);
    const {part} = Parser.parseDumpResponse(message);

    expect(part).toBe(1);
  });
});

describe('encodedToDecodedIndex', () => {
  it('converts encoded positions to decoded indices', () => {
    // Position 117 in raw message:
    // - Payload position: 117 - 13 = 104
    // - Group: 104 / 8 = 13, pos in group: 104 % 8 = 0
    // - Decoded index: 13 * 7 + 0 = 91
    expect(Parser.encodedToDecodedIndex(117)).toBe(91);
  });

  it('returns -1 for positions in header', () => {
    expect(Parser.encodedToDecodedIndex(0)).toBe(-1);
    expect(Parser.encodedToDecodedIndex(12)).toBe(-1);
  });

  it('returns -1 for flag byte positions', () => {
    // Position 20 in raw: payload pos 7, which is flag byte
    // 20 - 13 = 7, 7 % 8 = 7 (flag byte)
    expect(Parser.encodedToDecodedIndex(20)).toBe(-1);

    // Position 28: payload pos 15, 15 % 8 = 7 (flag byte)
    expect(Parser.encodedToDecodedIndex(28)).toBe(-1);
  });

  it('positions 55 and 119 are valid data bytes with header offset', () => {
    // Position 55: payload 42, group 5, pos 2 -> decoded 37
    expect(Parser.encodedToDecodedIndex(55)).toBe(37);

    // Position 119: payload 106, group 13, pos 2 -> decoded 93
    expect(Parser.encodedToDecodedIndex(119)).toBe(93);
  });
});

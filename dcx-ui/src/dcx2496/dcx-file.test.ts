import {describe, it, expect} from 'vitest';
import {
  encode8to7,
  decode7to8,
  parseDcxFile,
  createRestoreHeader,
  createDcxFile,
} from './dcx-file.js';

describe('DCX File Utils', () => {
  it('encodes 8-bit to 7-bit correctly', () => {
    // Test pattern: 0xFF (all 1s) to verify MSB handling
    const input = new Uint8Array([0xff, 0x00, 0x01, 0x80, 0x7f, 0x55, 0xaa]);
    // 7 bytes input -> 1 block of 8 bytes

    const encoded = encode8to7(input);

    expect(encoded.length).toBe(8);

    // Data bytes (low 7 bits) at positions 0-6
    expect(encoded[0]).toBe(0x7f); // 0xFF & 0x7F
    expect(encoded[1]).toBe(0x00);
    expect(encoded[2]).toBe(0x01);
    expect(encoded[3]).toBe(0x00); // 0x80 & 0x7F
    expect(encoded[4]).toBe(0x7f);
    expect(encoded[5]).toBe(0x55);
    expect(encoded[6]).toBe(0x2a); // 0xAA & 0x7F = 0101010 = 0x2A

    // MSB byte at position 7 (end of block):
    // byte 0 (0xFF) has MSB -> bit 0 set
    // byte 1 (0x00) -> bit 1 clear
    // byte 2 (0x01) -> bit 2 clear
    // byte 3 (0x80) -> bit 3 set
    // byte 4 (0x7F) -> bit 4 clear
    // byte 5 (0x55) -> bit 5 clear
    // byte 6 (0xAA) -> bit 6 set (0xAA = 10101010)
    // MSB byte = 1 + 8 + 64 = 73 (0x49)
    expect(encoded[7]).toBe(0x49);
  });

  it('round trips encoding/decoding', () => {
    const input = new Uint8Array(100);
    for (let i = 0; i < 100; i++) input[i] = i; // 0..99

    const encoded = encode8to7(input);
    const decoded = decode7to8(encoded);

    // Decoded might be padded to multiple of 7, so check subarray match
    const result = decoded.subarray(0, input.length);
    expect(result).toEqual(input);
  });

  it('parses XSNP from file data', () => {
    const fileData = new Uint8Array([
      0x00,
      0x00,
      0x00, // Garbage
      88,
      83,
      78,
      80, // XSNP
      0x01,
      0x02, // Data
    ]);

    const parsed = parseDcxFile(fileData.buffer);
    expect(parsed).not.toBeNull();
    expect(parsed.rawData[0]).toBe(88); // X
    expect(parsed.rawData.length).toBe(6); // XSNP + 2 bytes
  });

  it('creates restore header correctly', () => {
    const size = 258; // 0x0102
    const header = createRestoreHeader(size);

    expect(header.length).toBe(7);
    expect(header[0]).toBe(0x02); // 0x02
    expect(header[1]).toBe(0x01); // 0x01
    expect(header[2]).toBe(0x00);
  });
  it('creates .dcx file with correct header structure', () => {
    // Mock payload
    const payload = new Uint8Array([0xaa, 0xbb, 0xcc]);

    const file = createDcxFile(payload);

    // Expected structure:
    // XSNP (4) + Version (4) + Size (4) + Padding (4) + Payload
    expect(file.length).toBe(16 + payload.length);

    // XSNP
    expect(file[0]).toBe(88); // X
    expect(file[1]).toBe(83); // S
    expect(file[2]).toBe(78); // N
    expect(file[3]).toBe(80); // P

    // Version 1.0.0.0
    expect(file[4]).toBe(1);
    expect(file[5]).toBe(0);
    expect(file[6]).toBe(0);
    expect(file[7]).toBe(0);

    // Size (3 bytes) LE
    expect(file[8]).toBe(3);
    expect(file[9]).toBe(0);
    expect(file[10]).toBe(0);
    expect(file[11]).toBe(0); // 4th byte

    // Padding
    expect(file[12]).toBe(0);
    expect(file[13]).toBe(0);
    expect(file[14]).toBe(0);
    expect(file[15]).toBe(0);

    // Payload
    expect(file[16]).toBe(0xaa);
    expect(file[17]).toBe(0xbb);
    expect(file[18]).toBe(0xcc);
  });
});

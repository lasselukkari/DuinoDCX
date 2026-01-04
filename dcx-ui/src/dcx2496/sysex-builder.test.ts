import {describe, it, expect} from 'vitest';
import {
  buildDataPacket,
  buildSyncCommand,
  buildPage0Packet,
} from './sysex-builder.js';
import {calculateChecksum} from './checksum.js';

describe('SysEx Builder', () => {
  it('builds a sync command with correct structure', () => {
    const sync = buildSyncCommand();
    // F0 00 20 32 00 0E 12 00 50 52 45 53 45 54 53 00 00 F7
    expect(sync[0]).toBe(0xf0);
    expect(sync.at(-1)).toBe(0xf7);
    expect(sync[6]).toBe(0x12); // CMD
    expect(sync.length).toBe(18);
  });

  it('builds a data packet with correct checksum', () => {
    // Data: 00 00
    const data = new Uint8Array([0x00, 0x00]);
    const packet = buildDataPacket(0x0c, 0, data, 0);

    // Structure: F0 + Header(12) + Data(2) + CS + F7 = 17 bytes
    expect(packet.length).toBe(1 + 12 + 2 + 2);

    // Verify checksum
    // Data payload in packet is packet.slice(13, -2)
    const payloadStart = 1 + 12; // 13
    const payload = packet.slice(payloadStart, -2);

    const expectedCs = calculateChecksum(payload);
    expect(packet.at(-2)).toBe(expectedCs);
  });

  it('pads page 0 packet to 1000 bytes', () => {
    const data = new Uint8Array([0x01, 0x02, 0x03]);
    const packet = buildPage0Packet(data); // 1000 is window, ignored for now

    // Header(12) + Data(1000) + CS + F0/F7(2) -> wait, header is 12 bytes?
    // BodyHeader in builder: VENDOR(3) + ID(3) + Header(6) = 12 bytes.
    // F0 is byte 0.
    // So payload starts at index 1 + 12 = 13.

    expect(packet.length).toBe(1 + 12 + 1000 + 2);

    // Check padding
    expect(packet[13]).toBe(0x01);
    expect(packet[13 + 3]).toBe(0x00); // Should be 0
    expect(packet[13 + 999]).toBe(0x00);
  });
});

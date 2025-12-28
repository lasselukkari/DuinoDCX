import {calculateChecksum} from './checksum';

const SYSEX_START = 0xf0;
const SYSEX_END = 0xf7;
const VENDOR_ID = [0x00, 0x20, 0x32]; // Behringer
const MODEL_ID = 0x0e;
const CMD_WRITE_DATA = 0x10;
// Const CMD_INIT_SYNC = 0x12;

/**
 * Builds a SysEx packet for sending data pages (CMD 0x10).
 *
 * @param msgType The message type (e.g., 0x0C for data page, 0x01 for header)
 * @param pageNum The page number
 * @param data The data payload (decrypted/encoded as needed)
 * @param padToLength If set, pads the data payload to this length with zeros (before checksum calcs? No, padding is part of data)
 *                    Actually, padding logic is often specific.
 *                    For 0x0C pages, they are usually 1000 bytes.
 */
export function buildDataPacket(
  messageType: number,
  pageNumber: number,
  data: Uint8Array,
  padToLength = 0,
): Uint8Array {
  // Prepare data chunk
  let payload = new Uint8Array(data);
  if (padToLength > 0 && payload.length < padToLength) {
    const padded = new Uint8Array(padToLength);
    padded.set(payload);
    payload = padded;
  }

  // Construct Body for Checksum:
  // VENDOR(3) + [DevID, ModelID, CMD](3) + Header(6) + Data
  // DevID = 0x00 (usually)
  // MsgHeader: 00 01 00 TYPE 00 PAGE

  const bodyHeader = [
    ...VENDOR_ID,
    0x00,
    MODEL_ID,
    CMD_WRITE_DATA, // ID, Model, Cmd
    0x00,
    0x01,
    0x00,
    messageType,
    0x00,
    pageNumber,
  ];

  // Calculate Checksum on Data ONLY?
  // From python script:
  // "1. Sum each byte in DATA ONLY (not header), with each byte incremented by 1"
  // "The data starts at body[12]"

  const checksum = calculateChecksum(payload);

  // Assemble final packet
  // F0 + BodyHeader + Payload + Checksum + F7

  const packetLength = 1 + bodyHeader.length + payload.length + 2; // +1 for F0, +2 for CS+F7
  const packet = new Uint8Array(packetLength);

  packet[0] = SYSEX_START;
  packet.set(bodyHeader, 1);
  packet.set(payload, 1 + bodyHeader.length);
  packet[packet.length - 2] = checksum;
  packet[packet.length - 1] = SYSEX_END;

  return packet;
}

/**
 * Builds the Sync command (CMD 0x12) to initiate restore.
 * Packet: F0 00 20 32 00 0E 12 00 50 52 45 53 45 54 53 00 00 F7
 * Data: 00 "PRESETS" 00 00
 */
export function buildSyncCommand(): Uint8Array {
  // "PRESETS" in hex: 50 52 45 53 45 54 53
  return new Uint8Array([
    0xf0, 0x00, 0x20, 0x32, 0x00, 0x0e, 0x12, 0x00, 0x50, 0x52, 0x45, 0x53,
    0x45, 0x54, 0x53, 0x00, 0x00, 0xf7,
  ]);
}

/**
 * Builds the Header packet (Type 0x01).
 *
 * @param payload The 7-byte header payload (Size + Padding)
 */
export function buildHeaderPacket(payload: Uint8Array): Uint8Array {
  // Header packet is Type 0x01, Page 0.
  // Data payload is simple, no padding usually needed as it's small (7 bytes).
  return buildDataPacket(0x01, 0, payload);
}

/**
 * Builds the page 0 packet (Type 0x0C, Page 0).
 */
export function buildPage0Packet(data: Uint8Array): Uint8Array {
  // Page 0 is usually 1000 bytes padded.
  return buildDataPacket(0x0c, 0, data, 1000);
}

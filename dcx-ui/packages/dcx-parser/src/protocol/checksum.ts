/**
 * DCX2496 SysEx checksum calculation.
 *
 * The DCX2496 uses a NON-STANDARD checksum algorithm:
 * - Sum each data byte PLUS 1 (i.e., sum(byte + 1))
 * - Take the ones complement (~)
 * - Mask to 7 bits (& 0x7F)
 *
 * This is NOT the standard Roland/Behringer formula: (128 - sum%128) & 0x7F
 */

/**
 * Calculate the checksum for DCX2496 SysEx data.
 *
 * @param data - The DATA portion of the packet (packet[13:-2], excluding header and checksum/F7)
 * @returns The 7-bit checksum value
 */
export function calculateChecksum(data: Uint8Array): number {
  let sum = 0;
  for (const byte of data) {
    sum += byte + 1;
  }

  return ~sum & 0x7f;
}

/**
 * Verify the checksum of a complete SysEx packet.
 *
 * Packet structure:
 * [F0] [00 20 32] [DevID] [0E] [CMD] [Header...] [DATA...] [Checksum] [F7]
 *  0     1-3        4      5     6     7-12        13+       -2        -1
 *
 * @param packet - Complete SysEx packet (F0...F7)
 * @returns true if checksum is valid
 */
export function verifyChecksum(packet: Uint8Array): boolean {
  if (packet.length < 15) {
    return false; // Minimum size check
  }

  // Checksum is second-to-last byte (before F7)
  const expectedChecksum = packet.at(-2);
  if (expectedChecksum === undefined) {
    return false;
  }

  // Data portion: bytes 13 to (length - 2)
  const data = packet.slice(13, -2);

  return calculateChecksum(data) === expectedChecksum;
}

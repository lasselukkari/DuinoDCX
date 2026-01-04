/**
 * Calculates the checksum for a DCX2496 SysEx packet.
 * The checksum is calculated by summing all data bytes (plus 1 for each byte),
 * then taking the ones complement of the sum, masked to 7 bits.
 *
 * Formula: (~sum(byte + 1)) & 0x7F
 *
 * @param data The data payload of the SysEx packet (excluding header, checksum, and F7)
 */
export function calculateChecksum(data: Uint8Array): number {
  let sum = 0;
  for (const byte of data) {
    sum += byte + 1;
  }

  return ~sum & 0x7f;
}

/**
 * Verifies the checksum of a complete SysEx packet.
 *
 * @param packet The complete SysEx packet (starting with F0, ending with F7)
 * @returns true if the checksum is correct
 */
export function verifyChecksum(packet: Uint8Array): boolean {
  if (packet.length < 15) return false; // Min size check

  // Last byte is F7, second to last is Checksum
  const expectedChecksum = packet.at(-2);
  if (expectedChecksum === undefined) return false;

  // Data starts after header (approx 13 bytes usually, but depends on message type)
  // For standard dump packets (Type 0x01 or 0x0C):
  // F0 00 20 32 ID 0E CMD 00 01 00 TYPE 00 PAGE [DATA...] CS F7
  // Index 13 is start of data.
  // Data ends at packet.length - 2

  const data = packet.slice(13, -2);

  return calculateChecksum(data) === expectedChecksum;
}

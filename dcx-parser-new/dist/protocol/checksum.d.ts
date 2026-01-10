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
export declare function calculateChecksum(data: Uint8Array): number;
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
export declare function verifyChecksum(packet: Uint8Array): boolean;
//# sourceMappingURL=checksum.d.ts.map
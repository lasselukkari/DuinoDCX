/**
 * 7-bit MIDI-safe encoding/decoding for DCX2496.
 *
 * The DCX2496 uses a specific encoding scheme where 7 data bytes are packed
 * into 8 bytes, with the MSB (most significant bit) of each data byte stored
 * in a separate byte at the END of each 8-byte block.
 *
 * Block format: [data0, data1, data2, data3, data4, data5, data6, msbByte]
 * where msbByte = bit0*data0.msb + bit1*data1.msb + ... + bit6*data6.msb
 */
/**
 * Encode 8-bit data to 7-bit MIDI-safe format.
 * Every 7 input bytes become 8 output bytes.
 *
 * @param data - Raw 8-bit data
 * @returns Encoded 7-bit safe data
 */
/**
 * Decode 7-bit MIDI-safe data back to 8-bit.
 *
 * Mode 1: "Indexed" (default)
 * Maps 8 encoded bytes to 8 decoded bytes.
 * Restores MSBs in the first 7 bytes but KEEPS the flag byte at index 7.
 * Use this for real-time state sync to maintain 1:1 parameter indices.
 *
 * Mode 2: "Raw"
 * Maps 8 encoded bytes to 7 decoded bytes.
 * Restores MSBs and STRIPS the flag byte.
 * Use this for .dcx file storage and preset parsing.
 */
export type DecodeOptions = {
    indexed: boolean;
};
export declare function decode7to8(data: Uint8Array, options?: DecodeOptions): Uint8Array;
export type EncodeOptions = {
    indexed: boolean;
};
/**
 * Encode 8-bit data to 7-bit MIDI-safe format.
 */
export declare function encode8to7(data: Uint8Array, options?: EncodeOptions): Uint8Array;
//# sourceMappingURL=encoding.d.ts.map
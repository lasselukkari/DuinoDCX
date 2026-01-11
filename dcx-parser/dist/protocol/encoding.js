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
const DEFAULT_DECODE_OPTIONS = { indexed: true };
export function decode7to8(data, options = DEFAULT_DECODE_OPTIONS) {
    const numberBlocks = Math.floor(data.length / 8);
    const resultLength = options.indexed ? data.length : numberBlocks * 7;
    const result = new Uint8Array(resultLength);
    for (let block = 0; block < numberBlocks; block++) {
        const srcStart = block * 8;
        const dstStart = options.indexed ? block * 8 : block * 7;
        const msbByte = data[srcStart + 7];
        for (let i = 0; i < 7; i++) {
            let byte = data[srcStart + i];
            if (msbByte & (1 << i)) {
                byte |= 0x80;
            }
            result[dstStart + i] = byte;
        }
        if (options.indexed) {
            result[dstStart + 7] = msbByte;
        }
    }
    // Handle any remaining bytes in indexed mode
    if (options.indexed && data.length % 8 !== 0) {
        const offset = numberBlocks * 8;
        for (let i = offset; i < data.length; i++) {
            result[i] = data[i];
        }
    }
    return result;
}
const DEFAULT_ENCODE_OPTIONS = { indexed: false };
/**
 * Encode 8-bit data to 7-bit MIDI-safe format.
 */
export function encode8to7(data, options = DEFAULT_ENCODE_OPTIONS) {
    if (options.indexed) {
        const outputLength = data.length;
        const result = new Uint8Array(outputLength);
        const numberFullBlocks = Math.floor(data.length / 8);
        for (let block = 0; block < numberFullBlocks; block++) {
            const start = block * 8;
            // Start with the existing data in the flag byte position (the 8th byte)
            let msbByte = data[start + 7];
            for (let i = 0; i < 7; i++) {
                const byte = data[start + i];
                result[start + i] = byte & 0x7f; // Strip MSB for MIDI safety
                if (byte & 0x80) {
                    msbByte |= 1 << i; // Store MSB in the flags byte
                }
            }
            result[start + 7] = msbByte; // Store merged flag byte
        }
        // Copy remaining bytes
        if (data.length % 8 !== 0) {
            const offset = numberFullBlocks * 8;
            for (let i = offset; i < data.length; i++) {
                result[i] = data[i] & 0x7f;
            }
        }
        return result;
    }
    // Raw mode (7 bytes -> 8 bytes)
    const numberBlocks = Math.ceil(data.length / 7);
    const result = new Uint8Array(numberBlocks * 8);
    for (let block = 0; block < numberBlocks; block++) {
        let msbByte = 0;
        const srcStart = block * 7;
        const dstStart = block * 8;
        for (let i = 0; i < 7; i++) {
            const srcIdx = srcStart + i;
            if (srcIdx < data.length) {
                const byte = data[srcIdx];
                result[dstStart + i] = byte & 0x7f;
                if (byte & 0x80) {
                    msbByte |= 1 << i;
                }
            }
            else {
                result[dstStart + i] = 0;
            }
        }
        result[dstStart + 7] = msbByte;
    }
    return result;
}
//# sourceMappingURL=encoding.js.map
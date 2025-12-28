/**
 * DCX2496 File Utilities
 * Handles parsing of .dcx files and 7-bit/8-bit encoding conversion.
 */

// XSNP magic signature
const XSNP_SIGNATURE = new TextEncoder().encode('XSNP');

/**
 * Encodes 8-bit data into 7-bit MIDI data format used by DCX2496.
 * NOTE: DCX2496 uses MSB byte at END of each 8-byte block, not at the beginning!
 * Block format: [7 data bytes] [1 MSB byte]
 *
 * 7 input bytes -> 8 output bytes (data + MSB)
 */
export function encode8to7(data: Uint8Array): Uint8Array {
  const srcLength = data.length;
  // Calculate destination length: ceil(srcLen / 7) * 8
  const dstLength = Math.ceil(srcLength / 7) * 8;
  const result = new Uint8Array(dstLength);

  let srcIdx = 0;
  let dstIdx = 0;

  while (srcIdx < srcLength) {
    // Process 7-byte chunk
    const chunkLength = Math.min(7, srcLength - srcIdx);
    const chunk = data.subarray(srcIdx, srcIdx + chunkLength);

    // MSB byte stores the high bits from each of the 7 data bytes
    let msbByte = 0;

    for (let i = 0; i < chunkLength; i++) {
      if (chunk[i] & 0x80) {
        msbByte |= 1 << i;
      }

      // Output the low 7 bits at positions 0-6
      result[dstIdx + i] = chunk[i] & 0x7f;
    }

    // Write MSB byte at END of block (position 7)
    result[dstIdx + 7] = msbByte;

    srcIdx += 7;
    dstIdx += 8;
  }

  return result;
}

/**
 * Decodes 7-bit encoded data back to 8-bit.
 * NOTE: DCX2496 uses MSB byte at END of each 8-byte block, not at the beginning!
 * Block format: [7 data bytes] [1 MSB byte]
 */
export function decode7to8(data: Uint8Array): Uint8Array {
  const srcLength = data.length;

  // Max output length
  const dstLength = Math.floor(srcLength / 8) * 7;
  const buffer = new Uint8Array(dstLength);

  let srcIdx = 0;
  let dstIdx = 0;

  while (srcIdx + 8 <= srcLength) {
    // MSB byte is at the END of the 8-byte block (position 7)
    const msbByte = data[srcIdx + 7];

    for (let i = 0; i < 7; i++) {
      // Data bytes are at positions 0-6
      let byte = data[srcIdx + i];

      // Apply MSB if set
      if (msbByte & (1 << i)) {
        byte |= 0x80;
      }

      buffer[dstIdx + i] = byte;
    }

    srcIdx += 8;
    dstIdx += 7;
  }

  return buffer;
}

export type DcxFile = {
  rawHeader: Uint8Array; // 14 bytes (size + padding + 'XSNP' + padding) or just data up to XSNP?
  // Actually, python script says: "Format: Size (2 bytes LE) + 5 bytes padding".
  // THEN 'XSNP'.
  // Let's just store the meaningful payload.
  data: Uint8Array; // The actual preset data (starting after XSNP usually)
};

/**
 * Parses a loaded .dcx file content.
 */
export function parseDcxFile(fileBuffer: ArrayBuffer): {
  rawData: Uint8Array;
  headerPayload: Uint8Array;
  encodedFull: Uint8Array;
} {
  const bytes = new Uint8Array(fileBuffer);

  // Find XSNP
  let offset = -1;
  for (let i = 0; i < bytes.length - 4; i++) {
    if (
      bytes[i] === 88 &&
      bytes[i + 1] === 83 &&
      bytes[i + 2] === 78 &&
      bytes[i + 3] === 80
    ) {
      // XSNP
      offset = i;
      break;
    }
  }

  if (offset === -1) {
    throw new Error('Invalid DCX file: XSNP signature not found');
  }

  // Raw data starts after XSNP (offset + 4)?
  // Wait, let's look at the file format again.
  // The Python script says: "Format: Size (2 bytes LE) + 5 bytes padding + XSNP + Data".
  // Or does XSNP come first?
  // "XSNP" signature is usually at the start or after a header?
  // Let's assume the file *contains* the data we need.
  // The previous implementation assumed everything AFTER XSNP is the data.
  // Let's stick to that: rawData is everything from offset usually?
  // Actually, `parseDcxFile` in previous `dcx-file.ts` returned `bytes.slice(offset)`.
  // If offset points to 'X', then it included 'XSNP...'.

  // Let's refine based on "XSNP" being the start of the *preset data structure*.
  const rawData = bytes.slice(offset);

  // Create the 7-byte size header
  // The size header contains the length of the *raw encoded data*? Or raw decoded data?
  // Python script: "header = struct.pack('<H', len(data)) + b'\x00'*5"
  // "data" here is the raw binary data (starts with XSNP).

  const headerPayload = createRestoreHeader(rawData.length);

  // Encode the data (8-bit to 7-bit)
  // The data to encode is the raw XSNP blob.
  // Wait, does the DCX want the 7-byte size header ENCODED too?
  // Python script:
  // "payload = header + data"
  // "encoded_payload = encode_data(payload)"
  // So YES, the size header stays part of the 8-bit stream which gets 7-bit encoded.

  const fullPayload = new Uint8Array(headerPayload.length + rawData.length);
  fullPayload.set(headerPayload);
  fullPayload.set(rawData, headerPayload.length);

  const encodedFull = encode8to7(fullPayload);

  return {
    rawData,
    headerPayload,
    encodedFull,
  };
}

/**
 * Prepares the 7-byte preamble header for restoring.
 * Format from python: Size (2 bytes LE) + 5 bytes padding (0x00)
 */
export function createRestoreHeader(dataSize: number): Uint8Array {
  const header = new Uint8Array(7);
  header[0] = dataSize & 0xff;
  header[1] = (dataSize >> 8) & 0xff;
  // Remaining bytes are 0
  return header;
}

/**
 * Creates a .dcx file buffer from raw device data.
 * Prepends the XSNP signature and necessary padding.
 *
 * Based on observed format:
 * Header: XSNP (4 bytes)
 * Version?: 01 00 00 00 (4 bytes)
 * Size: 4 bytes Little Endian (size of what?) -> Let's use payload size for now?
 * Padding: 4 bytes (00 00 00 00)
 * Data...
 *
 * However, existing tools expect XSNP signature to locate data.
 * RestoreProcess expects to find XSNP and takes everything AFTER it as data.
 * So to be compatible with OUR RestoreProcess, we just need:
 * [Prefix...] XSNP [Data]
 *
 * Let's replicate the header from current_device.dcx strictly:
 * XSNP + 0x00...00 ?
 *
 * Actually, checking hexdump:
 * 00000000  58 53 4e 50 01 00 00 00  c6 26 00 00 00 00 00 00  |XSNP.....&......|
 *
 * That matches:
 * XSNP (4)
 * Version (4)
 * Size (4)
 * Padding (4)
 */
export function createDcxFile(data: Uint8Array): Uint8Array {
  const XSNP = XSNP_SIGNATURE; // Uint8Array [88, 83, 78, 80]
  const VERSION = new Uint8Array([1, 0, 0, 0]);

  // Size: 4 bytes LE
  // current_device.dcx had 0x26c6 => 9926.
  // File size 9942. Header size = 16. 9926 + 16 = 9942.
  // So Size = Data Length.
  const size = data.length;
  const SIZE_BYTES = new Uint8Array([
    size & 0xff,
    (size >> 8) & 0xff,
    (size >> 16) & 0xff,
    (size >> 24) & 0xff,
  ]);

  const PADDING = new Uint8Array([0, 0, 0, 0]);

  const fileLength = 4 + 4 + 4 + 4 + data.length;
  const file = new Uint8Array(fileLength);

  let offset = 0;
  file.set(XSNP, offset);
  offset += 4;
  file.set(VERSION, offset);
  offset += 4;
  file.set(SIZE_BYTES, offset);
  offset += 4;
  file.set(PADDING, offset);
  offset += 4;
  file.set(data, offset);

  return file;
}

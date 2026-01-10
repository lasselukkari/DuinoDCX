import * as fs from 'node:fs';
import * as path from 'node:path';
import {decode7to8} from '../protocol/encoding.js';

const SYSEX_FILE = path.join(
  process.cwd(),
  'test-data/verification/preset_00.sysex',
);

function main() {
  console.log(`Reading ${SYSEX_FILE}...`);
  const data = fs.readFileSync(SYSEX_FILE);

  // Find F0
  let start = -1;
  for (let i = 0; i < data.length; i++) {
    if (
      data[i] === 0xf0 &&
      data[i + 1] === 0x00 &&
      data[i + 2] === 0x20 &&
      data[i + 3] === 0x32
    ) {
      start = i;
      break;
    }
  }

  if (start === -1) {
    console.error('No valid SysEx start found');
    return;
  }

  // Header is 14 bytes? F0 00 20 32 0B 0E 10 01 ...
  // Actually the payload starts after the command byte.
  // Let's assume the payload is everything between start+14 and end-2.
  // Based on dump-verification-data.ts: buffer.slice(13, -1)

  const payload = data.subarray(start + 13, -1); // Skip checksum?

  // Try decoding
  console.log(`Decoding payload of size ${payload.length}...`);
  const decoded = decode7to8(payload, {indexed: false}); // Use raw mode for presets

  console.log(`Decoded size: ${decoded.length}`);

  // Search for 300 (0x012C)
  // LE: 2C 01
  // BE: 01 2C

  console.log('\nSearching for 300 (0x012C):');
  for (let i = 0; i < decoded.length - 1; i++) {
    const valueLE = decoded[i] | (decoded[i + 1] << 8);
    // Const valBE = (decoded[i] << 8) | decoded[i + 1];

    if (valueLE === 300) {
      console.log(`  Found LE 300 at offset ${i}`);
      // Print surrounding bytes
      const start = Math.max(0, i - 4);
      const end = Math.min(decoded.length, i + 6);
      const chunk = decoded.subarray(start, end);
      console.log(`    Context: ${Buffer.from(chunk).toString('hex')}`);
    }
  }

  // Save to file for inspection
  fs.writeFileSync(
    path.join(process.cwd(), 'test-data/verification/preset_00_decoded_js.bin'),
    decoded,
  );
}

main();

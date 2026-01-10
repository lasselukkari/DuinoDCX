import * as fs from 'node:fs';
import * as path from 'node:path';
import {decode7to8} from '../protocol/encoding.js';

const SYSEX_FILE = path.join(
  process.cwd(),
  'test-data/verification/edit_buffer.sysex',
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

  // Edit Buffer dump might be split into parts?
  // dump-verification-data.ts concatenated them.
  // Each part has header/footer.
  // If concatenated raw sysex messages, decode7to8 might fail if treated as one block.
  // simpler: scan for F0...F7 blocks and decode each.

  let offset = 0;
  const decodedParts: Uint8Array[] = [];

  while (offset < data.length) {
    // Find next F0
    const f0 = data.indexOf(0xf0, offset);
    if (f0 === -1) break;

    const f7 = data.indexOf(0xf7, f0);
    if (f7 === -1) break;

    // Check if it's Edit Buffer Dump (CMD 0x10 or similar?)
    // Header: F0 00 20 32 ID 0E 10 (Dump Edit Buffer)
    // Part 0: ... 00 ...
    // Part 1: ... 01 ...

    const payload = data.subarray(f0 + 13, f7 - 1); // Approximate payload location
    // Note: verify header length.
    // 0xF0, 0x00, 0x20, 0x32, 0x00, 0x0E, 0x00, 0x00 ... (13 bytes?)

    console.log(`Found SysEx block at ${f0}, payload size ${payload.length}`);
    const decoded = decode7to8(payload, {indexed: true}); // Edit buffer uses INDEXED mode
    decodedParts.push(decoded);

    offset = f7 + 1;
  }

  const fullDecoded = Buffer.concat(decodedParts);
  console.log(`Total decoded size: ${fullDecoded.length}`);

  fs.writeFileSync(
    path.join(
      process.cwd(),
      'test-data/verification/edit_buffer_decoded_new.bin',
    ),
    fullDecoded,
  );

  // Search for 300 (0x012C)
  console.log('\nSearching for 300 (0x012C) in Edit Buffer:');
  for (let i = 0; i < fullDecoded.length - 1; i++) {
    const valueLE = fullDecoded[i] | (fullDecoded[i + 1] << 8);

    if (valueLE === 300) {
      console.log(`  Found LE 300 at offset ${i}`);
      const start = Math.max(0, i - 4);
      const end = Math.min(fullDecoded.length, i + 6);
      const chunk = fullDecoded.subarray(start, end);
      console.log(`    Context: ${Buffer.from(chunk).toString('hex')}`);
    }
  }
}

main();

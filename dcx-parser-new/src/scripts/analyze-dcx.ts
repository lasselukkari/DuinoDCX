import * as fs from 'node:fs';
import * as path from 'node:path';

function analyzeDcx(filename: string) {
  const buffer = fs.readFileSync(path.join(process.cwd(), filename));
  console.log(`Analyzing ${filename}: ${buffer.length} bytes`);

  // Look for signatures
  const signatures = ['XPCR', 'XSNP', 'XPRB', 'XCUR'];

  for (const sig of signatures) {
    let count = 0;
    let lastOffset = -1;
    for (let i = 0; i < buffer.length - 4; i++) {
      if (
        buffer[i] === sig.charCodeAt(0) &&
        buffer[i + 1] === sig.charCodeAt(1) &&
        buffer[i + 2] === sig.charCodeAt(2) &&
        buffer[i + 3] === sig.charCodeAt(3)
      ) {
        count++;
        if (lastOffset === -1) console.log(`Found first ${sig} at offset ${i}`);
        lastOffset = i;
      }
    }

    if (count > 0) console.log(`Total ${sig} count: ${count}`);
  }

  // Check for SysEx headers (0xF0 0x00 0x20 0x32)
  const SYSEX_START = [0xf0, 0x00, 0x20, 0x32];
  let sysexCount = 0;
  for (let i = 0; i < buffer.length - 4; i++) {
    if (
      buffer[i] === SYSEX_START[0] &&
      buffer[i + 1] === SYSEX_START[1] &&
      buffer[i + 2] === SYSEX_START[2] &&
      buffer[i + 3] === SYSEX_START[3]
    ) {
      sysexCount++;
      if (sysexCount <= 3) console.log(`SysEx start at offset ${i}`);
    }
  }

  console.log(`Total SysEx messages: ${sysexCount}`);

  // Check specific offsets
  console.log('Byte at 30:', buffer[30]);
  console.log('Byte at 37:', buffer[37]);
  console.log('Hex Dump 30-150:');
  let line = '';
  for (let i = 30; i < 150; i++) {
    line += buffer[i].toString(16).padStart(2, '0') + ' ';
    if ((i - 30 + 1) % 16 === 0) {
      console.log(line);
      line = '';
    }
  }

  console.log(line);
  // Pattern for Setup:
  // DelayUnits (U16): 00 00 | 01 00 | 02 00
  // Mute (U16): 00 00 | 01 00
  // Skip 48 bytes
  // OutConfig (U16): 00..05 00

  console.log('Scanning for Setup pattern...');
  for (let i = 20; i < 200; i++) {
    const u1 = buffer[i];
    const u2 = buffer[i + 1];
    const m1 = buffer[i + 2];
    const m2 = buffer[i + 3];

    if (u1 <= 2 && u2 === 0 && m1 <= 1 && m2 === 0) {
      console.log(
        `Potential Setup start at ${i}: DelayUnits=${u1}, Mute=${m1}`,
      );
    }
  }
}

analyzeDcx('src/fixtures/current.dcx');

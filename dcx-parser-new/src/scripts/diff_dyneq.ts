import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {decode7to8} from '../protocol/encoding.js';

async function main() {
  const f1 = await readFile(
    path.join(process.cwd(), 'test-data/verification/preset_dyneq_on.sysex'),
  );
  const f2 = await readFile(
    path.join(process.cwd(), 'test-data/verification/preset_00.sysex'),
  );

  const d1 = decode7to8(f1.subarray(f1.indexOf(0xf0) + 13, -1), {
    indexed: false,
  });
  const d2 = decode7to8(f2.subarray(f2.indexOf(0xf0) + 13, -1), {
    indexed: false,
  });

  console.log('--- DIFF REPORT (Input A: 121..160) ---');
  // Align to 121
  for (let i = 121; i < 160; i++) {
    if (d1[i] !== d2[i]) {
      const rel = i - 121;
      console.log(
        `Offset ${i} (Input+${rel}): ${d1[i].toString(16)} -> ${d2[i].toString(16)}`,
      );
    }
  }
}

main();

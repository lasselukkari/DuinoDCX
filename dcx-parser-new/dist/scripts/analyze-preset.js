import * as fs from 'node:fs';
import * as path from 'node:path';
import { decode7to8 } from '../protocol/encoding.js';
function readHex(filename) {
    const raw = fs.readFileSync(path.join(process.cwd(), 'test-data', filename), 'utf8');
    const clean = raw.replaceAll(/[^\dA-Fa-f]/g, '');
    const bytes = new Uint8Array(clean.length / 2);
    for (let i = 0; i < clean.length; i += 2)
        bytes[i / 2] = Number.parseInt(clean.substring(i, i + 2), 16);
    // Strip header/footer (approx 13 chars header, 2 footer if it matches edit buffer)
    // But let's look at raw bytes around offset 13
    return bytes.slice(13, -2);
}
const page0 = readHex('page_00.hex');
const page1 = readHex('page_01.hex');
const dec0 = decode7to8(page0, { indexed: false });
const dec1 = decode7to8(page1, { indexed: false });
const full = new Uint8Array(dec0.length + dec1.length);
full.set(dec0);
full.set(dec1, dec0.length);
console.log('Full length:', full.length);
console.log('dec0 length:', dec0.length);
console.log('dec1 length:', dec1.length);
console.log('Header check (offset 7):', new TextDecoder().decode(full.slice(7, 11)));
// Check offsets for potential Setup/Input data
// Edit Buffer:
// XPCR at 7.
// Setup starts at offset 1 (relative to decoded buffer).
// delayUnits at 1 + 36 = 37 (raw 8-bit offset from start of sequential read)
// Wait, SETUP_PARAMS starts with 18 nulls (36 bytes).
// So delayUnits is at 1 + 36 = 37.
// Let's check bytes at 37, 38, etc.
// And check for strings at header positions.
function printString(offset, length) {
    const s = new TextDecoder().decode(full.slice(offset, offset + length));
    console.log(`String at ${offset}: "${s.replaceAll('\0', '.')}"`);
}
printString(7, 4); // Signature
printString(7 + 34, 8); // Device Name?
printString(7 + 72, 8); // Preset Name?
console.log('Byte at 37 (DelayUnits?):', full[37]);
console.log('Short at 117 (Input A Gain?):', full[117], full[118]); // Input A Start
//# sourceMappingURL=analyze-preset.js.map
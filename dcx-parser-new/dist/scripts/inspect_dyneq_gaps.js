import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { decode7to8 } from '../protocol/encoding.js';
async function main() {
    const file = path.join(process.cwd(), 'test-data/verification/preset_00.sysex');
    const data = await readFile(file);
    // Find payload
    const start = data.indexOf(0xf0);
    const payload = data.subarray(start + 13, -1);
    const decoded = decode7to8(payload, { indexed: false });
    // Input A Start: 121 (approx) - actually Header + 114?
    // Header XSNP is at 7 (after preamble).
    // XSNP is 76 bytes?
    // Let's rely on my preset-parser finding: Offset 114 relative to XSNP.
    // XSNP starts at offset 7 in decoded? No, decoded has no preamble?
    // Wait. My parser finds XSNP signature.
    // Let's just look at the large chunk.
    // Input A DynEQ starts at ~121 + 14 = 135.
    // Offsets based on 121 Start:
    const base = 121;
    const offsets = {
        'On (+20)': base + 20,
        'Thresh (+22)': base + 22,
        'GAP (+24)': base + 24,
        'Freq (+26)': base + 26,
        'Gain (+28)': base + 28,
        'GAP (+30)': base + 30,
        'GAP (+32)': base + 32,
        'EQ1 (+34)': base + 34,
    };
    console.log('--- Inspecting Input A DynEQ Block ---');
    for (const [name, off] of Object.entries(offsets)) {
        const value = decoded[off] | (decoded[off + 1] << 8);
        console.log(`${name} @ ${off}: ${value} (0x${value.toString(16)})`);
    }
}
main();
//# sourceMappingURL=inspect_dyneq_gaps.js.map
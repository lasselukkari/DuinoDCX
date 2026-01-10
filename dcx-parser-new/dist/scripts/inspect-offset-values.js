import * as fs from 'node:fs';
import * as path from 'node:path';
import { decode7to8 } from '../protocol/encoding.js';
const SYSEX_FILE = path.join(process.cwd(), 'test-data/verification/preset_00.sysex');
function main() {
    const data = fs.readFileSync(SYSEX_FILE);
    let start = -1;
    for (let i = 0; i < data.length; i++) {
        if (data[i] === 0xf0 &&
            data[i + 1] === 0x00 &&
            data[i + 2] === 0x20 &&
            data[i + 3] === 0x32) {
            start = i;
            break;
        }
    }
    const payload = data.subarray(start + 13, -1);
    const decoded = decode7to8(payload, { indexed: false });
    // Const inputA = 121;
    console.log(`--- Values in Preset 00 ---`);
    const offsets = [
        { off: 121, name: 'Input A Gain' },
        { off: 143, name: 'DynEQ On/Off (+22)' },
        { off: 149, name: 'DynEQ Gain (+28)' },
        { off: 159, name: 'EQ1 Gain (+38)' },
    ];
    for (const item of offsets) {
        const value = decoded[item.off] | (decoded[item.off + 1] << 8);
        console.log(`Offset ${item.off} (${item.name}): ${value} (0x${value.toString(16)})`);
    }
}
main();
//# sourceMappingURL=inspect-offset-values.js.map
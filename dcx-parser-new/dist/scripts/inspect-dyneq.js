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
    // Input A starts at 121.
    const inputA = 121;
    console.log(`Input A Start: ${inputA}`);
    // Check DynEQ params
    const dynEqOnOffset = inputA + 22; // 143
    const dynEqGainOffset = inputA + 28; // 149
    const onValue = decoded[dynEqOnOffset] | (decoded[dynEqOnOffset + 1] << 8);
    const gainVal = decoded[dynEqGainOffset] | (decoded[dynEqGainOffset + 1] << 8);
    console.log(`Offset ${dynEqOnOffset} (DynEQ On?): ${onValue} (0x${onValue.toString(16)})`);
    console.log(`Offset ${dynEqGainOffset} (DynEQ Gain?): ${gainVal} (0x${gainVal.toString(16)})`);
    // Context around 149
    console.log(`Context 140-160:`);
    console.log(Buffer.from(decoded.subarray(140, 160)).toString('hex'));
}
main();
//# sourceMappingURL=inspect-dyneq.js.map
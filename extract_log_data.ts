import * as fs from 'fs';
import * as path from 'path';

const LOG_FILE = '/Users/lasselukkari/Documents/DuinoDCX/dcx-parser-new/src/fixtures/factory-presets.log';
const OUT_DIR = '/Users/lasselukkari/Documents/DuinoDCX/dcx-parser-new/src/fixtures';

const content = fs.readFileSync(LOG_FILE, 'utf-8');
const lines = content.split('\n');

let pendingType: 'preset' | 'current' | null = null;
let pendingIndex = -1;


let dumpCounter = 0;

for (const line of lines) {
    // Check for Request
    // [20:01:30.857] APP->DEV [  11] F0 00 20 32 00 0E 50 00 00 00 F7
    const reqMatch = line.match(/APP->DEV.*F0 00 20 32 00 0E 50 (..) (..) (..) F7/);
    if (reqMatch) {
        const p1 = parseInt(reqMatch[1], 16);
        const p2 = parseInt(reqMatch[2], 16);
        const p3 = parseInt(reqMatch[3], 16);

        if (p1 === 0x00 && p2 === 0x00) {
            // Presets 00-0B
            pendingType = 'preset';
            pendingIndex = p3;
        } else if (p1 === 0x01 && p2 === 0x00) {
            // Current State 00-01
            pendingType = 'current';
            pendingIndex = p3;
            // Increment dump counter when starting a new sequence (Part 0)
            if (p3 === 0) {
                dumpCounter++;
            }
        } else {
            pendingType = null;
        }
        continue;
    }

    // Check for Response
    const resMatch = line.match(/DEV->APP \[\s*\d+\] (F0.*F7)/);
    if (resMatch && pendingType) {
        const hexData = resMatch[1];

        let filename = '';
        if (pendingType === 'preset') {
            filename = `presets-hex-${pendingIndex}.txt`;
        } else if (pendingType === 'current') {
            filename = `current-state-${pendingIndex}-dump${dumpCounter}.txt`;
        }

        if (filename) {
            const filePath = path.join(OUT_DIR, filename);
            fs.writeFileSync(filePath, hexData);
            console.log(`Created ${filename}`);
        }

        // Reset after handling
        pendingType = null;
        pendingIndex = -1;
    }
}

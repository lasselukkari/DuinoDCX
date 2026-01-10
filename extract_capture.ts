import * as fs from 'node:fs';
import * as path from 'node:path';

const CAPTURE_FILE = path.join(process.cwd(), 'capture.log');
const OUTPUT_DIR = path.join(process.cwd(), 'dcx-parser-new/test-data/capture-2026-01-08');

if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const content = fs.readFileSync(CAPTURE_FILE, 'utf8');
const lines = content.split('\n');

let currentPage = -1;

for (const line of lines) {
    // Look for DUMP_REQ to identify the page number
    // [01:14:30.986]   >> DUMP_REQ dev=0 model=0x0E params=000000
    const reqMatch = line.match(/>> DUMP_REQ.*params=([0-9A-Fa-f]+)/);
    if (reqMatch) {
        const params = reqMatch[1];
        // params is hex, verify it's a page dump request
        // The last byte seems to be the page number based on logs?
        // DUMP_REQ params=000000 -> Page 0
        // DUMP_REQ params=000001 -> Page 1
        // DUMP_REQ params=010000 -> This looks different? Wait.

        // Let's decode the params string to bytes
        const pBytes = [];
        for (let i = 0; i < params.length; i += 2) {
            pBytes.push(parseInt(params.substr(i, 2), 16));
        }

        // Command 0x50 (DUMP_REQ) structure? 
        // Usually arguments are passed.
        // Based on logs:
        // 50 00 00 00 -> Page 0
        // 50 00 00 01 -> Page 1
        // ...
        // 50 00 00 0A -> Page 10
        // 50 01 00 00 -> This is likely something else? or Page 0 of Bank 1?
        // The previous logs showed pages 0-10 being requested sequentially 00 00 00 to 00 00 0A.
        // Let's stick to the page number from the last byte if the first two are 00 00.

        if (pBytes[0] === 0 && pBytes[1] === 0) {
            currentPage = pBytes[2];
            console.log(`Expecting Page ${currentPage}`);
        } else {
            console.log(`Unknown request params: ${params}`);
            currentPage = -1;
        }
    }

    // Look for DEV->APP lines with DUMP_RESP
    // [01:14:31.435] DEV->APP [1015] F0 00 ... F7
    if (line.includes('DEV->APP') && currentPage !== -1) {
        const hexMatch = line.match(/F0 [0-9A-Fa-f ]+ F7/);
        if (hexMatch) {
            const hexString = hexMatch[0].replace(/\s/g, '');

            // Verify it's a DUMP_RESP (Command 0x10 is often header, but let's check the log description)
            // The log says: >> DUMP_RESP ...
            // If the previous line was DUMP_REQ for page X, and this is a long message, it's likely the dump.

            // Basic length check for a page dump (approx 1015 bytes encoded)
            if (hexString.length > 2000) {
                const filename = path.join(OUTPUT_DIR, `page_${currentPage.toString().padStart(2, '0')}.hex`);
                fs.writeFileSync(filename, hexString);
                console.log(`Saved ${filename} (${hexString.length / 2} bytes)`);
                currentPage = -1; // Reset
            }
        }
    }
}

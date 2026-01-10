import * as fs from 'node:fs';
import * as path from 'node:path';

// Adjust paths as needed based on where this script is run
const LOG_FILE = path.join(process.cwd(), 'dcx-ui/packages/dcx-parser/src/fixtures/factory-default-presets.log');
const OUTPUT_DIR = path.join(process.cwd(), 'dcx-parser-new/test-data/golden-master');

if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Check if log file exists
if (!fs.existsSync(LOG_FILE)) {
    console.error(`Log file not found: ${LOG_FILE}`);
    process.exit(1);
}

const content = fs.readFileSync(LOG_FILE, 'utf8');
const lines = content.split('\n');

let currentPage = -1;

console.log(`Processing ${LOG_FILE}...`);

for (const line of lines) {
    // Look for DUMP_REQ to identify the page number
    // [19:33:41.750]   >> DUMP_REQ dev=0 model=0x0E params=000000
    const reqMatch = line.match(/>> DUMP_REQ.*params=([0-9A-Fa-f]+)/);
    if (reqMatch) {
        const params = reqMatch[1];

        // params is hex string, e.g. "000000"
        // DUMP_REQ params=000000 -> Page 0
        // DUMP_REQ params=000001 -> Page 1

        const pBytes = [];
        for (let i = 0; i < params.length; i += 2) {
            pBytes.push(parseInt(params.substr(i, 2), 16));
        }

        // Check if it's a page dump request (usually 00 00 XX)
        if (pBytes.length >= 3 && pBytes[0] === 0 && pBytes[1] === 0) {
            currentPage = pBytes[2];
            console.log(`Found request for Page ${currentPage}`);
        } else {
            console.log(`Skipping non-page request params: ${params}`);
            currentPage = -1;
        }
    }

    // Look for DEV->APP lines with DUMP_RESP
    // [19:33:42.183] DEV->APP [1015] F0 00 ... F7
    if (line.includes('DEV->APP') && currentPage !== -1) {
        const hexMatch = line.match(/F0 [0-9A-Fa-f ]+ F7/);
        if (hexMatch) {
            const hexString = hexMatch[0].replace(/\s/g, '');

            // Basic length check for a page dump (approx 1015 bytes encoded -> 2030 hex chars)
            // The log says [1015] bytes. 
            if (hexString.length > 2000) {
                const filename = path.join(OUTPUT_DIR, `page_${currentPage.toString().padStart(2, '0')}.hex`);
                fs.writeFileSync(filename, hexString);
                console.log(`Saved ${filename} (${hexString.length / 2} bytes)`);
                currentPage = -1; // Reset
            }
        }
    }
}

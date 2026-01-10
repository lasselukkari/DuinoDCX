import * as fs from 'node:fs';
import * as path from 'node:path';
import { decode7to8 } from '../protocol/encoding.js';
import { parsePreset } from '../preset-parser.js';
const DATA_DIR = path.join(process.cwd(), 'test-data');
const OUTPUT_FILE = path.join(process.cwd(), 'current.dcx.json');
// Helper to load and decode hexdumps
function loadPage(pageNumber) {
    const filename = `page_${pageNumber.toString().padStart(2, '0')}.hex`;
    const filePath = path.join(DATA_DIR, filename);
    if (!fs.existsSync(filePath)) {
        console.warn(`Warning: ${filename} not found.`);
        return new Uint8Array(0);
    }
    const content = fs.readFileSync(filePath, 'utf8');
    const cleanHex = content.replaceAll(/[^\dA-Fa-f]/g, '');
    const bytes = new Uint8Array(cleanHex.length / 2);
    for (let i = 0; i < cleanHex.length; i += 2) {
        bytes[i / 2] = Number.parseInt(cleanHex.substring(i, i + 2), 16);
    }
    return bytes;
}
function extractSysexMessages(bytes) {
    const messages = [];
    let start = -1;
    for (let i = 0; i < bytes.length; i++) {
        if (bytes[i] === 0xf0)
            start = i;
        if (bytes[i] === 0xf7 && start !== -1) {
            messages.push(bytes.slice(start, i + 1));
            start = -1;
        }
    }
    return messages;
}
function main() {
    console.log('Generating JSON dump from page_*.hex files...');
    const allPresets = [];
    // Loop pages 0 to 11
    for (let i = 0; i <= 11; i++) {
        console.log(`Processing Page ${i}...`);
        const rawBytes = loadPage(i);
        if (rawBytes.length === 0)
            continue;
        const msgs = extractSysexMessages(rawBytes);
        console.log(`  Found ${msgs.length} SysEx messages.`);
        for (const message of msgs) {
            // Decode payload
            // Payload 13 to -2
            if (message.length < 15)
                continue;
            const payload = message.slice(13, message.length - 2);
            try {
                const decoded = decode7to8(payload, { indexed: false });
                console.log(`  Decoded payload size: ${decoded.length} bytes.`);
                let bufferToParse = decoded;
                let headerFound = false;
                // Check for XSNP in first 20 bytes
                for (let k = 0; k < 20 && k < decoded.length - 4; k++) {
                    if (decoded[k] === 0x58 &&
                        decoded[k + 1] === 0x53 &&
                        decoded[k + 2] === 0x4e &&
                        decoded[k + 3] === 0x50) {
                        headerFound = true;
                        break;
                    }
                }
                if (!headerFound) {
                    console.log(`  No XSNP header found. Injecting 'XSNP' prefix...`);
                    const newBuf = new Uint8Array(decoded.length + 4);
                    newBuf.set([0x58, 0x53, 0x4e, 0x50], 0);
                    newBuf.set(decoded, 4);
                    bufferToParse = newBuf;
                }
                // Scan for "XSNP" headers in the bufferToParse
                let offset = 0;
                let foundHeaders = 0;
                while (offset < bufferToParse.length - 4) {
                    // XSNP = 0x58 0x53 0x4E 0x50
                    if (bufferToParse[offset] === 0x58 &&
                        bufferToParse[offset + 1] === 0x53 &&
                        bufferToParse[offset + 2] === 0x4e &&
                        bufferToParse[offset + 3] === 0x50) {
                        foundHeaders++;
                        console.log(`  Found XSNP header at offset ${offset}`);
                        // Parse it.
                        try {
                            const presetProto = parsePreset(bufferToParse.slice(offset));
                            allPresets.push(presetProto);
                            console.log(`    Parsed preset: "${presetProto.header.presetName.trim()}"`);
                            // Advance offset safely.
                            // Preset size approx 875 bytes?
                            offset += 100;
                        }
                        catch (error) {
                            console.error(`    Error parsing preset at offset ${offset} in Page ${i}:`, error.message);
                            offset++;
                        }
                    }
                    else {
                        offset++;
                    }
                }
                if (foundHeaders === 0) {
                    console.log(`  No presest headers found in this page.`);
                    // Maybe check for "Init"? Init data.
                }
            }
            catch (error) {
                console.error(`Error decoding page ${i}:`, error);
            }
        }
    }
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allPresets, null, 2));
    console.log(`Dumped ${allPresets.length} presets to ${OUTPUT_FILE}`);
}
main();
//# sourceMappingURL=dump-all-presets.js.map
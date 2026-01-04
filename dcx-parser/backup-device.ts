
import { SerialPort } from 'serialport';
import * as fs from 'fs';
import { buildPageDumpRequest, parseMessage } from './src/sysex.js';
import { assemblePagesIntoDcxFile } from './src/dcx-file.js';

const SERIAL_PORT = '/dev/cu.usbserial-1430';
const BAUDRATE = 38400;

function sleep(ms: number) { return new Promise(resolve => setTimeout(resolve, ms)); }

async function main() {
    const port = new SerialPort({ path: SERIAL_PORT, baudRate: BAUDRATE });
    await new Promise((res) => port.on('open', res));

    console.log("Starting backup from device...");
    const pages: Array<{ page: number, data: Uint8Array }> = [];

    for (let page = 0; page <= 11; page++) {
        console.log(`Requesting Page ${page}...`);

        let attempts = 0;
        let success = false;

        while (attempts < 3 && !success) {
            // Flush any old data
            while (port.read()) { }

            port.write(buildPageDumpRequest(page));

            let buf = Buffer.alloc(0);
            let t0 = Date.now();

            while (Date.now() - t0 < 1500) {
                const chunk = port.read();
                if (chunk) {
                    buf = Buffer.concat([buf, chunk]);
                    if (buf.includes(0xF7) && buf.length > 500) break;
                }
                await sleep(20);
            }

            const msg = parseMessage(new Uint8Array(buf));
            if (msg && msg.type === 'pageDump' && msg.page === page) {
                console.log(`  Received Page ${page} (${msg.data.length} bytes decoded)`);
                fs.writeFileSync(`page_cache/page_${page}.sysex`, buf);
                pages.push({ page, data: msg.data });
                success = true;
            } else {
                attempts++;
                console.warn(`  Attempt ${attempts} failed for Page ${page}. Retrying...`);
                await sleep(200);
            }
        }

        if (!success) {
            console.error(`FAILED to retrieve Page ${page} after 3 attempts.`);
            break;
        }
    }

    if (pages.length > 0) {
        console.log("Assembling pages into .dcx format...");
        try {
            const dcxData = assemblePagesIntoDcxFile(pages);
            fs.writeFileSync('backup_test.dcx', dcxData);
            console.log(`Backup saved to backup_test.dcx (${dcxData.length} bytes)`);

            // Compare with current.dcx
            if (fs.existsSync('current.dcx')) {
                const current = fs.readFileSync('current.dcx');
                if (Buffer.compare(Buffer.from(dcxData), current) === 0) {
                    console.log("BIT-PERFECT MATCH! Success.");
                } else {
                    console.warn("Files differ. Performing detailed comparison...");
                    console.log(`Original: ${current.length} bytes, Generated: ${dcxData.length} bytes`);

                    // Simple offset finder
                    let firstDiff = -1;
                    for (let i = 0; i < Math.min(dcxData.length, current.length); i++) {
                        if (dcxData[i] !== current[i]) {
                            firstDiff = i;
                            break;
                        }
                    }
                    if (firstDiff !== -1) {
                        console.log(`First difference at offset 0x${firstDiff.toString(16)}: Original 0x${current[firstDiff].toString(16)}, Generated 0x${dcxData[firstDiff].toString(16)}`);
                    } else if (dcxData.length !== current.length) {
                        console.log(`Length mismatch at end of file.`);
                    }
                }
            }
        } catch (e: any) {
            console.error("Assembly failed:", e.message);
        }
    }

    port.close();
}

main().catch(console.error);

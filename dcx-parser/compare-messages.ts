/**
 * Download device state and compare with upload messages.
 * 
 * This script:
 * 1. Downloads all pages from device and saves raw SysEx messages
 * 2. Assembles into a DCX file
 * 3. Generates upload messages from that DCX
 * 4. Compares download messages vs upload messages
 */

import { SerialPort } from 'serialport';
import * as fs from 'fs';
import {
    buildPageDumpRequest,
    parseMessage,
} from './src/sysex.js';
import {
    assemblePagesIntoDcxFile,
} from './src/dcx-file.js';
import { RestoreSession } from './src/restore.js';

const SERIAL_PORT = '/dev/cu.usbserial-1430';
const BAUDRATE = 38400;

function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function hexDump(data: Uint8Array, maxLen = 64): string {
    const len = Math.min(data.length, maxLen);
    const bytes: string[] = [];
    for (let i = 0; i < len; i++) {
        bytes.push(data[i].toString(16).padStart(2, '0'));
    }
    if (data.length > maxLen) {
        return bytes.join(' ') + '...';
    }
    return bytes.join(' ');
}

async function main() {
    console.log('=== Download and Compare Test ===\n');

    // Open serial port
    console.log(`Opening serial port ${SERIAL_PORT}...`);
    const port = new SerialPort({ path: SERIAL_PORT, baudRate: BAUDRATE });
    await new Promise((res) => port.on('open', res));
    console.log('Port opened.');

    try {
        // Wait for device to be ready
        console.log('Waiting for device to be ready...');
        await sleep(1000);

        // Flush any stale data
        while (port.read()) { }

        // Step 1: Download from device
        console.log('\nStep 1: Downloading all pages from device...\n');
        const downloadedMessages: Uint8Array[] = [];
        const pages: Array<{ page: number; data: Uint8Array }> = [];

        for (let page = 0; page <= 11; page++) {
            console.log(`  Requesting page ${page}...`);

            // Flush buffer
            while (port.read()) { }

            port.write(buildPageDumpRequest(page));

            let buf = Buffer.alloc(0);
            const t0 = Date.now();

            while (Date.now() - t0 < 2000) {
                const chunk = port.read();
                if (chunk) {
                    buf = Buffer.concat([buf, chunk]);
                    if (buf.includes(0xf7) && buf.length > 500) break;
                }
                await sleep(20);
            }

            const rawMessage = new Uint8Array(buf);
            console.log(`    Received ${rawMessage.length} bytes`);

            const msg = parseMessage(rawMessage);

            if (msg && msg.type === 'pageDump' && msg.page === page) {
                downloadedMessages.push(rawMessage);
                pages.push({ page, data: msg.data });
                console.log(`    Parsed: page ${msg.page}, ${msg.data.length} bytes decoded`);
            } else {
                console.error(`    ERROR: Failed to parse or wrong page`);
                if (msg) {
                    console.error(`    Got type: ${msg.type}`);
                } else {
                    console.error(`    Raw: ${hexDump(rawMessage, 32)}`);
                }
                process.exit(1);
            }
        }

        // Save raw download messages
        const downloadDir = 'download_messages';
        if (!fs.existsSync(downloadDir)) {
            fs.mkdirSync(downloadDir);
        }

        for (let i = 0; i < downloadedMessages.length; i++) {
            fs.writeFileSync(
                `${downloadDir}/page_${i}_download.bin`,
                downloadedMessages[i]
            );
        }
        console.log(`\nSaved ${downloadedMessages.length} raw download messages to ${downloadDir}/\n`);

        // Step 2: Assemble into DCX
        console.log('Step 2: Assembling downloaded data into DCX...\n');
        const downloadedDcx = assemblePagesIntoDcxFile(pages);
        fs.writeFileSync('downloaded_device.dcx', downloadedDcx);
        console.log(`  Saved to downloaded_device.dcx: ${downloadedDcx.length} bytes`);
        console.log(`  First 32 bytes: ${hexDump(downloadedDcx, 32)}\n`);

        // Step 3: Generate upload messages from downloaded DCX
        console.log('Step 3: Generating upload messages from downloaded DCX...\n');
        const session = new RestoreSession(downloadedDcx);
        const uploadMessages: Uint8Array[] = [];

        // Simulate INIT_SYNC -> ACK
        const initMsg = session.getNextMessage();
        if (initMsg) {
            console.log(`  INIT_SYNC: ${initMsg.length} bytes`);
        }
        session.processResponse({ type: 'ack', deviceId: 0, payload: new Uint8Array() });

        // Get Header packet
        const headerMsg = session.getNextMessage();
        if (headerMsg) {
            console.log(`  Header: ${headerMsg.length} bytes`);
            fs.writeFileSync(`${downloadDir}/header_upload.bin`, headerMsg);
        }

        // Get Page 0 (unsolicited)
        const page0Msg = session.getNextMessage();
        if (page0Msg) {
            console.log(`  Page 0: ${page0Msg.length} bytes`);
            uploadMessages.push(page0Msg);
        }

        // Get remaining pages
        const status = session.getStatus();
        for (let page = 1; page < status.totalPages; page++) {
            session.processResponse({ type: 'pageRequest', deviceId: 0, page });
            const pageMsg = session.getNextMessage();
            if (pageMsg) {
                console.log(`  Page ${page}: ${pageMsg.length} bytes`);
                uploadMessages.push(pageMsg);
            }
        }

        // Save upload messages
        for (let i = 0; i < uploadMessages.length; i++) {
            fs.writeFileSync(
                `${downloadDir}/page_${i}_upload.bin`,
                uploadMessages[i]
            );
        }
        console.log(`\nSaved ${uploadMessages.length} upload messages to ${downloadDir}/\n`);

        // Step 4: Compare download vs upload messages
        console.log('Step 4: Comparing download vs upload messages...\n');

        let allMatch = true;
        for (let i = 0; i < Math.min(downloadedMessages.length, uploadMessages.length); i++) {
            const download = downloadedMessages[i];
            const upload = uploadMessages[i];

            if (download.length !== upload.length) {
                console.error(`  Page ${i}: SIZE MISMATCH`);
                console.error(`    Download: ${download.length} bytes`);
                console.error(`    Upload:   ${upload.length} bytes`);
                allMatch = false;
                continue;
            }

            let differences = 0;
            let firstDiff = -1;
            for (let j = 0; j < download.length; j++) {
                if (download[j] !== upload[j]) {
                    if (firstDiff === -1) firstDiff = j;
                    differences++;
                }
            }

            if (differences === 0) {
                console.log(`  Page ${i}: ✅ MATCH (${download.length} bytes)`);
            } else {
                console.error(`  Page ${i}: ❌ ${differences} bytes differ`);
                console.error(`    First diff at offset ${firstDiff}:`);
                console.error(`      Download: ${hexDump(download.slice(Math.max(0, firstDiff - 4), firstDiff + 12), 16)}`);
                console.error(`      Upload:   ${hexDump(upload.slice(Math.max(0, firstDiff - 4), firstDiff + 12), 16)}`);
                allMatch = false;
            }
        }

        if (downloadedMessages.length !== uploadMessages.length) {
            console.error(`\n  ❌ PAGE COUNT MISMATCH:`);
            console.error(`    Downloaded: ${downloadedMessages.length} pages`);
            console.error(`    Upload:     ${uploadMessages.length} pages`);
            allMatch = false;
        }

        if (allMatch) {
            console.log('\n✅ All messages match! Upload/download cycle is correct.');
        } else {
            console.log('\n❌ Messages do not match. There is a bug in upload or download logic.');
        }

    } finally {
        port.close();
    }
}

main().catch(console.error);

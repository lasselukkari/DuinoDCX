/**
 * Compare upload messages with downloaded messages using existing files
 */

import * as fs from 'fs';
import { RestoreSession } from './src/restore.js';

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
    console.log('=== Comparing Upload vs Download Messages ===\n');

    // Load downloaded DCX
    const downloadedDcx = new Uint8Array(fs.readFileSync('downloaded_device.dcx'));
    console.log(`Loaded downloaded_device.dcx: ${downloadedDcx.length} bytes\n`);

    // Generate upload messages
    console.log('Generating upload messages...\n');
    const session = new RestoreSession(downloadedDcx);
    const uploadMessages: Uint8Array[] = [];

    // Simulate protocol
    session.getNextMessage(); // INIT_SYNC
    session.processResponse({ type: 'ack', deviceId: 0, payload: new Uint8Array() });
    session.getNextMessage(); // Header

    const page0 = session.getNextMessage();
    if (page0) uploadMessages.push(page0);

    const status = session.getStatus();
    for (let page = 1; page < status.totalPages; page++) {
        session.processResponse({ type: 'pageRequest', deviceId: 0, page });
        const pageMsg = session.getNextMessage();
        if (pageMsg) uploadMessages.push(pageMsg);
    }

    console.log(`Generated ${uploadMessages.length} upload messages\n`);

    // Load downloaded messages
    const downloadedMessages: Uint8Array[] = [];
    for (let i = 0; i < 12; i++) {
        const path = `download_messages/page_${i}_download.bin`;
        if (fs.existsSync(path)) {
            downloadedMessages.push(new Uint8Array(fs.readFileSync(path)));
        }
    }

    console.log(`Loaded ${downloadedMessages.length} downloaded messages\n`);

    // Compare
    console.log('Comparing messages...\n');
    let allMatch = true;

    for (let i = 0; i < Math.min(downloadedMessages.length, uploadMessages.length); i++) {
        const download = downloadedMessages[i];
        const upload = uploadMessages[i];

        if (download.length !== upload.length) {
            console.error(`Page ${i}: SIZE MISMATCH`);
            console.error(`  Download: ${download.length} bytes`);
            console.error(`  Upload:   ${upload.length} bytes`);
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
            console.log(`Page ${i}: ✅ MATCH (${download.length} bytes)`);
        } else {
            console.error(`Page ${i}: ❌ ${differences} bytes differ`);
            console.error(`  First diff at offset ${firstDiff}:`);
            console.error(`    Download: ${hexDump(download.slice(Math.max(0, firstDiff - 4), firstDiff + 12), 16)}`);
            console.error(`    Upload:   ${hexDump(upload.slice(Math.max(0, firstDiff - 4), firstDiff + 12), 16)}`);
            allMatch = false;
        }
    }

    if (allMatch) {
        console.log('\n✅ All messages match! Upload/download cycle is correct.');
    } else {
        console.log('\n❌ Messages do not match.');
    }
}

main().catch(console.error);

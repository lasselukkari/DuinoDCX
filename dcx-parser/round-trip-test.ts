/**
 * Round-Trip Test (Step 0 from upload-plan.md)
 * 
 * Tests that the encode/decode cycle is lossless using RestoreSession:
 * 1. Read current.dcx
 * 2. Create RestoreSession
 * 3. Simulate the protocol by generating all messages
 * 4. Parse those messages back (parseMessage)
 * 5. Reassemble pages (assemblePagesIntoDcxFile)
 * 6. Assert: Original .dcx === Reconstructed .dcx (bit-perfect)
 */

import * as fs from 'fs';
import {
    parseMessage,
} from './src/sysex.js';
import {
    assemblePagesIntoDcxFile,
} from './src/dcx-file.js';
import { RestoreSession } from './src/restore.js';

function hexDump(data: Uint8Array, start: number, length: number): string {
    const bytes: string[] = [];
    for (let i = start; i < Math.min(start + length, data.length); i++) {
        bytes.push(data[i].toString(16).padStart(2, '0'));
    }
    return bytes.join(' ');
}

async function main() {
    console.log('=== DCX Round-Trip Test (Using RestoreSession) ===\n');

    // Step 1: Read original DCX file
    const dcxPath = 'current.dcx';
    if (!fs.existsSync(dcxPath)) {
        console.error(`ERROR: ${dcxPath} not found`);
        process.exit(1);
    }

    const originalDcx = new Uint8Array(fs.readFileSync(dcxPath));
    console.log(`1. Read ${dcxPath}: ${originalDcx.length} bytes`);
    console.log(`   First 16 bytes: ${hexDump(originalDcx, 0, 16)}`);

    // Step 2: Create RestoreSession
    const session = new RestoreSession(originalDcx);
    const status = session.getStatus();
    console.log(`\n2. Created RestoreSession with ${status.totalPages} pages`);

    // Step 3: Simulate the protocol
    console.log('\n3. Simulating protocol...');
    const sysexMessages: Uint8Array[] = [];
    let stepCount = 0;

    // Simulate INIT_SYNC -> ACK
    const initMsg = session.getNextMessage();
    if (initMsg) {
        stepCount++;
        console.log(`   [${stepCount}] INIT_SYNC: ${initMsg.length} bytes`);
        // Simulate ACK response
        session.processResponse({ type: 'ack', deviceId: 0, payload: new Uint8Array() });
    }

    // Get Header packet
    const headerMsg = session.getNextMessage();
    if (headerMsg) {
        stepCount++;
        console.log(`   [${stepCount}] Header packet: ${headerMsg.length} bytes`);
    }

    // Get Page 0 (unsolicited)
    const page0Msg = session.getNextMessage();
    if (page0Msg) {
        stepCount++;
        console.log(`   [${stepCount}] Page 0 packet: ${page0Msg.length} bytes`);
        sysexMessages.push(page0Msg);
    }

    // Simulate page requests for pages 1-11
    for (let page = 1; page < status.totalPages; page++) {
        // Simulate device requesting page
        session.processResponse({ type: 'pageRequest', deviceId: 0, page });

        const pageMsg = session.getNextMessage();
        if (pageMsg) {
            stepCount++;
            console.log(`   [${stepCount}] Page ${page} packet: ${pageMsg.length} bytes`);
            sysexMessages.push(pageMsg);
        }
    }

    console.log(`   Total page packets generated: ${sysexMessages.length}`);

    // Step 4: Parse messages back
    console.log('\n4. Parsing SysEx packets...');
    const parsedPages: Array<{ page: number; data: Uint8Array }> = [];

    for (let i = 0; i < sysexMessages.length; i++) {
        const parsed = parseMessage(sysexMessages[i]);
        if (!parsed) {
            console.error(`   ERROR: Failed to parse page ${i} packet`);
            continue;
        }
        if (parsed.type === 'pageDump') {
            console.log(`   Parsed page ${parsed.page}: ${parsed.data.length} bytes decoded`);
            parsedPages.push({ page: parsed.page, data: parsed.data });
        } else {
            console.log(`   Unexpected type: ${parsed.type}`);
        }
    }

    // Step 5: Reassemble
    console.log('\n5. Reassembling parsed pages...');
    let reconstructedDcx: Uint8Array;
    try {
        reconstructedDcx = assemblePagesIntoDcxFile(parsedPages);
        console.log(`   Reconstructed: ${reconstructedDcx.length} bytes`);
        console.log(`   First 16 bytes: ${hexDump(reconstructedDcx, 0, 16)}`);
    } catch (e: any) {
        console.error(`   ERROR: Assembly failed: ${e.message}`);
        process.exit(1);
    }

    // Step 6: Compare
    console.log('\n6. Comparing original vs reconstructed...');
    console.log(`   Original:      ${originalDcx.length} bytes`);
    console.log(`   Reconstructed: ${reconstructedDcx.length} bytes`);

    if (originalDcx.length !== reconstructedDcx.length) {
        console.error(`   FAIL: Size mismatch!`);
        process.exit(1);
    }

    let differences = 0;
    let firstDiffOffset = -1;
    for (let i = 0; i < originalDcx.length; i++) {
        if (originalDcx[i] !== reconstructedDcx[i]) {
            if (firstDiffOffset === -1) {
                firstDiffOffset = i;
            }
            differences++;
        }
    }

    if (differences === 0) {
        console.log('\n   ✅ BIT-PERFECT MATCH! Round-trip test PASSED.');
        console.log('\n   Safe to proceed with device upload.');
    } else {
        console.error(`\n   ❌ FAIL: ${differences} bytes differ!`);
        console.error(`   First difference at offset 0x${firstDiffOffset.toString(16)} (${firstDiffOffset}):`);
        console.error(`     Original:      ${hexDump(originalDcx, firstDiffOffset, 16)}`);
        console.error(`     Reconstructed: ${hexDump(reconstructedDcx, firstDiffOffset, 16)}`);

        // Show context around first difference
        const contextStart = Math.max(0, firstDiffOffset - 8);
        console.error(`   Context from offset 0x${contextStart.toString(16)}:`);
        console.error(`     Original:      ${hexDump(originalDcx, contextStart, 32)}`);
        console.error(`     Reconstructed: ${hexDump(reconstructedDcx, contextStart, 32)}`);

        process.exit(1);
    }
}

main().catch(console.error);

#!/usr/bin/env node
/**
 * WebSocket Test Script for DuinoDCX
 * Tests WebSocket connection, framing, and message exchange
 */

const WebSocket = require('ws');

const WS_URL = 'ws://localhost:3000/api/ws';
const TIMEOUT = 10000; // 10 second timeout

console.log('=== DuinoDCX WebSocket Test ===\n');

let testsPassed = 0;
let testsFailed = 0;

function logPass(msg) {
    console.log(`✅ PASS: ${msg}`);
    testsPassed++;
}

function logFail(msg) {
    console.log(`❌ FAIL: ${msg}`);
    testsFailed++;
}

function logInfo(msg) {
    console.log(`   INFO: ${msg}`);
}

async function runTests() {
    console.log('Test 1: WebSocket Connection\n');
    
    const ws = new WebSocket(WS_URL);
    
    let connected = false;
    let receivedMessage = false;
    let errorMessage = null;
    
    // Set up event handlers
    ws.on('open', () => {
        connected = true;
        logPass('Connection established (101 Switching Protocols)');
        logInfo(`WebSocket readyState: ${ws.readyState}`);
        
        // Try sending a test message
        console.log('\nTest 2: Sending Message\n');
        try {
            // Send a simple binary message (SysEx format)
            const testData = new Uint8Array([0xF0, 0x00, 0x01, 0x02, 0x03, 0xF7]);
            ws.send(testData);
            logPass('Message sent successfully');
        } catch (e) {
            logFail(`Failed to send message: ${e.message}`);
        }
    });
    
    ws.on('message', (data) => {
        receivedMessage = true;
        logPass('Received message from server');
        if (Buffer.isBuffer(data)) {
            logInfo(`Message type: binary, length: ${data.length}`);
            logInfo(`First bytes: ${Array.from(data.slice(0, 10)).map(b => b.toString(16).padStart(2, '0')).join(' ')}`);
        } else {
            logInfo(`Message type: ${typeof data}, content: ${data.toString().slice(0, 100)}`);
        }
    });
    
    ws.on('error', (err) => {
        errorMessage = err.message;
        logFail(`WebSocket error: ${err.message}`);
    });
    
    ws.on('close', (code, reason) => {
        logInfo(`Connection closed: code=${code}, reason=${reason || 'none'}`);
    });
    
    // Wait for connection or timeout
    await new Promise((resolve) => {
        const timeout = setTimeout(() => {
            if (!connected) {
                logFail('Connection timeout - could not connect');
            }
            resolve();
        }, 5000);
        
        ws.on('open', () => {
            clearTimeout(timeout);
            // Stay connected for a bit to receive messages
            setTimeout(resolve, 3000);
        });
        
        ws.on('error', () => {
            clearTimeout(timeout);
            resolve();
        });
    });
    
    // Close connection gracefully
    if (ws.readyState === WebSocket.OPEN) {
        console.log('\nTest 3: Graceful Close\n');
        ws.close(1000, 'Test complete');
        logPass('Sent close frame');
        
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Summary
    console.log('\n=== Test Summary ===');
    console.log(`Passed: ${testsPassed}`);
    console.log(`Failed: ${testsFailed}`);
    
    if (testsFailed > 0) {
        console.log('\n⚠️  Some tests failed. Check the server logs for more details.');
        process.exit(1);
    } else {
        console.log('\n✅ All tests passed!');
        process.exit(0);
    }
}

// Check if ws module is available
try {
    require.resolve('ws');
} catch (e) {
    console.log('Installing ws module...');
    require('child_process').execSync('npm install ws --no-save', { 
        cwd: __dirname,
        stdio: 'inherit' 
    });
}

runTests().catch(err => {
    console.error('Test error:', err);
    process.exit(1);
});

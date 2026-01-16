#!/usr/bin/env node
/**
 * Simple WebSocket Test - single connection, basic exchange
 */

const WebSocket = require('ws');
const WS_URL = 'ws://localhost:3000/api/ws';

console.log('=== Simple WebSocket Test ===\n');
console.log(`Connecting to ${WS_URL}...`);

const ws = new WebSocket(WS_URL);

ws.on('open', () => {
    console.log('✅ Connected');
    console.log('   Waiting 2 seconds...');
    
    // Wait a bit, then send a simple message
    setTimeout(() => {
        console.log('   Sending "hello" message...');
        ws.send('hello');
        console.log('   Message sent');
        
        // Wait for response or timeout
        setTimeout(() => {
            console.log('   Closing connection...');
            ws.close(1000, 'Test complete');
        }, 2000);
    }, 2000);
});

ws.on('message', (data) => {
    console.log(`✅ Received: ${data.toString().slice(0, 100)}`);
});

ws.on('error', (err) => {
    console.log(`❌ Error: ${err.message}`);
});

ws.on('close', (code, reason) => {
    console.log(`   Closed: code=${code}, reason=${reason || 'none'}`);
    process.exit(0);
});

// Timeout after 10 seconds
setTimeout(() => {
    console.log('   Timeout - closing');
    ws.close();
    process.exit(1);
}, 10000);

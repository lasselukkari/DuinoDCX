
import { SerialPort } from 'serialport';
import { buildEditBufferRequest, buildListenModeCommand, buildParamChangeCommand } from './src/commands/builders.js';

const PORT_PATH = '/dev/tty.usbserial-1430';
const SYSEX_START = 0xF0;
const SYSEX_END = 0xF7;

async function captureRawPacket(port: SerialPort, expectedCmd: number): Promise<Uint8Array> {
    return new Promise((resolve) => {
        let buffer: number[] = [];
        let capturing = false;
        const timeout = setTimeout(() => {
            cleanup();
            resolve(new Uint8Array(0));
        }, 5000);
        const onData = (data: Buffer) => {
            for (const byte of data) {
                if (byte === SYSEX_START) {
                    buffer = [byte];
                    capturing = true;
                } else if (capturing) {
                    buffer.push(byte);
                    if (byte === SYSEX_END) {
                        capturing = false;
                        const packet = new Uint8Array(buffer);
                        if (packet.length > 7 && packet[6] === expectedCmd) {
                            cleanup();
                            resolve(packet);
                        }
                    }
                }
            }
        };
        port.on('data', onData);
        const cleanup = () => {
            clearTimeout(timeout);
            port.removeListener('data', onData);
        };
    });
}

async function run() {
    const port = new SerialPort({ path: PORT_PATH, baudRate: 38400 });

    port.on('open', async () => {
        console.log('Port open. Initializing...');
        port.write(buildListenModeCommand(0x0C, 0x00));
        await new Promise(r => setTimeout(r, 500));

        // 1. Capture baseline (mm = 0)
        console.log('\nCapturing baseline (Delay Units: mm)...');
        port.write(buildParamChangeCommand({ kind: 'setup', key: 'delayUnits' }, 'mm')!);
        await new Promise(r => setTimeout(r, 500));
        port.write(buildEditBufferRequest(0));
        const before = await captureRawPacket(port, 0x10);

        // 2. Change to inch (1)
        console.log('\nChanging Delay Units to: inch...');
        port.write(buildParamChangeCommand({ kind: 'setup', key: 'delayUnits' }, 'inch')!);
        await new Promise(r => setTimeout(r, 500));
        port.write(buildEditBufferRequest(0));
        const after0 = await captureRawPacket(port, 0x10);

        // 1b. Capture Part 1 just in case
        port.write(buildEditBufferRequest(1));
        const after1 = await captureRawPacket(port, 0x10);

        // 3. Diff Part 0
        console.log('\n=== RAW WIRE DIFF (Part 0) ===');
        const minLen = Math.min(before.length, after0.length);
        let found = false;
        for (let i = 0; i < minLen; i++) {
            if (before[i] !== after0[i]) {
                console.log(`Raw Index ${i.toString().padStart(3)}: 0x${before[i].toString(16).padStart(2, '0')} -> 0x${after0[i].toString(16).padStart(2, '0')}`);
                found = true;
            }
        }
        if (!found) console.log('No changes detected in Part 0 raw wire data!');

        // 4. Try Part 1 diff if Part 0 had nothing
        if (!found) {
            console.log('\nChecking Part 1...');
            // Need a baseline for Part 1 too if needed, but let's just see if after1 has anything interesting at raw index 55.
            // Actually, index 55 in Part 1 would be a different parameter.
        }

        port.close();
        process.exit(0);
    });
}

run().catch(console.error);


import { SerialPort } from 'serialport';
import * as fs from 'fs';
import { buildEditBufferRequest, buildListenModeCommand } from './src/commands/builders.js';

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
                        // index 6 is command, 16 is 0x10 (Dump Response)
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

        console.log('\nCapturing raw baseline Part 0...');
        port.write(buildEditBufferRequest(0));
        const part0 = await captureRawPacket(port, 0x10);
        if (!part0.length) { console.error('Failed to capture Part 0'); process.exit(1); }

        console.log('Capturing raw baseline Part 1...');
        port.write(buildEditBufferRequest(1));
        const part1 = await captureRawPacket(port, 0x10);
        if (!part1.length) { console.error('Failed to capture Part 1'); process.exit(1); }

        const dump = {
            timestamp: new Date().toISOString(),
            part0: Array.from(part0),
            part1: Array.from(part1)
        };

        fs.writeFileSync('baseline-raw.json', JSON.stringify(dump, null, 2));
        console.log('\nBaseline captured and saved to baseline-raw.json');
        console.log('You can now manual change the setting on the device.');

        port.close();
        process.exit(0);
    });
}

run().catch(console.error);

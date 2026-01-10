import * as fs from 'node:fs';
import * as path from 'node:path';
import { SerialPort } from 'serialport';
import { buildEditBufferRequest, buildPageDumpRequest, } from '../commands/builders.js';
import { SYSEX_START } from '../constants/protocol.js';
const PORT_PATH = process.env.SERIAL_PORT || '/dev/tty.usbserial-1430';
const BAUD_RATE = 38_400;
const OUTPUT_DIR = path.join(process.cwd(), 'test-data', 'verification');
// Ensure output dir exists
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}
async function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
async function dumpData(port, request, description) {
    return new Promise((resolve, reject) => {
        console.log(`Requesting ${description}...`);
        let buffer = [];
        let capturing = false;
        const timeout = setTimeout(() => {
            cleanup();
            reject(new Error(`Timeout waiting for ${description}`));
        }, 10_000); // Increased to 10s
        const onData = (data) => {
            for (const byte of data) {
                if (byte === SYSEX_START) {
                    buffer = [byte];
                    capturing = true;
                }
                else if (capturing) {
                    buffer.push(byte);
                    // Check for F7 (End of SysEx)
                    if (byte === 0xf7) {
                        // Check if this is a Dump Response (0x10)
                        // F0 00 20 32 ID 0E 10 ...
                        if (buffer.length > 7 && buffer[6] === 0x10) {
                            cleanup();
                            resolve(new Uint8Array(buffer));
                        }
                        else {
                            // Ignore other SysEx messages (e.g. Keep Alive?)
                            // Reset capturing if loop continues
                            capturing = false;
                            // NOTE: If we reset capturing, we might lose subsequent valid message.
                            // But here we assume one request -> one response.
                        }
                    }
                }
            }
        };
        const cleanup = () => {
            clearTimeout(timeout);
            port.removeListener('data', onData);
        };
        port.on('data', onData);
        port.write(request);
    });
}
async function main() {
    console.log(`Opening serial port: ${PORT_PATH}`);
    const port = new SerialPort({ path: PORT_PATH, baudRate: BAUD_RATE });
    port.on('open', async () => {
        try {
            console.log('Port open.');
            await sleep(1000); // Wait for stabilization
            // 1. Dump Edit Buffer (Part 0 and 1)
            const ebPart0 = await dumpData(port, buildEditBufferRequest(0), 'Edit Buffer Part 0');
            await sleep(200);
            const ebPart1 = await dumpData(port, buildEditBufferRequest(1), 'Edit Buffer Part 1');
            // Concat
            const ebFull = new Uint8Array(ebPart0.length + ebPart1.length);
            ebFull.set(ebPart0);
            ebFull.set(ebPart1, ebPart0.length);
            fs.writeFileSync(path.join(OUTPUT_DIR, 'edit_buffer.sysex'), ebFull);
            console.log('Saved edit_buffer.sysex');
            await sleep(500);
            // 2. Dump Preset 0 (Index 1)
            // User said "index 0", "index 1", "index 59".
            // DCX internal Memory Pages are 1-based (1..60)?
            // Or 0-based?
            // `buildPageDumpRequest` takes `page`.
            // Default `CMD_RECALL` uses 0-based?
            // Let's assume User meant Indices 0, 1, 59 (Internal).
            // Corresponds to Preset 1, 2, 60.
            const preset00 = await dumpData(port, buildPageDumpRequest(0), 'Preset 1 (Index 0)');
            fs.writeFileSync(path.join(OUTPUT_DIR, 'preset_00.sysex'), preset00);
            console.log('Saved preset_00.sysex');
            await sleep(500);
            const preset01 = await dumpData(port, buildPageDumpRequest(1), 'Preset 2 (Index 1)');
            fs.writeFileSync(path.join(OUTPUT_DIR, 'preset_01.sysex'), preset01);
            console.log('Saved preset_01.sysex');
            await sleep(500);
            const preset59 = await dumpData(port, buildPageDumpRequest(59), 'Preset 60 (Index 59)');
            fs.writeFileSync(path.join(OUTPUT_DIR, 'preset_59.sysex'), preset59);
            console.log('Saved preset_59.sysex');
            console.log('\nAll dumps completed successfully.');
            port.close();
            process.exit(0);
        }
        catch (error) {
            console.error('Error during dump:', error);
            port.close();
            process.exit(1);
        }
    });
    port.on('error', (error) => {
        console.error('Serial Port Error:', error);
        process.exit(1);
    });
}
main();
//# sourceMappingURL=dump-verification-data.js.map
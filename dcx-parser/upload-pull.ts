
import { SerialPort } from 'serialport';
import * as fs from 'fs';
import {
    extractSysexMessages,
    parseMessage,
    SYSEX_START,
    SYSEX_END,
    VENDOR_ID,
    MODEL_ID,
    DEFAULT_DEVICE_ID,
    buildDataPacket,
    calculateChecksum
} from './src/index.js';
import { splitDcxFileIntoPages } from './src/dcx-file.js';
import { encode8to7 } from './src/encoding.js';

const DEVICE_PATH = '/dev/cu.usbserial-1430';
const BAUD_RATE = 38400;
const FILE_PATH = './current.dcx';

// Protocol Constants
const CMD_INIT_RESTORE = 0x3F;
const PACKET_TYPE_PAGE = 0x0C;

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
    console.log(`Opening serial port ${DEVICE_PATH}...`);
    const port = new SerialPort({
        path: DEVICE_PATH,
        baudRate: BAUD_RATE,
        dataBits: 8,
        stopBits: 1,
        parity: 'none',
    });

    port.on('error', (err) => {
        console.error('Serial port error:', err);
    });

    // Read and parse DCX file
    console.log(`Reading DCX file ${FILE_PATH}...`);
    const fileBuffer = fs.readFileSync(FILE_PATH);
    const pages = splitDcxFileIntoPages(fileBuffer);
    console.log(`Loaded ${pages.length} pages from file.`);

    // Buffer for incoming data
    let incomingBuffer = new Uint8Array(0);

    // Helper to send data
    const send = async (data: Uint8Array, description: string) => {
        console.log(`Sending ${description} (${data.length} bytes)...`);
        // console.log(Buffer.from(data).toString('hex'));
        port.write(data);
        port.drain();
    };

    // Helper to build Type 01 packets (Special Upload Packets)
    const buildType1Packet = (pageData: Uint8Array, pageNum: number) => {
        // Manual build because sysex.ts hardcodes byte 7 to 00
        // Format: F0 00 20 32 00 0E 10 01 01 00 02 00 [PAGE] [DATA] [CS] F7
        const encoded = encode8to7(pageData);
        const header = [
            SYSEX_START, ...VENDOR_ID, DEFAULT_DEVICE_ID, MODEL_ID,
            0x10, // CMD_WRITE_DATA
            0x01, // Type 1
            0x01,
            0x00,
            0x02, // Packet Type?
            0x00,
            pageNum & 0x7f
        ];

        const packet = new Uint8Array([...header, ...encoded]);
        // Checksum is calculated over data AFTER header (13 bytes)
        const checksumData = packet.slice(13);
        const checksum = calculateChecksum(checksumData); // Use existing checksum calc

        return new Uint8Array([...packet, checksum, SYSEX_END]);
    };

    // 1. Initialization Sequence
    console.log('Starting initialization sequence...');

    // Send CMD_40 (Ping/Identify)
    // F0 00 20 32 20 0E 40 F7 (Note device ID 20?)
    const pingCmd = new Uint8Array([0xF0, 0x00, 0x20, 0x32, 0x20, 0x0E, 0x40, 0xF7]);
    await send(pingCmd, 'Identify (CMD_40)');
    await sleep(100);

    // Send CMD_3F (Restore Init?)
    // F0 00 20 32 00 0E 3F 04 00 F7
    const initCmd = new Uint8Array([0xF0, 0x00, 0x20, 0x32, 0x00, 0x0E, 0x3F, 0x04, 0x00, 0xF7]);
    await send(initCmd, 'Init Restore (CMD_3F)');
    await sleep(500);

    // 2. Start Main Restore (Type 00)
    console.log('Starting Main Restore (Push Page 0)...');

    // Send Page 0 Unsolicited
    const page0Packet = buildDataPacket(PACKET_TYPE_PAGE, 0, pages[0].data);
    await send(page0Packet, 'Page 0 (Unsolicited)');

    // 3. Listen for Requests
    port.on('data', async (data: Buffer) => {
        const newBuffer = new Uint8Array(incomingBuffer.length + data.length);
        newBuffer.set(incomingBuffer);
        newBuffer.set(data, incomingBuffer.length);
        incomingBuffer = newBuffer;

        const { messages, remaining } = extractSysexMessages(incomingBuffer);
        incomingBuffer = remaining;

        for (const msg of messages) {
            const parsed = parseMessage(msg);
            if (parsed && parsed.type === 'pageRequest') {
                console.log(`Received Request: Type=${parsed.requestType} Page=${parsed.page}`);

                if (parsed.requestType === 0x00) {
                    // MainRestore
                    if (parsed.page < pages.length) {
                        console.log(`Serving Page ${parsed.page} (Type 00)`);
                        const packet = buildDataPacket(PACKET_TYPE_PAGE, parsed.page, pages[parsed.page].data);
                        await send(packet, `Page ${parsed.page}`);

                        if (parsed.page === pages.length - 1) {
                            console.log('Last main page sent. Waiting for completion or Type 01...');

                            setTimeout(async () => {
                                console.log('Initiating Type 01 Phase...');
                                const p0_t1 = buildType1Packet(pages[0].data, 0);
                                await send(p0_t1, 'Page 0 (Type 01)');
                            }, 500);
                        }
                    } else {
                        console.warn(`Requested Page ${parsed.page} out of range!`);
                    }
                } else if (parsed.requestType === 0x01) {
                    // Finalize/Edit Buffer?
                    if (parsed.page < pages.length) {
                        console.log(`Serving Page ${parsed.page} (Type 01)`);
                        const packet = buildType1Packet(pages[parsed.page].data, parsed.page);
                        await send(packet, `Page ${parsed.page} (Type 01)`);

                        if (parsed.page === 1) {
                            console.log('Type 01 Page 1 sent. Restore should be complete.');
                            setTimeout(() => {
                                console.log('Exiting...');
                                process.exit(0);
                            }, 2000);
                        }
                    }
                }
            } else if (parsed) {
                console.log('Received:', parsed.type);
            } else {
                console.log('Received Unknown:', Buffer.from(msg).toString('hex'));
            }
        }
    });

    setInterval(() => { }, 1000);
}

main().catch(console.error);

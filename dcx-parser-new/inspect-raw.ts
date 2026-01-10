import {SerialPort} from 'serialport';
import {
  buildEditBufferRequest,
  buildListenModeCommand,
} from './src/commands/builders.js';

const PORT_PATH = '/dev/tty.usbserial-1430';
const SYSEX_START = 0xf0;
const SYSEX_END = 0xf7;

async function captureRawPacket(
  port: SerialPort,
  expectedCmd: number,
): Promise<Uint8Array> {
  return new Promise((resolve) => {
    let buffer: number[] = [];
    let capturing = false;
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
    const cleanup = () => port.removeListener('data', onData);
  });
}

async function run() {
  const port = new SerialPort({path: PORT_PATH, baudRate: 38_400});

  port.on('open', async () => {
    console.log('Port open. Initializing...');
    port.write(buildListenModeCommand(0x0c, 0x00));
    await new Promise((r) => setTimeout(r, 500));

    console.log('\nCapturing raw Edit Buffer Part 0...');
    port.write(buildEditBufferRequest(0));
    const packet = await captureRawPacket(port, 0x10);

    console.log(`Packet length: ${packet.length} bytes`);
    console.log('First 32 bytes (Raw):');
    let hex = '';
    let dec = '';
    for (let i = 0; i < Math.min(32, packet.length); i++) {
      hex += packet[i].toString(16).padStart(2, '0') + ' ';
      dec += i.toString().padStart(2, ' ') + ' ';
    }

    console.log('Idx: ' + dec);
    console.log('Hex: ' + hex);

    port.close();
    process.exit(0);
  });
}

run().catch(console.error);

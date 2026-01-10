import {SerialPort} from 'serialport';
import {
  buildEditBufferRequest,
  buildListenModeCommand,
  buildParamChangeCommand,
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

    // 1. Capture baseline
    console.log('\nCapturing baseline (Air Temp 20C)...');
    port.write(
      buildParamChangeCommand({kind: 'setup', key: 'airTemperature'}, 20)!,
    );
    await new Promise((r) => setTimeout(r, 500));
    port.write(buildEditBufferRequest(0));
    const before = await captureRawPacket(port, 0x10);

    // 2. Change parameter
    console.log('\nChanging Air Temp to 49C...');
    port.write(
      buildParamChangeCommand({kind: 'setup', key: 'airTemperature'}, 49)!,
    );
    await new Promise((r) => setTimeout(r, 500));
    port.write(buildEditBufferRequest(0));
    const after = await captureRawPacket(port, 0x10);

    // 3. Diff
    console.log('\n=== RAW WIRE DIFF (Part 0) ===');
    const minLength = Math.min(before.length, after.length);
    let found = false;
    for (let i = 0; i < minLength; i++) {
      if (before[i] !== after[i]) {
        console.log(
          `Raw Index ${i.toString().padStart(3)}: 0x${before[i].toString(16).padStart(2, '0')} -> 0x${after[i].toString(16).padStart(2, '0')}`,
        );
        found = true;
      }
    }

    if (!found) console.log('No changes detected in raw wire data!');

    // 4. Revert
    console.log('\nReverting Air Temp...');
    port.write(
      buildParamChangeCommand({kind: 'setup', key: 'airTemperature'}, 20)!,
    );

    port.close();
    process.exit(0);
  });
}

run().catch(console.error);

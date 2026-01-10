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
  const port = new SerialPort({path: PORT_PATH, baudRate: 38_400});

  port.on('open', async () => {
    console.log('Port open. Initializing...');
    port.write(buildListenModeCommand(0x0c, 0x00));
    await new Promise((r) => setTimeout(r, 500));

    // 1. Capture Part 0 baseline (mm)
    console.log('\nCapturing baseline (Delay Units: mm)...');
    port.write(
      buildParamChangeCommand({kind: 'setup', key: 'delayUnits'}, 'mm')!,
    );
    await new Promise((r) => setTimeout(r, 500));
    port.write(buildEditBufferRequest(0));
    const before0 = await captureRawPacket(port, 0x10);

    // 2. Change to inch
    console.log('\nChanging Delay Units to: inch...');
    port.write(
      buildParamChangeCommand({kind: 'setup', key: 'delayUnits'}, 'inch')!,
    );
    await new Promise((r) => setTimeout(r, 500));
    port.write(buildEditBufferRequest(0));
    const after0 = await captureRawPacket(port, 0x10);

    // 3. Diff Part 0
    console.log('\n=== RAW WIRE DIFF (Part 0) ===');
    let found0 = false;
    for (let i = 0; i < Math.min(before0.length, after0.length); i++) {
      if (before0[i] !== after0[i]) {
        console.log(
          `Raw Index ${i.toString().padStart(3)}: 0x${before0[i].toString(16).padStart(2, '0')} -> 0x${after0[i].toString(16).padStart(2, '0')}`,
        );
        found0 = true;
      }
    }

    if (!found0) console.log('No changes detected in Part 0 raw wire data.');

    // 4. Try Part 1 baseline
    console.log('\nCapturing Part 1 baseline (Delay Units: inch)...');
    port.write(buildEditBufferRequest(1));
    const baseline1 = await captureRawPacket(port, 0x10);

    console.log('\nChanging Delay Units back to: mm...');
    port.write(
      buildParamChangeCommand({kind: 'setup', key: 'delayUnits'}, 'mm')!,
    );
    await new Promise((r) => setTimeout(r, 500));
    port.write(buildEditBufferRequest(1));
    const after1 = await captureRawPacket(port, 0x10);

    console.log('\n=== RAW WIRE DIFF (Part 1) ===');
    let found1 = false;
    for (let i = 0; i < Math.min(baseline1.length, after1.length); i++) {
      if (baseline1[i] !== after1[i]) {
        console.log(
          `Raw Index ${i.toString().padStart(3)}: 0x${baseline1[i].toString(16).padStart(2, '0')} -> 0x${after1[i].toString(16).padStart(2, '0')}`,
        );
        found1 = true;
      }
    }

    if (!found1) console.log('No changes detected in Part 1 raw wire data.');

    port.close();
    process.exit(0);
  });
}

run().catch(console.error);

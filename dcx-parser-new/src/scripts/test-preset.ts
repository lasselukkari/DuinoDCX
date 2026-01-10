import * as fs from 'node:fs';
import * as path from 'node:path';
import {decode7to8} from '../protocol/encoding.js';
import {parsePreset} from '../preset-parser.js';

const DATA_DIR = path.join(process.cwd(), 'test-data', 'verification');
const OUTPUT_FILE = path.join(process.cwd(), 'preset_v3_output.json');

function loadSysEx(filename: string): Uint8Array {
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filename}`);
  }

  return new Uint8Array(fs.readFileSync(filePath));
}

function extractAndDecode(sysexStream: Uint8Array): Uint8Array {
  const messages: Uint8Array[] = [];
  let start = -1;
  for (let i = 0; i < sysexStream.length; i++) {
    if (sysexStream[i] === 0xf0) start = i;
    if (sysexStream[i] === 0xf7 && start !== -1) {
      messages.push(sysexStream.slice(start, i + 1));
      start = -1;
    }
  }

  if (messages.length === 0) throw new Error('No SysEx messages found');

  const decodedParts: Uint8Array[] = [];
  for (const message of messages) {
    const payload = message.slice(13, -2);
    try {
      const decoded = decode7to8(payload, {indexed: false});
      decodedParts.push(decoded);
    } catch (error) {
      console.error('Decoding error:', error);
    }
  }

  const totalLength = decodedParts.reduce((sum, part) => sum + part.length, 0);
  const full = new Uint8Array(totalLength);
  let offset = 0;
  for (const part of decodedParts) {
    full.set(part, offset);
    offset += part.length;
  }

  return full;
}

function main() {
  console.log('Testing Preset Parser V3...');

  // Load calibration preset
  const p0Sysex = loadSysEx('preset_00.sysex');
  const p0Decoded = extractAndDecode(p0Sysex);
  console.log(`Preset 00 Decoded Size: ${p0Decoded.length} bytes`);

  console.log('Parsing with preset-parser-v3...');
  const parsed = parsePreset(p0Decoded);

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(parsed, null, 2));
  console.log(`Saved to ${OUTPUT_FILE}`);

  // Count errors
  const jsonString = JSON.stringify(parsed);
  const errorCount = (jsonString.match(/"value":\s*"ERROR"/g) || []).length;
  console.log(`Error count in output: ${errorCount}`);

  // Verify some known calibration values
  console.log('\n=== Calibration Verification ===');
  const inputA = (parsed.inputs as any).A;
  if (inputA?.gain) {
    console.log(
      `Input A Gain: raw=${inputA.gain.raw}, value=${inputA.gain.value}`,
    );
    if (inputA.gain.raw === 300) {
      console.log('  ✓ Input A Gain correct (300 = +15dB)');
    } else {
      console.log('  ✗ Input A Gain MISMATCH - expected 300');
    }
  }

  if (inputA?.dynamicEqualizerGain) {
    console.log(
      `Input A DynEQ Gain: raw=${inputA.dynamicEqualizerGain.raw}, value=${inputA.dynamicEqualizerGain.value}`,
    );
  }

  if (inputA?.eq1) {
    console.log(
      `Input A EQ1 Freq: raw=${inputA.eq1.frequency?.raw}, value=${inputA.eq1.frequency?.value}`,
    );
    console.log(
      `Input A EQ1 Q: raw=${inputA.eq1.q?.raw}, value=${inputA.eq1.q?.value}`,
    );
    console.log(
      `Input A EQ1 Gain: raw=${inputA.eq1.gain?.raw}, value=${inputA.eq1.gain?.value}`,
    );
  }
}

main();

import * as fs from 'node:fs';
import * as path from 'node:path';
import {decode7to8} from '../protocol/encoding.js';
import {parseEditBuffer} from '../edit-buffer-parser.js';

const DATA_DIR = path.join(process.cwd(), 'test-data', 'verification');
const OUTPUT_FILE = path.join(process.cwd(), 'edit_buffer_v2.json');

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
  console.log('Loading Edit Buffer...');
  const ebSysex = loadSysEx('edit_buffer.sysex');
  const ebDecoded = extractAndDecode(ebSysex);
  console.log(`Edit Buffer Decoded Size: ${ebDecoded.length} bytes`);

  console.log('Parsing with edit-buffer-parser...');
  const parsed = parseEditBuffer(ebDecoded);

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(parsed, null, 2));
  console.log(`Saved to ${OUTPUT_FILE}`);

  // Quick sanity check
  const errorCount = JSON.stringify(parsed).split('"ERROR"').length - 1;
  console.log(`Error count in output: ${errorCount}`);
}

main();

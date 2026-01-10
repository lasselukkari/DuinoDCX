import * as fs from 'node:fs';
import * as path from 'node:path';
import {decode7to8} from '../src/protocol/encoding.js';
import {parseEditBuffer} from '../src/model/state-parser.js';

const ROOT = process.cwd();

// 1. Read Raw Edit Buffer Dump from Hex Parts
const part0Path = path.join(ROOT, 'test-data', 'edit_buffer_part0.hex');
const part1Path = path.join(ROOT, 'test-data', 'edit_buffer_part1.hex');

const readHex = (filePath: string) => {
  const hex = fs.readFileSync(filePath, 'utf8').trim();
  const cleanHex = hex.replaceAll(/[^\dA-Fa-f]/g, '');
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = Number.parseInt(cleanHex.substring(i, i + 2), 16);
  }

  return bytes;
};

const rawPart0 = readHex(part0Path);
const rawPart1 = readHex(part1Path);

// Helper to extract payload (Header 13 bytes, Footer 2 bytes)
const extractPayload = (data: Uint8Array) => data.slice(13, -2);

const payload0 = extractPayload(rawPart0);
const payload1 = extractPayload(rawPart1);

// 3. Decode 7-bit -> 8-bit (Raw/Unindexed)
const decoded0 = decode7to8(payload0, {indexed: false});
const decoded1 = decode7to8(payload1, {indexed: false});

// Concatenate
const decoded8bit = new Uint8Array(decoded0.length + decoded1.length);
decoded8bit.set(decoded0, 0);
decoded8bit.set(decoded1, decoded0.length);

console.log(`8-bit Parser Input Size: ${decoded8bit.length} bytes`);

const newState = parseEditBuffer(decoded8bit);

const destPath = path.join(ROOT, 'test-data', 'debug_edit_buffer.json');
fs.writeFileSync(destPath, JSON.stringify(newState, null, 2));

console.log(`Regenerated ${destPath}`);

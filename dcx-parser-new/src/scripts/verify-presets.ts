import * as fs from 'node:fs';
import * as path from 'node:path';
import {decode7to8} from '../protocol/encoding.js';
import {parseEditBuffer} from '../edit-buffer-parser.js';
import {parsePreset} from '../preset-parser.js';

const DATA_DIR = path.join(process.cwd(), 'test-data', 'verification');

// Helpers
function loadSysEx(filename: string): Uint8Array {
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filename}`);
  }

  return new Uint8Array(fs.readFileSync(filePath));
}

function extractAndDecode(
  sysexStream: Uint8Array,
  _type: 'editBuffer' | 'preset',
): Uint8Array {
  // Split into messages
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
    // Payload starts at 13 (HEADER_SIZE from constants, but specific to model)
    // Hardcoded 13 is typical for Behringer DCX
    const payload = message.slice(13, -2);
    try {
      const decoded = decode7to8(payload, {indexed: false});
      decodedParts.push(decoded);
    } catch (error) {
      console.error('Decoding error:', error);
    }
  }

  // Concat
  const totalLength = decodedParts.reduce((sum, part) => sum + part.length, 0);
  const full = new Uint8Array(totalLength);
  let offset = 0;
  for (const part of decodedParts) {
    full.set(part, offset);
    offset += part.length;
  }

  return full;
}

function dumpJson(name: string, data: any) {
  fs.writeFileSync(
    path.join(DATA_DIR, `${name}.json`),
    JSON.stringify(data, null, 2),
  );
}

function main() {
  try {
    console.log('Loading Edit Buffer...');
    const ebSysex = loadSysEx('edit_buffer.sysex');
    const ebDecoded = extractAndDecode(ebSysex, 'editBuffer');
    fs.writeFileSync(path.join(DATA_DIR, 'edit_buffer.bin'), ebDecoded);
    console.log(`Edit Buffer Decoded Size: ${ebDecoded.length}`);
    const ebParsed = parseEditBuffer(ebDecoded);
    dumpJson('edit_buffer_parsed', ebParsed);

    console.log('Loading Preset 00...');
    const p0Sysex = loadSysEx('preset_00.sysex');
    const p0Decoded = extractAndDecode(p0Sysex, 'preset');
    fs.writeFileSync(
      path.join(DATA_DIR, 'preset_00_calibration.bin'),
      p0Decoded,
    );
    console.log(`Preset 00 Decoded Size: ${p0Decoded.length}`);

    // IMPORTANT: preset parser expects XSNP?
    // Raw decoded SysEx usually HAS headers? No, decode7to8 returns DATA.
    // If Preset Parser expects XSNP header...
    // SysEx dump payload usually contains the header?
    // Let's check first few bytes of decoded.
    // If it starts with XSNP, fine.
    // If not, we might need to wrap it or adjust mode.
    // But `preset-parser` logic:
    // `if (hasHeader) ... offset += 7`.
    // If SysEx, header is usually part of payload?
    // No, SysEx message wraps the data.
    // The PAYLOAD of "Page Dump" -> Is it XSNP?
    // Edit Buffer payload -> Edit buffer data.
    // Preset Page Dump payload -> 1024 bytes of memory.
    // Page 0 usually contains the Header (XSNP).
    // Let's inspect bytes in log.

    const p0Parsed = parsePreset(p0Decoded);
    dumpJson('preset_00_parsed', p0Parsed);

    console.log('Comparison not implemented yet, check JSONs manually first.');
  } catch (error) {
    console.error(error);
  }
}

main();

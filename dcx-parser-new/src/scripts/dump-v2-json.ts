import * as fs from 'node:fs';
import * as path from 'node:path';
import {decode7to8} from '../protocol/encoding.js';
import {parseEditBuffer} from '../edit-buffer-parser.js';

// Helper to load hex file
function loadHexFile(filename: string): Uint8Array {
  const filePath = path.join(process.cwd(), 'test-data', filename);
  const content = fs.readFileSync(filePath, 'utf8');
  const hexString = content.replaceAll(/[^\dA-Fa-f]/g, '');

  if (hexString.length % 2 !== 0) {
    throw new Error(`Invalid hex string length in ${filename}`);
  }

  const bytes = new Uint8Array(hexString.length / 2);
  for (let i = 0; i < hexString.length; i += 2) {
    bytes[i / 2] = Number.parseInt(hexString.substring(i, i + 2), 16);
  }

  return bytes;
}

function extractSysExData(packet: Uint8Array): Uint8Array {
  if (packet.length < 15) {
    return new Uint8Array([]);
  }

  return packet.slice(13, -2);
}

function main() {
  try {
    const ebPart0 = loadHexFile('edit_buffer_part0.hex');
    const ebPart1 = loadHexFile('edit_buffer_part1.hex');

    const ebPart0Payload = extractSysExData(ebPart0);
    const ebPart1Payload = extractSysExData(ebPart1);

    const decoded0 = decode7to8(ebPart0Payload, {indexed: false});
    const decoded1 = decode7to8(ebPart1Payload, {indexed: false});

    const fullBuffer = new Uint8Array(decoded0.length + decoded1.length);
    fullBuffer.set(decoded0);
    fullBuffer.set(decoded1, decoded0.length);

    console.log(`Decoding ${fullBuffer.length} bytes...`);
    const state = parseEditBuffer(fullBuffer);

    // Serialize to JSON with handling for BigInt if any (though unlikely in this parser)
    const jsonOutput = JSON.stringify(
      state,
      (_key, value) => {
        if (value instanceof Uint8Array) {
          return `[Uint8Array ${value.length} bytes]`; // Simplify binary data
        }

        return value;
      },
      2,
    );

    const outputPath = path.join(
      process.cwd(),
      'test-data',
      'calibration',
      'edit_buffer_v2_output.json',
    );
    fs.writeFileSync(outputPath, jsonOutput);
    console.log(`Successfully wrote JSON output to: ${outputPath}`);
  } catch (error) {
    console.error('Error generating JSON dump:', error);
    process.exit(1);
  }
}

main();

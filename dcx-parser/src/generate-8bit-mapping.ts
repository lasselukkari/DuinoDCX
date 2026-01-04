/**
 * Generate 8-bit parameter mappings from commands.ts.
 *
 * This script converts the 7-bit encoded indices in commands.ts
 * to 8-bit decoded indices, producing a clean mapping file that
 * works directly with decoded data.
 *
 * Run with: npx tsx src/generate-8bit-mapping.ts
 */

import * as commands from './commands.js';

// Header size is 8 bytes: F0 00 20 32 <DevID> 0E <CMD> <PART>
const DUMP_HEADER_SIZE = 8;

// Part 0 decoded size (used to compute absolute indices for part 1)
// Wire part 0: 1015 bytes → payload 1007 bytes → decoded 875 bytes
const PART0_DECODED_SIZE = 1006;

/**
 * Convert encoded (7-bit) byte position to decoded (8-bit) index.
 * Returns the absolute index in the combined buffer (part0 + part1).
 */
function encodedToAbsolute(encodedPos: number, part: number): number {
  const payloadPos = encodedPos - DUMP_HEADER_SIZE;
  if (payloadPos < 0) return -1;

  // Add part 0 offset for part 1 indices
  return part === 0 ? payloadPos : PART0_DECODED_SIZE + payloadPos;
}

type AbsoluteSyncResponse = {
  index: number;           // Absolute index in combined buffer
  highByteIndex?: number;  // Absolute index of high byte
  bit7?: { index: number; bit: number };  // Absolute index of bit7 flag
};

function convertSyncResponse(
  syncResponse: commands.SyncResponse,
): AbsoluteSyncResponse | undefined {
  if (!syncResponse.bits6) return undefined;

  const { part } = syncResponse.bits6;
  const index = encodedToAbsolute(syncResponse.bits6.index, part);
  if (index < 0) return undefined;

  const result: AbsoluteSyncResponse = { index };

  if (syncResponse.bits8) {
    const highIdx = encodedToAbsolute(syncResponse.bits8.index, syncResponse.bits8.part);
    if (highIdx >= 0) {
      result.highByteIndex = highIdx;
    }
  }

  if (syncResponse.bit7) {
    const bit7Idx = encodedToAbsolute(syncResponse.bit7.index, syncResponse.bit7.part);
    if (bit7Idx >= 0) {
      result.bit7 = {
        index: bit7Idx,
        bit: syncResponse.bit7.bit,
      };
    }
  }

  return result;
}

/**
 * Convert AbsoluteSyncResponse to output mapping object.
 */
function toMappingObject(m: AbsoluteSyncResponse | undefined): object | null {
  if (!m) return null;
  return {
    index: m.index,
    ...(m.highByteIndex !== undefined ? { highByteIndex: m.highByteIndex } : {}),
    ...(m.bit7 ? { bit7: m.bit7 } : {}),
  };
}

// Generate all mappings
console.log('// Auto-generated 8-bit parameter mappings');
console.log('// Indices are absolute positions in combined decoded buffer (part0 + part1)');
console.log('');
console.log('export type ParameterInfo = {');
console.log('  name: string;');
console.log('  type: "bool" | "enum" | "number";');
console.log('  index: number;');
console.log('  highByteIndex?: number;');
console.log('  bit7?: { index: number; bit: number };');
console.log('  values?: readonly string[];');
console.log('  unit?: string;');
console.log('  min?: number;');
console.log('  max?: number;');
console.log('  step?: number;');
console.log('};');
console.log('');

// Setup parameters
console.log('export const setupParameters: ParameterInfo[] = [');
for (const cmd of commands.setupCommands) {
  if (!cmd.syncResponse) continue;
  const decoded = convertSyncResponse(cmd.syncResponse);
  if (!decoded) continue;

  console.log('  {');
  console.log(`    name: ${JSON.stringify(cmd.name)},`);
  console.log(`    type: ${JSON.stringify(cmd.type)},`);
  console.log(`    index: ${decoded.index},`);
  if (decoded.highByteIndex !== undefined) {
    console.log(`    highByteIndex: ${decoded.highByteIndex},`);
  }
  if (decoded.bit7) {
    console.log(`    bit7: ${JSON.stringify(decoded.bit7)},`);
  }

  if (cmd.values) {
    console.log(`    values: ${JSON.stringify(cmd.values)},`);
  }

  if (cmd.unit) {
    console.log(`    unit: ${JSON.stringify(cmd.unit)},`);
  }

  if (cmd.min !== undefined) {
    console.log(`    min: ${cmd.min},`);
  }

  if (cmd.max !== undefined) {
    console.log(`    max: ${cmd.max},`);
  }

  if (cmd.step !== undefined) {
    console.log(`    step: ${cmd.step},`);
  }

  console.log('  },');
}

console.log('];');
console.log('');

// Input/Output channel parameters (10 channels: A, B, C, Sum, 1-6)
console.log(
  '// Channel indices: 0=A, 1=B, 2=C, 3=Sum, 4=Out1, 5=Out2, 6=Out3, 7=Out4, 8=Out5, 9=Out6',
);
console.log('export const channelParameters: Array<{');
console.log('  name: string;');
console.log('  type: "bool" | "enum" | "number";');
console.log(
  '  channels: Array<{ index: number; highByteIndex?: number; bit7?: { index: number; bit: number } } | null>;',
);
console.log('  values?: readonly string[];');
console.log('  unit?: string;');
console.log('  min?: number;');
console.log('  max?: number;');
console.log('  step?: number;');
console.log('}> = [');

for (const cmd of commands.inputOutputCommands) {
  if (!cmd.syncResponses) continue;

  console.log('  {');
  console.log(`    name: ${JSON.stringify(cmd.name)},`);
  console.log(`    type: ${JSON.stringify(cmd.type)},`);

  const channelMappings = cmd.syncResponses.map((sr) =>
    convertSyncResponse(sr),
  );
  console.log(
    `    channels: ${JSON.stringify(channelMappings.map(toMappingObject))},`,
  );

  if (cmd.values) {
    console.log(`    values: ${JSON.stringify(cmd.values)},`);
  }

  if (cmd.unit) {
    console.log(`    unit: ${JSON.stringify(cmd.unit)},`);
  }

  if (cmd.min !== undefined) {
    console.log(`    min: ${cmd.min},`);
  }

  if (cmd.max !== undefined) {
    console.log(`    max: ${cmd.max},`);
  }

  if (cmd.step !== undefined) {
    console.log(`    step: ${cmd.step},`);
  }

  console.log('  },');
}

console.log('];');
console.log('');

// Output-only parameters (6 outputs)
console.log('// Output-only parameters (indices 0-5 = outputs 1-6)');
console.log('export const outputOnlyParameters: Array<{');
console.log('  name: string;');
console.log('  type: "bool" | "enum" | "number";');
console.log(
  '  outputs: Array<{ index: number; highByteIndex?: number; bit7?: { index: number; bit: number } } | null>;',
);
console.log('  values?: readonly string[];');
console.log('  unit?: string;');
console.log('  min?: number;');
console.log('  max?: number;');
console.log('  step?: number;');
console.log('}> = [');

for (const cmd of commands.outputCommands) {
  if (!cmd.syncResponses) continue;

  console.log('  {');
  console.log(`    name: ${JSON.stringify(cmd.name)},`);
  console.log(`    type: ${JSON.stringify(cmd.type)},`);

  const outputMappings = cmd.syncResponses.map((sr) => convertSyncResponse(sr));
  console.log(
    `    outputs: ${JSON.stringify(outputMappings.map(toMappingObject))},`,
  );

  if (cmd.values) {
    console.log(`    values: ${JSON.stringify(cmd.values)},`);
  }

  if (cmd.unit) {
    console.log(`    unit: ${JSON.stringify(cmd.unit)},`);
  }

  if (cmd.min !== undefined) {
    console.log(`    min: ${cmd.min},`);
  }

  if (cmd.max !== undefined) {
    console.log(`    max: ${cmd.max},`);
  }

  if (cmd.step !== undefined) {
    console.log(`    step: ${cmd.step},`);
  }

  console.log('  },');
}

console.log('];');
console.log('');

// EQ parameters (9 bands × 10 channels = 90 entries per parameter)
console.log('// EQ parameters: 9 bands per channel, 10 channels');
console.log(
  '// Access as: eqParameters[paramIndex].bands[channelIndex * 9 + bandIndex]',
);
console.log('export const eqParameters: Array<{');
console.log('  name: string;');
console.log('  type: "bool" | "enum" | "number";');
console.log(
  '  bands: Array<{ index: number; highByteIndex?: number; bit7?: { index: number; bit: number } } | null>;',
);
console.log('  values?: readonly string[];');
console.log('  unit?: string;');
console.log('  min?: number;');
console.log('  max?: number;');
console.log('  step?: number;');
console.log('}> = [');

for (const cmd of commands.eqCommands) {
  if (!cmd.syncResponses) continue;

  console.log('  {');
  console.log(`    name: ${JSON.stringify(cmd.name)},`);
  console.log(`    type: ${JSON.stringify(cmd.type)},`);

  const bandMappings = cmd.syncResponses.map((sr) => convertSyncResponse(sr));
  console.log(
    `    bands: ${JSON.stringify(bandMappings.map(toMappingObject))},`,
  );

  if (cmd.values) {
    console.log(`    values: ${JSON.stringify(cmd.values)},`);
  }

  if (cmd.unit) {
    console.log(`    unit: ${JSON.stringify(cmd.unit)},`);
  }

  if (cmd.min !== undefined) {
    console.log(`    min: ${cmd.min},`);
  }

  if (cmd.max !== undefined) {
    console.log(`    max: ${cmd.max},`);
  }

  if (cmd.step !== undefined) {
    console.log(`    step: ${cmd.step},`);
  }

  console.log('  },');
}

console.log('];');

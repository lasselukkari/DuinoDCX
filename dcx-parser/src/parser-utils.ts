import {
  INPUT_CHANNEL_PARAMS,
  EQ_BAND_PARAMS,
  OUTPUT_EXTRA_PARAMS,
  type ParameterDefinition,
} from './structure.js';
import {
  setupCommands,
  inputOutputCommands,
  outputCommands,
  equalizerCommands,
  type Command,
} from './commands/commands.js';
import {
  type InputChannel,
  type OutputChannel,
  type Equalizer,
} from './types/index.js';

// ============================================================================
// Build Command Lookup by Parameter Name (camelCase)
// ============================================================================

function toCamelCase(name: string): string {
  return name
    .replaceAll(/\s(.)/g, (match) => match.toUpperCase())
    .replaceAll(/\s/g, '')
    .replace(/^(.)/, (match) => match.toLowerCase());
}

const COMMAND_BY_NAME: Record<string, Command> = {};

// Build lookup from all command arrays (filter undefineds from setupCommands)
for (const cmd of [
  ...setupCommands.filter((c): c is Command => c !== undefined),
  ...inputOutputCommands,
  ...outputCommands,
  ...equalizerCommands,
]) {
  COMMAND_BY_NAME[toCamelCase(cmd.name)] = cmd;
}

/**
 * Convert raw value to actual value using command definition.
 * This is the old UI's reverseCommandData pattern.
 */
function convertRaw(
  parameterName: string,
  raw: number,
): number | string | boolean {
  const cmd = COMMAND_BY_NAME[parameterName];
  if (!cmd) {
    return raw; // Unknown parameter, return raw
  }

  if (cmd.type === 'bool') {
    return raw !== 0;
  }

  if (cmd.type === 'enum' && cmd.values) {
    if (raw < 0 || raw >= cmd.values.length) {
      throw new Error(
        `Invalid enum value ${raw} for parameter "${parameterName}" (valid range: 0-${cmd.values.length - 1})`,
      );
    }

    return cmd.values[raw];
  }

  if (cmd.type === 'number') {
    const min = cmd.min ?? 0;
    const step = cmd.step ?? 1;
    const value = min + step * raw;
    return Math.round(value * 100) / 100;
  }

  return raw;
}

// ============================================================================
// Cursor and Reading Utilities
// ============================================================================

// Cursor to track parsing position statefully
export type Cursor = {
  buffer: Uint8Array;
  offset: number;
};

export function readString(
  buffer: Uint8Array,
  offset: number,
  length: number,
): string {
  const slice = buffer.subarray(offset, offset + length);
  // Remove undefined bytes but keep whitespace (fixed length fields)
  let end = 0;
  while (end < slice.length && slice[end] !== 0) end++;
  return new TextDecoder().decode(slice.subarray(0, end));
}

export function readU16LE(buffer: Uint8Array, offset: number): number {
  return buffer[offset] | (buffer[offset + 1] << 8);
}

export function readBytes(
  buffer: Uint8Array,
  offset: number,
  length: number,
): Uint8Array {
  return buffer.slice(offset, offset + length); // Copy
}

// Read U16 and advance cursor
export function nextU16(cursor: Cursor): number {
  const value = readU16LE(cursor.buffer, cursor.offset);
  cursor.offset += 2;
  return value;
}

// ============================================================================
// Sequential Parsing
// ============================================================================

export function parseSequential(
  cursor: Cursor,
  parameters: ParameterDefinition[],
): Record<string, number | string | boolean> {
  const result: Record<string, number | string | boolean> = {};

  for (const parameter of parameters) {
    if (parameter === undefined) {
      cursor.offset += 2;
      continue;
    }

    if (typeof parameter === 'string') {
      const raw = nextU16(cursor);
      result[parameter] = convertRaw(parameter, raw);
    } else {
      const def = parameter as {name: string; type: string; length?: number};
      const {name, type, length} = def;

      if (type === 'string' && length) {
        const stringBytes = readBytes(cursor.buffer, cursor.offset, length);
        cursor.offset += length;
        let stringValue = '';
        for (const b of stringBytes) {
          if (b !== 0) stringValue += String.fromCodePoint(b);
        }

        result[name] = stringValue.trim();
      } else if (type === 'skip') {
        cursor.offset += length || 2;
      } else if (type === 'uint32') {
        const b0 = cursor.buffer[cursor.offset];
        const b1 = cursor.buffer[cursor.offset + 1];
        const b2 = cursor.buffer[cursor.offset + 2];
        const b3 = cursor.buffer[cursor.offset + 3];
        cursor.offset += 4;
        const value = ((b3 << 24) | (b2 << 16) | (b1 << 8) | b0) >>> 0;
        result[name] = value;
      }
    }
  }

  return result;
}

export function parseInputChannel(cursor: Cursor): InputChannel {
  const baseParameters = parseSequential(cursor, INPUT_CHANNEL_PARAMS);

  const parameters = {...baseParameters, equalizers: {}} as InputChannel;

  // Parse 9 EQ bands
  for (let i = 1; i <= 9; i++) {
    parameters.equalizers[String(i)] = parseSequential(
      cursor,
      EQ_BAND_PARAMS,
    ) as any as Equalizer;
  }

  return parameters;
}

export function parseOutputChannel(cursor: Cursor): OutputChannel {
  // 1. Basic Prefix (Shared with Input)
  const prefix = parseSequential(cursor, INPUT_CHANNEL_PARAMS);

  // 2. 9 EQ Bands
  const equalizers: Record<string, Equalizer> = {};
  for (let i = 1; i <= 9; i++) {
    equalizers[String(i)] = parseSequential(
      cursor,
      EQ_BAND_PARAMS,
    ) as any as Equalizer;
  }

  // 3. Extra Output Params (Name, Source, Filters, etc.) - AFTER EQs in binary
  const extra = parseSequential(cursor, OUTPUT_EXTRA_PARAMS);

  return {...prefix, equalizers, ...extra} as OutputChannel;
}

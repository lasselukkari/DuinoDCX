import { INPUT_CHANNEL_PARAMETERS, EQUALIZER_BAND_PARAMETERS, OUTPUT_EXTRA_PARAMETERS, } from './structure.js';
import { setupCommands, inputOutputCommands, outputCommands, equalizerCommands, } from './commands/commands.js';
// ============================================================================
// Build Command Lookup by Parameter Name (camelCase)
// ============================================================================
function toCamelCase(name) {
    return name
        .replaceAll(/\s(.)/g, (match) => match.toUpperCase())
        .replaceAll(/\s/g, '')
        .replace(/^(.)/, (match) => match.toLowerCase());
}
const COMMAND_BY_NAME = {};
// Build lookup from all command arrays (filter undefineds from setupCommands)
for (const cmd of [
    ...setupCommands.filter((c) => c !== undefined),
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
function convertRaw(parameterName, raw) {
    const cmd = COMMAND_BY_NAME[parameterName];
    if (!cmd) {
        return raw; // Unknown parameter, return raw
    }
    if (cmd.type === 'bool') {
        return raw !== 0;
    }
    if (cmd.type === 'enum' && cmd.values) {
        if (raw < 0 || raw >= cmd.values.length) {
            throw new Error(`Invalid enum value ${raw} for parameter "${parameterName}" (valid range: 0-${cmd.values.length - 1})`);
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
export function readString(buffer, offset, length) {
    const slice = buffer.subarray(offset, offset + length);
    // Remove undefined bytes but keep whitespace (fixed length fields)
    let end = 0;
    while (end < slice.length && slice[end] !== 0)
        end++;
    return new TextDecoder().decode(slice.subarray(0, end));
}
export function readU16LE(buffer, offset) {
    return buffer[offset] | (buffer[offset + 1] << 8);
}
export function readBytes(buffer, offset, length) {
    return buffer.slice(offset, offset + length); // Copy
}
// Read U16 and advance cursor
export function nextU16(cursor) {
    const value = readU16LE(cursor.buffer, cursor.offset);
    cursor.offset += 2;
    return value;
}
// ============================================================================
// Sequential Parsing
// ============================================================================
export function parseSequential(cursor, parameters) {
    const result = {};
    for (const parameter of parameters) {
        if (parameter === undefined) {
            cursor.offset += 2;
            continue;
        }
        if (typeof parameter === 'string') {
            const raw = nextU16(cursor);
            result[parameter] = convertRaw(parameter, raw);
        }
        else {
            const def = parameter;
            const { name, type, length } = def;
            if (type === 'string' && length) {
                const stringBytes = readBytes(cursor.buffer, cursor.offset, length);
                cursor.offset += length;
                let stringValue = '';
                for (const b of stringBytes) {
                    if (b !== 0)
                        stringValue += String.fromCodePoint(b);
                }
                result[name] = stringValue.trim();
            }
            else if (type === 'skip') {
                cursor.offset += length ?? 2;
            }
            else if (type === 'uint32') {
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
export function parseInputChannel(cursor) {
    const baseParameters = parseSequential(cursor, INPUT_CHANNEL_PARAMETERS);
    const equalizers = {};
    // Parse 9 EQ bands
    for (let i = 1; i <= 9; i++) {
        equalizers[String(i)] = parseSequential(cursor, EQUALIZER_BAND_PARAMETERS);
    }
    return { ...baseParameters, equalizers };
}
export function parseOutputChannel(cursor) {
    // 1. Basic Prefix (Shared with Input)
    const prefix = parseSequential(cursor, INPUT_CHANNEL_PARAMETERS);
    // 2. 9 EQ Bands
    const equalizers = {};
    for (let i = 1; i <= 9; i++) {
        equalizers[String(i)] = parseSequential(cursor, EQUALIZER_BAND_PARAMETERS);
    }
    // 3. Extra Output Params (Name, Source, Filters, etc.) - AFTER EQs in binary
    const extra = parseSequential(cursor, OUTPUT_EXTRA_PARAMETERS);
    return { ...prefix, equalizers, ...extra };
}
/**
 * Parse input channel names from trailing UTF-16LE block.
 * After outputs, there's 24 bytes of padding, then 4 input channel names.
 * Each name: 16 bytes (8 UTF-16LE chars) + 4 bytes padding = 20 bytes.
 */
export function parseInputChannelNames(cursor, inputs) {
    const inputNames = ['A', 'B', 'C', 'Sum'];
    const inputNameOffset = cursor.offset + 24; // Skip 24-byte padding
    for (let i = 0; i < inputNames.length; i++) {
        const nameStart = inputNameOffset + i * 20;
        if (nameStart + 16 <= cursor.buffer.length) {
            const nameBytes = cursor.buffer.slice(nameStart, nameStart + 16);
            const decoder = new TextDecoder('utf-16le');
            const channelName = decoder.decode(nameBytes).trim();
            inputs[inputNames[i]].channelName = channelName;
        }
    }
}
//# sourceMappingURL=parser-utils.js.map
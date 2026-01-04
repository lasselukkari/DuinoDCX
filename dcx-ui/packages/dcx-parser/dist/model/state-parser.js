/**
 * State parser for DCX2496.
 *
 * Parses decoded device data into a State object.
 * Uses the same logic for:
 * - Edit buffer (two parts from device)
 * - Preset data (from .dcx files)
 */
import { byteLookup, convertValue, applyToState, } from './param-lookup.js';
import { createEmptyState, } from './helpers.js';
// ============================================================================
// Data Source Factories
// ============================================================================
/**
 * Create data source from two edit buffer parts.
 */
/**
 * Create data source from two edit buffer parts.
 * Combines them into a single buffer.
 */
export function fromParts(part0, part1) {
    const combined = new Uint8Array(part0.length + part1.length);
    combined.set(part0);
    combined.set(part1, part0.length);
    return {
        readByte(index) {
            return combined[index] ?? 0;
        },
    };
}
/**
 * Create data source from continuous preset buffer.
 * Maps continuous data to the two-part structure.
 */
/**
 * Create data source from continuous preset buffer.
 */
export function fromPreset(data) {
    return {
        readByte(index) {
            return data[index] ?? 0;
        },
    };
}
// ============================================================================
// Value Reading
// ============================================================================
function readRawValue(source, index, highByteIndex) {
    let value = source.readByte(index);
    // High byte for 16-bit values
    if (highByteIndex !== undefined) {
        const high = source.readByte(highByteIndex);
        value += high * 256;
    }
    return value;
}
function readString(source, index, maxLength) {
    let str = '';
    for (let i = 0; i < maxLength; i++) {
        const charCode = source.readByte(index + i);
        if (charCode === 0)
            break;
        str += String.fromCharCode(charCode);
    }
    return str.trim();
}
// ============================================================================
// State Initialization
// ============================================================================
// ============================================================================
// Parsing
// ============================================================================
/**
 * Parse complete state by iterating over the byte lookup table.
 * This is efficient because we only visit each parameter once.
 */
export function parseState(source) {
    const state = createEmptyState();
    // Parse strings not covered by standard parameter mapping
    state.presetName = readString(source, 90, 16);
    // Iterate through all known byte positions
    for (const [key, def] of byteLookup) {
        const index = Number(key);
        // Read raw value (including bit7 for DCX protocol value reconstruction)
        const raw = readRawValue(source, index, def.highByteIndex);
        // Convert to typed value
        const value = convertValue(def, raw);
        // Store in state
        applyToState(state, def, value);
    }
    return state;
}
// ============================================================================
// Convenience Functions
// ============================================================================
/**
 * Parse state from edit buffer parts.
 */
export function parseEditBuffer(part0, part1) {
    return parseState(fromParts(part0, part1));
}
/**
 * Parse state from preset data.
 */
export function parsePresetData(data) {
    return parseState(fromPreset(data));
}
//# sourceMappingURL=state-parser.js.map
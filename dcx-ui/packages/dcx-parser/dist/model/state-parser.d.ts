/**
 * State parser for DCX2496.
 *
 * Parses decoded device data into a State object.
 * Uses the same logic for:
 * - Edit buffer (two parts from device)
 * - Preset data (from .dcx files)
 */
import type { State } from '../types/index.js';
/**
 * Data source abstraction for reading bytes.
 * Allows same parsing logic for different data layouts.
 */
export type DataSource = {
    readByte(index: number): number;
};
/**
 * Create data source from two edit buffer parts.
 */
/**
 * Create data source from two edit buffer parts.
 * Combines them into a single buffer.
 */
export declare function fromParts(part0: Uint8Array, part1: Uint8Array): DataSource;
/**
 * Create data source from continuous preset buffer.
 * Maps continuous data to the two-part structure.
 */
/**
 * Create data source from continuous preset buffer.
 */
export declare function fromPreset(data: Uint8Array): DataSource;
/**
 * Parse complete state by iterating over the byte lookup table.
 * This is efficient because we only visit each parameter once.
 */
export declare function parseState(source: DataSource): State;
/**
 * Parse state from edit buffer parts.
 */
export declare function parseEditBuffer(part0: Uint8Array, part1: Uint8Array): State;
/**
 * Parse state from preset data.
 */
export declare function parsePresetData(data: Uint8Array): State;
//# sourceMappingURL=state-parser.d.ts.map
/**
 * Parameter lookup tables for DCX2496.
 *
 * This module provides O(1) lookups for parsing decoded data.
 * The same lookup tables work for:
 * - Edit buffer (two parts)
 * - Preset data (continuous buffer mapped to parts)
 * - Direct commands (channel/param → property)
 *
 * Key design decisions:
 * - Pre-computed Map<string, ParameterDefinition> keyed by "part:index" for byte lookups
 * - Pre-computed Map<string, ParameterDefinition> keyed by "channel:param" for direct commands
 * - All lookups are O(1)
 */
/** Parameter definition for lookups */
export type ParameterDefinition = {
    /** Property name (camelCase) */
    key: string;
    /** Value type */
    type: 'bool' | 'enum' | 'number';
    /** Enum values if type is 'enum' */
    values?: readonly string[];
    /** For numbers: minimum value */
    min?: number;
    /** For numbers: step size */
    step?: number;
    /** High byte index for 16-bit values (absolute index) */
    highByteIndex?: number;
    /** Word offset in preset data (16-bit words) */
    wordOffset?: number;
    /** High word offset for 32-bit parameters in preset data */
    wordHighOffset?: number;
    /** Target location in state */
    target: {
        kind: 'setup';
    } | {
        kind: 'channel';
        group: 'inputs' | 'outputs';
        id: string;
    } | {
        kind: 'equalizer';
        group: 'inputs' | 'outputs';
        channelId: string;
        band: number;
    };
};
/** Lookup key for byte position (absolute index) */
export type ByteKey = number;
/** Lookup key for direct command */
export type DirectKey = `${number}:${number}`;
/** O(1) lookup by (part, byteIndex) for parsing dumps */
export declare const byteLookup: Map<number, ParameterDefinition>;
/**
 * Maps word index in preset data to parameter definition.
 */
export declare const wordLookup: Map<number, ParameterDefinition>;
/** O(1) lookup by (channel, param) for direct commands */
export declare const directLookup: Map<`${number}:${number}`, ParameterDefinition>;
/**
 * Get parameter definition by byte position (absolute index in combined buffer).
 */
export declare function getParameterByByte(index: number): ParameterDefinition | undefined;
/**
 * Get parameter definition by direct command address.
 */
export declare function getParameterByDirect(channel: number, parameter: number): ParameterDefinition | undefined;
/**
 * Convert raw value to typed value based on parameter definition.
 */
export declare function convertValue(def: ParameterDefinition, raw: number): boolean | string | number;
/**
 * Convert typed value to raw value for sending to device.
 */
export declare function toRawValue(def: ParameterDefinition, value: boolean | string | number): number;
/**
 * Apply a value to the correct location in state.
 */
export declare function applyToState(state: any, def: ParameterDefinition, value: boolean | string | number): void;
//# sourceMappingURL=param-lookup.d.ts.map
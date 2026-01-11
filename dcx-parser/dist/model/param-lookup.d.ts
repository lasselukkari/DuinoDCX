import { type Command } from '../commands/commands.js';
import { type State } from '../types/index.js';
/** Parameter definition for lookups (Matched to Command + Target info) */
export type ParameterDefinition = Command & {
    /** Target Property Key (camelCase) */
    key: string;
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
        channelIdProp?: string;
    };
};
/** Lookup key for direct command */
export type DirectKey = `${number}:${number}`;
/** O(1) lookup by (channel, param) for direct commands */
export declare const directLookup: Map<`${number}:${number}`, ParameterDefinition>;
export declare function getParameterByDirect(channel: number, parameter: number): ParameterDefinition | undefined;
/**
 * Convert raw value to actual value using command definition.
 * This is the old UI's reverseCommandData pattern.
 */
export declare function convertValue(def: ParameterDefinition, raw: number): boolean | string | number;
/**
 * Convert actual value to raw value using command definition.
 * This is the old UI's getCommandData pattern.
 */
export declare function toRawValue(def: ParameterDefinition, value: boolean | string | number): number;
/**
 * Apply a value to the correct location in state.
 */
export declare function applyToState(state: State, def: ParameterDefinition, value: boolean | string | number): void;
//# sourceMappingURL=param-lookup.d.ts.map
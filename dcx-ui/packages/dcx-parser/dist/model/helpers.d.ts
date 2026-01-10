import type {State, Channel, Equalizer} from '../types/index.js';

export declare function createEmptyEqualizer(): Equalizer;
export declare function createEmptyChannel(): Channel;
export declare function createEmptyState(): State;
/**
 * Convert a command name to a camelCase property key.
 * "Is Delay On" → "isDelayOn"
 * "Equalizer Frequency" → "equalizerFrequency"
 */
export declare function camelize(string_: string): string;
// # sourceMappingURL=helpers.d.ts.map

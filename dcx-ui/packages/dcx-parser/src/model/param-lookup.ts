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

import {
  setupParameters,
  channelParameters,
  outputOnlyParameters,
  equalizerParameters,
} from './parameter-mappings.js';

// ============================================================================
// Types
// ============================================================================

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
  target:
    | {kind: 'setup'}
    | {kind: 'channel'; group: 'inputs' | 'outputs'; id: string}
    | {
        kind: 'equalizer';
        group: 'inputs' | 'outputs';
        channelId: string;
        band: number;
      };
};

/** Lookup key for byte position (absolute index) */
export type ByteKey = number;

/** Lookup key for direct command */
export type DirectKey = `${number}:${number}`; // "channel:param"

// ============================================================================
// Constants
// ============================================================================

const INPUT_IDS = ['A', 'B', 'C', 'Sum'] as const;
const OUTPUT_IDS = ['1', '2', '3', '4', '5', '6'] as const;
const CHANNEL_IDS = [...INPUT_IDS, ...OUTPUT_IDS] as const;
const EQUALIZER_BANDS = 9;

// ============================================================================
// Helpers
// ============================================================================

function toCamelCase(name: string): string {
  return name
    .split(' ')
    .map((word, i) =>
      i === 0
        ? word.toLowerCase()
        : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
    )
    .join('');
}

function makeDirectKey(channel: number, parameter: number): DirectKey {
  return `${channel}:${parameter}`;
}

// ============================================================================
// Build Lookup Tables
// ============================================================================

function buildByteLookup(): Map<ByteKey, ParameterDefinition> {
  const lookup = new Map<ByteKey, ParameterDefinition>();

  // Setup parameters
  for (const parameter of setupParameters) {
    const def: ParameterDefinition = {
      key: toCamelCase(parameter.name),
      type: parameter.type,
      values: parameter.values,
      min: parameter.min,
      step: parameter.step,
      highByteIndex: parameter.highByteIndex,
      target: {kind: 'setup'},
    };
    lookup.set(parameter.index, def);
  }

  // Channel parameters (inputs + outputs)
  for (const parameter of channelParameters) {
    for (let i = 0; i < parameter.channels.length; i++) {
      const loc = parameter.channels[i];
      if (!loc) continue;

      const isInput = i < 4;
      const channelId = CHANNEL_IDS[i];

      const def: ParameterDefinition = {
        key: toCamelCase(parameter.name),
        type: parameter.type,
        values: parameter.values,
        min: parameter.min,
        step: parameter.step,
        highByteIndex: loc.highByteIndex,
        target: {
          kind: 'channel',
          group: isInput ? 'inputs' : 'outputs',
          id: channelId,
        },
      };
      lookup.set(loc.index, def);
    }
  }

  // Output-only parameters
  for (const parameter of outputOnlyParameters) {
    for (let i = 0; i < parameter.outputs.length; i++) {
      const loc = parameter.outputs[i];
      if (!loc) continue;

      const def: ParameterDefinition = {
        key: toCamelCase(parameter.name),
        type: parameter.type,
        values: parameter.values,
        min: parameter.min,
        step: parameter.step,
        highByteIndex: loc.highByteIndex,
        target: {
          kind: 'channel',
          group: 'outputs',
          id: OUTPUT_IDS[i],
        },
      };
      lookup.set(loc.index, def);
    }
  }

  // Equalizer parameters
  for (const parameter of equalizerParameters) {
    for (let i = 0; i < parameter.bands.length; i++) {
      const loc = parameter.bands[i];
      if (!loc) continue;

      const channelIndex = Math.floor(i / EQUALIZER_BANDS);
      const bandIndex = i % EQUALIZER_BANDS;
      const isInput = channelIndex < 4;

      const def: ParameterDefinition = {
        key: toCamelCase(parameter.name),
        type: parameter.type,
        values: parameter.values,
        min: parameter.min,
        step: parameter.step,
        highByteIndex: loc.highByteIndex,
        target: {
          kind: 'equalizer',
          group: isInput ? 'inputs' : 'outputs',
          id: CHANNEL_IDS[channelIndex],
          band: bandIndex + 1,
        } as any,
      };
      // Temporary hack to avoid fixing all types deeply right now
      (def.target as any).channelId = (def.target as any).id;
      lookup.set(loc.index, def);
    }
  }

  return lookup;
}

function buildWordLookup(): Map<number, ParameterDefinition> {
  const lookup = new Map<number, ParameterDefinition>();

  // Use the same logic as buildByteLookup but map by wordOffset
  // Setup parameters
  for (const parameter of setupParameters) {
    if (parameter.wordOffset !== undefined) {
      const def: ParameterDefinition = {
        key: toCamelCase(parameter.name),
        type: parameter.type,
        values: parameter.values,
        min: parameter.min,
        step: parameter.step,
        highByteIndex: parameter.highByteIndex,
        wordOffset: parameter.wordOffset,
        wordHighOffset: parameter.wordHighOffset,
        target: {kind: 'setup'},
      };
      lookup.set(parameter.wordOffset, def);
    }
  }

  // Channel parameters (inputs + outputs)
  for (const parameter of channelParameters) {
    for (let i = 0; i < parameter.channels.length; i++) {
      const loc = parameter.channels[i];
      if (loc?.wordOffset === undefined) continue;

      const isInput = i < 4;
      const channelId = CHANNEL_IDS[i];

      const def: ParameterDefinition = {
        key: toCamelCase(parameter.name),
        type: parameter.type,
        values: parameter.values,
        min: parameter.min,
        step: parameter.step,
        highByteIndex: loc.highByteIndex,
        wordOffset: loc.wordOffset,
        wordHighOffset: loc.wordHighOffset,
        target: {
          kind: 'channel',
          group: isInput ? 'inputs' : 'outputs',
          id: channelId,
        },
      };
      lookup.set(loc.wordOffset, def);
    }
  }

  // Output-only parameters
  for (const parameter of outputOnlyParameters) {
    for (let i = 0; i < parameter.outputs.length; i++) {
      const loc = parameter.outputs[i];
      if (loc?.wordOffset === undefined) continue;

      const def: ParameterDefinition = {
        key: toCamelCase(parameter.name),
        type: parameter.type,
        values: parameter.values,
        min: parameter.min,
        step: parameter.step,
        highByteIndex: loc.highByteIndex,
        wordOffset: loc.wordOffset,
        wordHighOffset: loc.wordHighOffset,
        target: {
          kind: 'channel',
          group: 'outputs',
          id: OUTPUT_IDS[i],
        },
      };
      lookup.set(loc.wordOffset, def);
    }
  }

  // Equalizer parameters
  for (const parameter of equalizerParameters) {
    for (let i = 0; i < parameter.bands.length; i++) {
      const loc = parameter.bands[i];
      if (loc?.wordOffset === undefined) continue;

      const channelIndex = Math.floor(i / EQUALIZER_BANDS);
      const bandIndex = i % EQUALIZER_BANDS;
      const isInput = channelIndex < 4;

      const def: ParameterDefinition = {
        key: toCamelCase(parameter.name),
        type: parameter.type,
        values: parameter.values,
        min: parameter.min,
        step: parameter.step,
        highByteIndex: loc.highByteIndex,
        wordOffset: loc.wordOffset,
        wordHighOffset: loc.wordHighOffset,
        target: {
          kind: 'equalizer',
          group: isInput ? 'inputs' : 'outputs',
          id: CHANNEL_IDS[channelIndex],
          band: bandIndex + 1,
        } as any,
      };
      (def.target as any).channelId = (def.target as any).id;
      lookup.set(loc.wordOffset, def);
    }
  }

  return lookup;
}

function buildDirectLookup(): Map<DirectKey, ParameterDefinition> {
  const lookup = new Map<DirectKey, ParameterDefinition>();

  // Channel 0 = Setup
  // Setup params: indices 2-11 and 12-17 map to setupCommands
  for (const [i, parameter] of setupParameters.entries()) {
    // Setup command numbers: 2-11 for first 10, then 12-17 for rest
    const parameterNumber = i < 10 ? i + 2 : i + 2;

    const def: ParameterDefinition = {
      key: toCamelCase(parameter.name),
      type: parameter.type,
      values: parameter.values,
      min: parameter.min,
      step: parameter.step,
      target: {kind: 'setup'},
    };
    lookup.set(makeDirectKey(0, parameterNumber), def);
  }

  // Channels 1-4 = Inputs (A, B, C, Sum)
  // Channels 5-10 = Outputs (1-6)
  for (let ch = 1; ch <= 10; ch++) {
    const isInput = ch <= 4;
    const channelId = isInput ? INPUT_IDS[ch - 1] : OUTPUT_IDS[ch - 5];
    const group = isInput ? 'inputs' : 'outputs';

    // Channel params: 2-18
    for (const [i, parameter] of channelParameters.entries()) {
      const parameterNumber = i + 2;

      const def: ParameterDefinition = {
        key: toCamelCase(parameter.name),
        type: parameter.type,
        values: parameter.values,
        min: parameter.min,
        step: parameter.step,
        target: {kind: 'channel', group, id: channelId},
      };
      lookup.set(makeDirectKey(ch, parameterNumber), def);
    }

    // Equalizer params: 19-63 (9 bands × 5 params)
    for (let band = 0; band < EQUALIZER_BANDS; band++) {
      for (const [i, parameter] of equalizerParameters.entries()) {
        const parameterNumber = 19 + band * 5 + i;

        const def: ParameterDefinition = {
          key: toCamelCase(parameter.name),
          type: parameter.type,
          values: parameter.values,
          min: parameter.min,
          step: parameter.step,
          target: {
            kind: 'equalizer',
            group,
            id: channelId,
            band: band + 1,
          } as any,
        };
        (def.target as any).channelId = (def.target as any).id;
        lookup.set(makeDirectKey(ch, parameterNumber), def);
      }
    }

    // Output-only params: 64+
    if (!isInput) {
      for (const [i, parameter] of outputOnlyParameters.entries()) {
        const parameterNumber = 64 + i;

        const def: ParameterDefinition = {
          key: toCamelCase(parameter.name),
          type: parameter.type,
          values: parameter.values,
          min: parameter.min,
          step: parameter.step,
          target: {kind: 'channel', group: 'outputs', id: channelId},
        };
        lookup.set(makeDirectKey(ch, parameterNumber), def);
      }
    }
  }

  return lookup;
}

// ============================================================================
// Pre-built Lookup Tables (singleton)
// ============================================================================

/** O(1) lookup by (part, byteIndex) for parsing dumps */
export const byteLookup = buildByteLookup();

/**
 * Maps word index in preset data to parameter definition.
 */
export const wordLookup = buildWordLookup();

/** O(1) lookup by (channel, param) for direct commands */
export const directLookup = buildDirectLookup();

// ============================================================================
// Lookup Functions
// ============================================================================

/**
 * Get parameter definition by byte position (absolute index in combined buffer).
 */
export function getParameterByByte(
  index: number,
): ParameterDefinition | undefined {
  return byteLookup.get(index);
}

/**
 * Get parameter definition by direct command address.
 */
export function getParameterByDirect(
  channel: number,
  parameter: number,
): ParameterDefinition | undefined {
  return directLookup.get(makeDirectKey(channel, parameter));
}

/**
 * Convert raw value to typed value based on parameter definition.
 */
export function convertValue(
  def: ParameterDefinition,
  raw: number,
): boolean | string | number {
  if (def.type === 'bool') {
    return raw !== 0;
  }

  if (def.type === 'enum' && def.values) {
    return def.values[raw] ?? String(raw);
  }

  if (def.type === 'number') {
    const min = def.min ?? 0;
    const step = def.step ?? 1;
    return min + step * raw;
  }

  return raw;
}

/**
 * Convert typed value to raw value for sending to device.
 */
export function toRawValue(
  def: ParameterDefinition,
  value: boolean | string | number,
): number {
  if (def.type === 'bool') {
    return value ? 1 : 0;
  }

  if (def.type === 'enum' && def.values) {
    const index = def.values.indexOf(value as string);
    return Math.max(index, 0);
  }

  if (def.type === 'number') {
    const min = def.min ?? 0;
    const step = def.step ?? 1;
    return Math.round(((value as number) - min) / step);
  }

  return value as number;
}

/**
 * Apply a value to the correct location in state.
 */
export function applyToState(
  state: any,
  def: ParameterDefinition,
  value: boolean | string | number,
): void {
  const {target, key} = def;

  switch (target.kind) {
    case 'setup': {
      (state.setup as Record<string, unknown>)[key] = value;
      break;
    }

    case 'channel': {
      (state[target.group][target.id] as Record<string, unknown>)[key] = value;
      break;
    }

    case 'equalizer': {
      (
        state[target.group][(target as any).channelId].equalizers[
          String(target.band)
        ] as Record<string, unknown>
      )[key] = value;
      break;
    }
  }
}

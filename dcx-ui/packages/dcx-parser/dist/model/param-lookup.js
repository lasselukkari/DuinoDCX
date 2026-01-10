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
// Constants
// ============================================================================
const INPUT_IDS = ['A', 'B', 'C', 'Sum'];
const OUTPUT_IDS = ['1', '2', '3', '4', '5', '6'];
const CHANNEL_IDS = [...INPUT_IDS, ...OUTPUT_IDS];
const EQUALIZER_BANDS = 9;
// ============================================================================
// Helpers
// ============================================================================
function toCamelCase(name) {
  return name
    .split(' ')
    .map((word, i) =>
      i === 0
        ? word.toLowerCase()
        : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
    )
    .join('');
}

function makeDirectKey(channel, parameter) {
  return `${channel}:${parameter}`;
}

// ============================================================================
// Build Lookup Tables
// ============================================================================
function buildByteLookup() {
  const lookup = new Map();
  // Setup parameters
  for (const parameter of setupParameters) {
    const def = {
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
      const def = {
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
      const def = {
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
      const def = {
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
        },
      };
      // Temporary hack to avoid fixing all types deeply right now
      def.target.channelId = def.target.id;
      lookup.set(loc.index, def);
    }
  }

  return lookup;
}

function buildWordLookup() {
  const lookup = new Map();
  // Use the same logic as buildByteLookup but map by wordOffset
  // Setup parameters
  for (const parameter of setupParameters) {
    if (parameter.wordOffset !== undefined) {
      const def = {
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
      const def = {
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
      const def = {
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
      const def = {
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
        },
      };
      def.target.channelId = def.target.id;
      lookup.set(loc.wordOffset, def);
    }
  }

  return lookup;
}

function buildDirectLookup() {
  const lookup = new Map();
  // Channel 0 = Setup
  // Setup params: indices 2-11 and 12-17 map to setupCommands
  for (const [i, parameter] of setupParameters.entries()) {
    // Setup command numbers: 2-11 for first 10, then 12-17 for rest
    const parameterNumber = i < 10 ? i + 2 : i + 2;
    const def = {
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
      const def = {
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
        const def = {
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
          },
        };
        def.target.channelId = def.target.id;
        lookup.set(makeDirectKey(ch, parameterNumber), def);
      }
    }

    // Output-only params: 64+
    if (!isInput) {
      for (const [i, parameter] of outputOnlyParameters.entries()) {
        const parameterNumber = 64 + i;
        const def = {
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
export function getParameterByByte(index) {
  return byteLookup.get(index);
}

/**
 * Get parameter definition by direct command address.
 */
export function getParameterByDirect(channel, parameter) {
  return directLookup.get(makeDirectKey(channel, parameter));
}

/**
 * Convert raw value to typed value based on parameter definition.
 */
export function convertValue(def, raw) {
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
export function toRawValue(def, value) {
  if (def.type === 'bool') {
    return value ? 1 : 0;
  }

  if (def.type === 'enum' && def.values) {
    const index = def.values.indexOf(value);
    return Math.max(index, 0);
  }

  if (def.type === 'number') {
    const min = def.min ?? 0;
    const step = def.step ?? 1;
    return Math.round((value - min) / step);
  }

  return value;
}

/**
 * Apply a value to the correct location in state.
 */
export function applyToState(state, def, value) {
  const {target, key} = def;
  switch (target.kind) {
    case 'setup': {
      state.setup[key] = value;
      break;
    }

    case 'channel': {
      state[target.group][target.id][key] = value;
      break;
    }

    case 'equalizer': {
      state[target.group][target.channelId].equalizers[String(target.band)][
        key
      ] = value;
      break;
    }
  }
}
// # sourceMappingURL=param-lookup.js.map

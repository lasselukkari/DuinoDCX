/**
 * State parser for DCX2496.
 *
 * Parses decoded device data into a State object.
 * Uses the same logic for:
 * - Edit buffer (two parts from device)
 * - Preset data (from .dcx files)
 */

import type { State, Channel, Eq } from './types.js';
import {
  byteLookup,
  convertValue,
  type ParameterDefinition,
} from './param-lookup.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Data source abstraction for reading bytes.
 * Allows same parsing logic for different data layouts.
 */
export type DataSource = {
  readByte(index: number): number;
};

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
export function fromParts(part0: Uint8Array, part1: Uint8Array): DataSource {
  const combined = new Uint8Array(part0.length + part1.length);
  combined.set(part0);
  combined.set(part1, part0.length);

  return {
    readByte(index: number): number {
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
export function fromPreset(data: Uint8Array): DataSource {
  return {
    readByte(index: number): number {
      return data[index] ?? 0;
    },
  };
}

// ============================================================================
// Value Reading
// ============================================================================

function readRawValue(
  source: DataSource,
  index: number,
  highByteIndex?: number,
  bit7Info?: { index: number; bit: number },
): number {
  let value = source.readByte(index);

  // DCX protocol stores the 8th bit (MSB) of values at separate locations
  // bit7Info was used for 7-to-8 decoding, but the input source is now assumed
  // to be fully decoded 8-bit data (with MSBs restored by decode7to8).
  // effectively ignoring bit7Info to avoid double-application.
  if (bit7Info) {
    const flagByte = source.readByte(bit7Info.index);
    const bit7Set = (flagByte >> bit7Info.bit) & 1;
    if (bit7Set) {
      value += 128;
    }
  }

  // High byte for 16-bit values
  if (highByteIndex !== undefined) {
    const high = source.readByte(highByteIndex);
    value += high * 256;
  }

  return value;
}

function readString(source: DataSource, index: number, maxLength: number): string {
  let str = '';
  for (let i = 0; i < maxLength; i++) {
    const charCode = source.readByte(index + i);
    if (charCode === 0) break;
    str += String.fromCharCode(charCode);
  }
  return str.trim();
}

// ============================================================================
// State Initialization
// ============================================================================

function createEmptyEq(): Eq {
  return {
    eqType: '',
    eqFrequency: '',
    eqGain: 0,
    eqQ: '',
    eqShelving: '',
  };
}

function createEmptyChannel(): Channel {
  const eqs: Record<string, Eq> = {};
  for (let i = 1; i <= 9; i++) {
    eqs[String(i)] = createEmptyEq();
  }

  return {
    channelName: '',
    gain: 0,
    mute: false,
    isDelayOn: false,
    longDelay: 0,
    isEqOn: false,
    eqNumber: 0,
    eqIndex: 0,
    isDynamicEqOn: false,
    dynamicEqType: '',
    dynamicEqFrequency: '',
    dynamicEqGain: 0,
    dynamicEqQ: '',
    dynamicEqShelving: '',
    dynamicEqAttack: '',
    dynamicEqRelease: '',
    dynamicEqRatio: '',
    dynamicEqThreshold: 0,
    eqs,
  };
}

function createEmptyState(): State {
  return {
    activePreset: '',
    setup: {
      inputSumType: '',
      inputAbSource: '',
      inputCGain: '',
      outputConfig: '',
      stereolink: false,
      stereolinkMode: '',
      delayLink: false,
      crossoverLink: false,
      isDelayCorrectionOn: false,
      airTemperature: 0,
      delayUnits: '',
      muteOutsWhenPowered: false,
      inputASumGain: 0,
      inputBSumGain: 0,
      inputCSumGain: 0,
    },
    inputs: {
      A: createEmptyChannel(),
      B: createEmptyChannel(),
      C: createEmptyChannel(),
      Sum: createEmptyChannel(),
    },
    outputs: {
      '1': createEmptyChannel(),
      '2': createEmptyChannel(),
      '3': createEmptyChannel(),
      '4': createEmptyChannel(),
      '5': createEmptyChannel(),
      '6': createEmptyChannel(),
    },
  };
}

// ============================================================================
// Parsing
// ============================================================================

/**
 * Parse complete state by iterating over the byte lookup table.
 * This is efficient because we only visit each parameter once.
 */
export function parseState(source: DataSource): State {
  const state = createEmptyState();

  // Parse strings not covered by standard parameter mapping
  state.activePreset = readString(source, 90, 16);

  // Iterate through all known byte positions
  for (const [key, def] of byteLookup) {
    const index = Number(key);

    // Read raw value (including bit7 for DCX protocol value reconstruction)
    const raw = readRawValue(source, index, def.highByteIndex, def.bit7Info);

    // Convert to typed value
    const value = convertValue(def, raw);

    // Store in state
    applyToState(state, def, value);
  }

  return state;
}

/**
 * Apply a value to the correct location in state.
 */
function applyToState(
  state: State,
  def: ParameterDefinition,
  value: boolean | string | number,
): void {
  const { target, key } = def;

  switch (target.kind) {
    case 'setup': {
      (state.setup as Record<string, unknown>)[key] = value;
      break;
    }

    case 'channel': {
      (state[target.group][target.id] as Record<string, unknown>)[key] = value;
      break;
    }

    case 'eq': {
      (
        state[target.group][target.channelId].eqs[
        String(target.band)
        ] as Record<string, unknown>
      )[key] = value;
      break;
    }
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Parse state from edit buffer parts.
 */
export function parseEditBuffer(part0: Uint8Array, part1: Uint8Array): State {
  return parseState(fromParts(part0, part1));
}

/**
 * Parse state from preset data.
 */
export function parsePresetData(data: Uint8Array): State {
  return parseState(fromPreset(data));
}

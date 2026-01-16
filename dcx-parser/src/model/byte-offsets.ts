/**
 * Byte Offset Mapping for Edit Buffer Parameters
 * 
 * Maps parameter paths to their byte offsets in the decoded 8-bit buffer.
 * Used for direct updates to DeviceStateBuffer without re-parsing.
 */

import {
  EDIT_BUFFER_SETUP_PARAMETERS,
  INPUT_CHANNEL_PARAMETERS,
  EQUALIZER_BAND_PARAMETERS,
  OUTPUT_CHANNEL_PARAMETERS_PREFIX,
  OUTPUT_EXTRA_PARAMETERS,
  INPUT_NAMES,
  OUTPUT_NAMES,
} from '../structure.js';

export interface ByteOffset {
  offset: number;
  size: number;  // Size in bytes (2 for word, 16 for UTF-16LE string with 8 chars, etc.)
}

// Constants from structure analysis
const SETUP_START = 1;  // Edit buffer starts at offset 1 (after header byte 0)
const SETUP_END = 117;  // Last setup param at 114-115, inputs start at 117

// Each input channel: 17 params × 2 bytes + 9 EQ bands × 5 params × 2 bytes = 124 bytes
const INPUT_CHANNEL_SIZE = (INPUT_CHANNEL_PARAMETERS.length * 2) + (9 * EQUALIZER_BAND_PARAMETERS.length * 2);

// Calculate input channel base offsets
const INPUT_A_START = SETUP_END;
const INPUT_B_START = INPUT_A_START + INPUT_CHANNEL_SIZE;
const INPUT_C_START = INPUT_B_START + INPUT_CHANNEL_SIZE;
const INPUT_SUM_START = INPUT_C_START + INPUT_CHANNEL_SIZE;

// Outputs start after all 4 input channels
const OUTPUT_START = INPUT_SUM_START + INPUT_CHANNEL_SIZE;

// Each output channel: same as input (17 params + 9 EQ bands) + 12 extra params = 148 bytes
const OUTPUT_CHANNEL_SIZE = INPUT_CHANNEL_SIZE + (OUTPUT_EXTRA_PARAMETERS.length * 2);

// Input channel names are in Part 1 (after byte 875)
// Located after outputs + 24 bytes padding
const INPUT_NAMES_START = OUTPUT_START + (6 * OUTPUT_CHANNEL_SIZE) + 24;

/**
 * Compute byte offset for a setup parameter
 */
function getSetupOffset(paramName: string): ByteOffset | undefined {
  let offset = SETUP_START;
  
  for (const param of EDIT_BUFFER_SETUP_PARAMETERS) {
    if (param === undefined) {
      offset += 2;  // Skip undefined slots
    } else if (typeof param === 'string') {
      if (param === paramName) {
        return {offset, size: 2};
      }
      offset += 2;
    } else if (param.type === 'skip') {
      offset += param.length;
    }
  }
  
  return undefined;
}

/**
 * Compute byte offset for an input channel parameter
 */
function getInputChannelOffset(channelId: string, paramName: string): ByteOffset | undefined {
  // Determine channel base offset
  let channelBase: number;
  switch (channelId) {
    case 'A': channelBase = INPUT_A_START; break;
    case 'B': channelBase = INPUT_B_START; break;
    case 'C': channelBase = INPUT_C_START; break;
    case 'Sum': channelBase = INPUT_SUM_START; break;
    default: return undefined;
  }
  
  // Find parameter offset within channel
  let offset = channelBase;
  for (const param of INPUT_CHANNEL_PARAMETERS) {
    if (param === paramName) {
      return {offset, size: 2};
    }
    offset += 2;
  }
  
  return undefined;
}

/**
 * Compute byte offset for an input channel EQ band parameter
 */
function getInputEqOffset(channelId: string, bandIndex: number, paramName: string): ByteOffset | undefined {
  // Determine channel base offset
  let channelBase: number;
  switch (channelId) {
    case 'A': channelBase = INPUT_A_START; break;
    case 'B': channelBase = INPUT_B_START; break;
    case 'C': channelBase = INPUT_C_START; break;
    case 'Sum': channelBase = INPUT_SUM_START; break;
    default: return undefined;
  }
  
  // EQ bands start after channel parameters
  const eqBase = channelBase + (INPUT_CHANNEL_PARAMETERS.length * 2);
  const bandBase = eqBase + (bandIndex * EQUALIZER_BAND_PARAMETERS.length * 2);
  
  // Find parameter offset within band
  let offset = bandBase;
  for (const param of EQUALIZER_BAND_PARAMETERS) {
    if (param === paramName) {
      return {offset, size: 2};
    }
    offset += 2;
  }
  
  return undefined;
}

/**
 * Compute byte offset for an output channel parameter
 */
function getOutputChannelOffset(channelId: string, paramName: string): ByteOffset | undefined {
  const channelIndex = OUTPUT_NAMES.indexOf(channelId as any);
  if (channelIndex === -1) return undefined;
  
  const channelBase = OUTPUT_START + (channelIndex * OUTPUT_CHANNEL_SIZE);
  
  // Check in prefix parameters (same as input)
  let offset = channelBase;
  for (const param of OUTPUT_CHANNEL_PARAMETERS_PREFIX) {
    if (param === paramName) {
      return {offset, size: 2};
    }
    offset += 2;
  }
  
  // Check in EQ bands (9 bands × 5 params × 2 bytes)
  // (handled separately via getOutputEqOffset)
  
  // Check in extra parameters
  const extraBase = channelBase + (OUTPUT_CHANNEL_PARAMETERS_PREFIX.length * 2) + (9 * EQUALIZER_BAND_PARAMETERS.length * 2);
  offset = extraBase;
  for (const param of OUTPUT_EXTRA_PARAMETERS) {
    if (param === paramName) {
      return {offset, size: 2};
    }
    offset += 2;
  }
  
  return undefined;
}

/**
 * Compute byte offset for an output channel EQ band parameter
 */
function getOutputEqOffset(channelId: string, bandIndex: number, paramName: string): ByteOffset | undefined {
  const channelIndex = OUTPUT_NAMES.indexOf(channelId as any);
  if (channelIndex === -1) return undefined;
  
  const channelBase = OUTPUT_START + (channelIndex * OUTPUT_CHANNEL_SIZE);
  const eqBase = channelBase + (OUTPUT_CHANNEL_PARAMETERS_PREFIX.length * 2);
  const bandBase = eqBase + (bandIndex * EQUALIZER_BAND_PARAMETERS.length * 2);
  
  let offset = bandBase;
  for (const param of EQUALIZER_BAND_PARAMETERS) {
    if (param === paramName) {
      return {offset, size: 2};
    }
    offset += 2;
  }
  
  return undefined;
}

/**
 * Get byte offset for input channel name (UTF-16LE string)
 */
function getInputChannelNameOffset(channelId: string): ByteOffset | undefined {
  const channelIndex = INPUT_NAMES.indexOf(channelId as any);
  if (channelIndex === -1) return undefined;
  
  // Each name: 16 bytes (8 UTF-16LE chars) + 4 bytes padding = 20 bytes total
  const offset = INPUT_NAMES_START + (channelIndex * 20);
  return {offset, size: 16};  // 16 bytes for the string itself (padding not included)
}

/**
 * Main function to get byte offset for any parameter path
 * 
 * Examples:
 * - 'setup.outputConfig' → {offset: 89, size: 2}
 * - 'inputs.A.gain' → {offset: 117, size: 2}
 * - 'inputs.A.equalizers.0.equalizerFrequency' → {offset: ..., size: 2}
 * - 'inputs.A.channelName' → {offset: ..., size: 16}
 * - 'outputs.1.source' → {offset: ..., size: 2}
 */
export function getByteOffset(path: string): ByteOffset | undefined {
  const parts = path.split('.');
  
  if (parts[0] === 'setup') {
    return getSetupOffset(parts[1]);
  }
  
  if (parts[0] === 'inputs') {
    const channelId = parts[1];
    const paramName = parts[2];
    
    if (paramName === 'channelName') {
      return getInputChannelNameOffset(channelId);
    }
    
    if (paramName === 'equalizers') {
      const bandIndex = parseInt(parts[3], 10);
      const eqParam = parts[4];
      return getInputEqOffset(channelId, bandIndex, eqParam);
    }
    
    return getInputChannelOffset(channelId, paramName);
  }
  
  if (parts[0] === 'outputs') {
    const channelId = parts[1];
    const paramName = parts[2];
    
    if (paramName === 'equalizers') {
      const bandIndex = parseInt(parts[3], 10);
      const eqParam = parts[4];
      return getOutputEqOffset(channelId, bandIndex, eqParam);
    }
    
    return getOutputChannelOffset(channelId, paramName);
  }
  
  return undefined;
}

/**
 * Get byte offset from direct command (channel, param) pair
 * Bridges the existing directLookup system to byte offsets
 */
export function getByteOffsetForDirect(_channel: number, _param: number): ByteOffset | undefined {
  // This will be implemented after we verify the basic offset system works
  // It will use the existing directLookup to map (channel, param) → path → offset
  return undefined;
}

/**
 * Preset Structure Definition V3
 * Derived from:
 * 1. DCX-Remote.exe embedded template (offset 0xf8dac)
 * 2. preset_00_calibration.bin byte analysis
 *
 * Key differences from Edit Buffer:
 * - Parameter order differs in DynEQ section
 * - No dynamicEqualizerQ field (it's dynamicEqualizerGain)
 * - 124 bytes per Input Channel
 * - 10 bytes per EQ band (same as Edit Buffer)
 */

export type ParameterDefinition =
  | string
  | undefined
  | {name: string; type: 'string'; length: number}
  | {name: string; type: 'skip'; length: number}
  | {name: string; type: 'string'; length: number}
  | {name: string; type: 'skip'; length: number}
  | {name: string; type: 'uint32'}
  | {name: string; type: 'uint8'};

// ============ SETUP PARAMETERS (Edit Buffer) ============
// Matches the structure expected by edit-buffer-parser (starts at offset 1)
export const EDIT_BUFFER_SETUP_PARAMETERS: ParameterDefinition[] = [
  ...(Array.from({length: 18}).fill(undefined) as ParameterDefinition[]),
  'delayUnits', // 36-37
  'muteOutsWhenPowered', // 38-39
  {name: 'deviceName', type: 'string', length: 16}, // 40-55
  {name: 'padding1', type: 'skip', length: 16}, // 56-71 (padding)
  {name: 'activePresetNumber', type: 'uint8'}, // 72 (0x48)
  {name: 'padding2', type: 'skip', length: 5}, // 73-77 (padding/reserved)
  {name: 'activePresetName', type: 'string', length: 8}, // 78-85 (0x4E-0x55)
  {name: 'padding3', type: 'skip', length: 2}, // 86-87 (unknown)

  'outputConfig', // 88-89
  'inputSumType', // 90-91
  'inputABSource', // 92-93
  'inputCGain', // 94-95
  undefined, // 96-97 (unknown)
  'stereolink', // 98-99
  'stereolinkMode', // 100-101
  'delayLink', // 102-103
  'crossoverLink', // 104-105
  'isDelayCorrectionOn', // 106-107
  'airTemperature', // 108-109
  'inputASumGain', // 110-111
  'inputBSumGain', // 112-113
  'inputCSumGain', // 114-115
];

// ============ SETUP PARAMETERS (Preset V3) ============
// Preset structure differs from edit buffer:
// - XSNP signature at offset 0
// - Preset name at offset 76 (0x4C) after 76-byte header
// - Setup fields from 0x54 to 0x6A
// - Input channels start at 0x72
// 
// IMPORTANT: Preset Setup (offset 86/0x56) corresponds to Edit Buffer (offset 36/0x24)
// BUT Edit Buffer has a 50-byte Device Name block (offsets 40-90) that is SKIPPED in Presets.
// 
// Mapping:
// Preset 0x56 -> EB 36 (delayUnits)
// Preset 0x58 -> EB 38 (muteOutsWhenPowered)
// [GAP: Preset offsets 0x5A-0x6A correspond to EB offsets 90-108]
// Preset 0x5A -> EB 90 (inputSumType)
// Preset 0x5C -> EB 92 (inputABSource)
// Preset 0x5E -> EB 94 (inputCGain)
// ...
// Preset 0x6A -> EB 108 (airTemperature) -- Note: isDelayCorrectionOn (EB 106) is skipped!

export const PRESET_SETUP_PARAMETERS: ParameterDefinition[] = [
  {name: 'setup_header', type: 'skip', length: 76}, // 0x00-0x4B
  {name: 'presetName', type: 'string', length: 8}, // 0x4C-0x53
  undefined, // 0x54-0x55: unknown
  undefined, // 0x56-0x57: unknown
  // Verified Mapping (2026-01-16 - Systematic SysEx Command Testing):
  // 88-89:  inputSumType (VERIFIED via param 0x02)
  // 90-91:  inputABSource (VERIFIED via param 0x03)
  // 92-93:  inputCGain (VERIFIED via param 0x04)
  // 94-95:  (unknown/padding)
  // 96-97:  stereolink (VERIFIED via param 0x06)
  // 98-99:  stereolinkMode (VERIFIED via param 0x07)
  // 100-101: delayLink (VERIFIED via param 0x08)
  // 102-103: crossoverLink (VERIFIED via param 0x09)
  // 104-105: Padding
  // 106-107: airTemperature
  
  'inputSumType',   // 0x58-0x59 (88) - VERIFIED
  'inputABSource',  // 0x5A-0x5B (90) - VERIFIED
  'inputCGain',     // 0x5C-0x5D (92) - VERIFIED
  undefined,        // 0x5E-0x5F (94) - unknown
  'stereolink',     // 0x60-0x61 (96) - VERIFIED
  'stereolinkMode', // 0x62-0x63 (98) - VERIFIED
  'delayLink',      // 0x64-0x65 (100) - VERIFIED
  'crossoverLink',  // 0x66-0x67 (102) - VERIFIED
  
  {name: 'padding_setup_1', type: 'skip', length: 2}, // 0x68-0x69 (104)
  
  'airTemperature', // 0x6A-0x6B (106)
  
  'inputASumGain', // 0x6C-0x6D (108)
  'inputBSumGain', // 0x6E-0x6F (110)
  'inputCSumGain', // 0x70-0x71 (112)
];


// ============ INPUT CHANNEL PARAMETERS ============
// 4 input channels: A, B, C, Sum

export const INPUT_CHANNEL_PARAMETERS: ParameterDefinition[] = [
  'gain',
  'mute',
  'isDelayOn',
  'longDelay',
  'isEqualizerOn',
  undefined,
  undefined,
  'dynamicEqualizerAttack',
  'dynamicEqualizerRelease',
  'dynamicEqualizerRatio',
  'dynamicEqualizerThreshold',
  'isDynamicEqualizerOn',
  'dynamicEqualizerFrequency',
  'dynamicEqualizerQ',
  'dynamicEqualizerGain',
  'dynamicEqualizerType',
  'dynamicEqualizerShelving',
];

// ============ EQ BAND PARAMETERS ============
// 10 bytes per band, 9 bands = 90 bytes total
export const EQUALIZER_BAND_PARAMETERS: ParameterDefinition[] = [
  'equalizerFrequency',
  'equalizerQ',
  'equalizerGain',
  'equalizerType',
  'equalizerShelving',
];

// Output Channels use same structure as Input
export const OUTPUT_CHANNEL_PARAMETERS_PREFIX: ParameterDefinition[] = [
  ...INPUT_CHANNEL_PARAMETERS,
];

export const OUTPUT_EXTRA_PARAMETERS: ParameterDefinition[] = [
  'channelName',
  'source',
  'highpassFilter',
  'highpassFrequency',
  'lowpassFilter',
  'lowpassFrequency',
  'isLimiterOn',
  'limiterThreshold',
  'limiterRelease',
  'polarity',
  'phase',
  'shortDelay',
];

// ============ CHANNEL COUNTS ============
export const INPUT_NAMES = ['A', 'B', 'C', 'Sum'] as const;
export const OUTPUT_NAMES = ['1', '2', '3', '4', '5', '6'] as const;

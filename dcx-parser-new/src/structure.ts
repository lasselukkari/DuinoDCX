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

export type ParamDef =
  | string
  | undefined
  | null
  | { name: string; type: 'string'; length: number }
  | { name: string; type: 'skip'; length: number }
  | { name: string; type: 'uint32' };

// ============ SETUP PARAMETERS (Edit Buffer) ============
// Matches the structure expected by edit-buffer-parser (starts at offset 1)
export const EDIT_BUFFER_SETUP_PARAMS: ParamDef[] = [
  // Bytes 0-36: Headers (handled by parser skipping or separate header object)
  // The parser starts cursor at 1.
  // Old buffer-structure had 18 nulls (36 bytes).
  ...(Array.from({ length: 18 }).fill(null) as ParamDef[]),
  'delayUnits', // 36-37
  'muteOutsWhenPowered', // 38-39
  ...(Array.from({ length: 24 }).fill(null) as ParamDef[]), // Skip 48 bytes -> to byte 88
  'outputConfig', // 88-89
  'inputSumType', // 90-91
  'inputABSource', // 92-93
  'inputCGain', // 94-95
  null, // 96-97 (reserved)
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
// - XSNP signature at offset 7
// - Preset name at offset 83 (skip 76 bytes from XSNP)
// - After preset name (8 bytes), fields start at offset 91
// - outputConfig at absolute offset 93 (relative +10 from preset name start)
export const PRESET_SETUP_PARAMS: ParamDef[] = [
  { name: 'setup_header', type: 'skip', length: 76 }, // Skip to preset name (XSNP at 7, name at 83)
  { name: 'presetName', type: 'string', length: 8 }, // offset 83-90
  null, // offset 91-92 (padding)
  'outputConfig', // offset 93-94
  'inputSumType', // offset 95-96
  'inputABSource', // offset 97-98
  'inputCGain', // offset 99-100
  null, // offset 101-102 (reserved)
  'stereolink', // offset 103-104
  'stereolinkMode', // offset 105-106
  'delayLink', // offset 107-108
  'crossoverLink', // offset 109-110
  'isDelayCorrectionOn', // offset 111-112
  'airTemperature', // offset 113-114
  'inputASumGain', // offset 115-116
  'inputBSumGain', // offset 117-118
  'inputCSumGain', // offset 119-120
  // No trailing padding - Input channels start immediately at offset 121
];

// ============ INPUT CHANNEL PARAMETERS ============
// 4 input channels: A, B, C, Sum

export const INPUT_CHANNEL_PARAMS: ParamDef[] = [
  'gain',
  'mute',
  'isDelayOn',
  'longDelay',
  'isEqualizerOn',
  null,
  null,
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
export const EQ_BAND_PARAMS: ParamDef[] = [
  'frequency',
  'q',
  'gain',
  'type',
  'shelving',
];

// Output Channels use same structure as Input
export const OUTPUT_CHANNEL_PARAMS_PREFIX: ParamDef[] = [
  ...INPUT_CHANNEL_PARAMS,
];

export const OUTPUT_EXTRA_PARAMS: ParamDef[] = [
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

// ============ SIZES ============
export const INPUT_CHANNEL_SIZE = 124;
export const EQ_BAND_SIZE = 10;
export const INPUT_EQ_COUNT = 9;
export const OUTPUT_EQ_COUNT = 9;
export const INPUT_PREFIX_SIZE = 34;
export const OUTPUT_PREFIX_SIZE = 34;

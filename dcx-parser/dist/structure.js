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
// ============ SETUP PARAMETERS (Edit Buffer) ============
// Matches the structure expected by edit-buffer-parser (starts at offset 1)
export const EDIT_BUFFER_SETUP_PARAMETERS = [
    // Bytes 0-36: Headers (handled by parser skipping or separate header object)
    // The parser starts cursor at 1.
    // Old buffer-structure had 18 undefineds (36 bytes).
    ...Array.from({ length: 18 }).fill(undefined),
    'delayUnits', // 36-37
    'muteOutsWhenPowered', // 38-39
    ...Array.from({ length: 24 }).fill(undefined), // Skip 48 bytes -> to byte 88
    'outputConfig', // 88-89
    'inputSumType', // 90-91
    'inputABSource', // 92-93
    'inputCGain', // 94-95
    undefined, // 96-97 (reserved)
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
export const PRESET_SETUP_PARAMETERS = [
    { name: 'setup_header', type: 'skip', length: 76 }, // Skip to preset name (XSNP at 7, name at 83)
    { name: 'presetName', type: 'string', length: 8 }, // Offset 83-90
    undefined, // Offset 91-92 (padding)
    'outputConfig', // Offset 93-94
    'inputSumType', // Offset 95-96
    'inputABSource', // Offset 97-98
    'inputCGain', // Offset 99-100
    undefined, // Offset 101-102 (reserved)
    'stereolink', // Offset 103-104
    'stereolinkMode', // Offset 105-106
    'delayLink', // Offset 107-108
    'crossoverLink', // Offset 109-110
    'isDelayCorrectionOn', // Offset 111-112
    'airTemperature', // Offset 113-114
    'inputASumGain', // Offset 115-116
    'inputBSumGain', // Offset 117-118
    'inputCSumGain', // Offset 119-120
    // No trailing padding - Input channels start immediately at offset 121
];
// ============ INPUT CHANNEL PARAMETERS ============
// 4 input channels: A, B, C, Sum
export const INPUT_CHANNEL_PARAMETERS = [
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
export const EQUALIZER_BAND_PARAMETERS = [
    'equalizerFrequency',
    'equalizerQ',
    'equalizerGain',
    'equalizerType',
    'equalizerShelving',
];
// Output Channels use same structure as Input
export const OUTPUT_CHANNEL_PARAMETERS_PREFIX = [
    ...INPUT_CHANNEL_PARAMETERS,
];
export const OUTPUT_EXTRA_PARAMETERS = [
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
export const INPUT_NAMES = ['A', 'B', 'C', 'Sum'];
export const OUTPUT_NAMES = ['1', '2', '3', '4', '5', '6'];
//# sourceMappingURL=structure.js.map
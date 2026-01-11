import constants from '../constants/index.js';
// Setup commands: params 0x02-0x0B, gap at 0x0C-0x13, then 0x14-0x18
// Uses undefined entries to fill gaps, allowing index-based param calculation
export const setupCommands = [
    // 0x02
    {
        name: 'Input Sum Type',
        type: 'enum',
        values: constants.inputSumTypes,
    },
    // 0x03
    {
        name: 'Input AB Source',
        type: 'enum',
        values: constants.inputAbSources,
    },
    // 0x04
    {
        name: 'Input C Gain',
        type: 'enum',
        values: constants.inputCGains,
    },
    // 0x05
    {
        name: 'Output Config',
        type: 'enum',
        values: constants.outputConfigs,
    },
    // 0x06
    {
        name: 'Stereolink',
        type: 'bool',
    },
    // 0x07
    {
        name: 'Stereolink Mode',
        type: 'enum',
        values: constants.stereoLinkModes,
    },
    // 0x08
    {
        name: 'Delay Link',
        type: 'bool',
    },
    // 0x09
    {
        name: 'Crossover Link',
        type: 'bool',
    },
    // 0x0A
    {
        name: 'Is Delay Correction On',
        type: 'bool',
    },
    // 0x0B
    {
        name: 'Air Temperature',
        unit: '°C',
        type: 'number',
        min: -20,
        max: 50,
        step: 1,
    },
    // 0x0C - 0x13: Gap (8 undefined entries)
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    // 0x14
    {
        name: 'Delay Units',
        type: 'enum',
        values: constants.delayUnits,
    },
    // 0x15
    {
        name: 'Mute Outs When Powered',
        type: 'bool',
    },
    // 0x16
    {
        name: 'Input A Sum Gain',
        type: 'number',
        unit: 'dB',
        min: -15,
        max: 15,
        step: 0.1,
    },
    // 0x17
    {
        name: 'Input B Sum Gain',
        type: 'number',
        unit: 'dB',
        min: -15,
        max: 15,
        step: 0.1,
    },
    // 0x18
    {
        name: 'Input C Sum Gain',
        type: 'number',
        unit: 'dB',
        min: -15,
        max: 15,
        step: 0.1,
    },
];
// Input/Output commands: params 0x02-0x12 (param = index + 0x02)
export const inputOutputCommands = [
    // 0x02
    {
        name: 'Gain',
        type: 'number',
        unit: 'dB',
        min: -15,
        max: 15,
        step: 0.1,
    },
    // 0x03
    {
        name: 'Mute',
        type: 'bool',
    },
    // 0x04
    {
        name: 'Is Delay On',
        type: 'bool',
    },
    // 0x05
    {
        name: 'Long Delay',
        type: 'number',
        unit: 'cm',
        min: 0,
        max: 20_000,
        step: 5,
    },
    // 0x06
    {
        name: 'Is Equalizer On',
        type: 'bool',
    },
    // 0x07
    {
        name: 'Equalizer Number',
        type: 'number',
        min: 0,
        max: 9,
        step: 1,
    },
    // 0x08
    {
        name: 'Equalizer Index',
        type: 'number',
        min: 0,
        max: 9,
        step: 1,
    },
    // 0x09
    {
        name: 'Dynamic Equalizer Attack',
        type: 'enum',
        unit: 'ms',
        values: constants.attackTimes,
    },
    // 0x0A
    {
        name: 'Dynamic Equalizer Release',
        type: 'enum',
        unit: 'ms',
        values: constants.logZeroTo4000Ms,
    },
    // 0x0B
    {
        name: 'Dynamic Equalizer Ratio',
        type: 'enum',
        values: constants.equalizerRatios,
    },
    // 0x0C
    {
        name: 'Dynamic Equalizer Threshold',
        type: 'number',
        unit: 'dB',
        min: -60,
        max: 0,
        step: 0.1,
    },
    // 0x0D
    {
        name: 'Is Dynamic Equalizer On',
        type: 'bool',
    },
    // 0x0E
    {
        name: 'Dynamic Equalizer Frequency',
        type: 'enum',
        unit: 'Hz',
        values: constants.logFrequencyScale,
    },
    // 0x0F
    {
        name: 'Dynamic Equalizer Q',
        type: 'enum',
        values: constants.equalizerQValues,
    },
    // 0x10
    {
        name: 'Dynamic Equalizer Gain',
        type: 'number',
        unit: 'dB',
        min: -15,
        max: 15,
        step: 0.1,
    },
    // 0x11
    {
        name: 'Dynamic Equalizer Type',
        type: 'enum',
        values: constants.equalizerTypes,
    },
    // 0x12
    {
        name: 'Dynamic Equalizer Shelving',
        type: 'enum',
        values: constants.equalizerShelvingSlopes,
    },
];
// Equalizer band commands: base param 0x13 (param = 0x13 + index + band*5)
export const equalizerCommands = [
    // 0x13 (base for band 1)
    {
        name: 'Equalizer Frequency',
        type: 'enum',
        unit: 'Hz',
        values: constants.logFrequencyScale,
    },
    // 0x14
    {
        name: 'Equalizer Q',
        type: 'enum',
        values: constants.equalizerQValues,
    },
    // 0x15
    {
        name: 'Equalizer Gain',
        type: 'number',
        unit: 'dB',
        min: -15,
        max: 15,
        step: 0.1,
    },
    // 0x16
    {
        name: 'Equalizer Type',
        type: 'enum',
        values: constants.equalizerTypes,
    },
    // 0x17
    {
        name: 'Equalizer Shelving',
        type: 'enum',
        values: constants.equalizerShelvingSlopes,
    },
];
// Output-only commands: params 0x40-0x4B (param = 0x40 + index)
export const outputCommands = [
    // 0x40
    {
        name: 'Channel Name',
        type: 'enum',
        values: constants.outputNames,
    },
    // 0x41
    {
        name: 'Source',
        type: 'enum',
        values: constants.outputSources,
    },
    // 0x42
    {
        name: 'Highpass Filter',
        type: 'enum',
        values: constants.crossoverFilters,
    },
    // 0x43
    {
        name: 'Highpass Frequency',
        type: 'enum',
        unit: 'Hz',
        values: constants.logFrequencyScale,
    },
    // 0x44
    {
        name: 'Lowpass Filter',
        type: 'enum',
        values: constants.crossoverFilters,
    },
    // 0x45
    {
        name: 'Lowpass Frequency',
        type: 'enum',
        unit: 'Hz',
        values: constants.logFrequencyScale,
    },
    // 0x46
    {
        name: 'Is Limiter On',
        type: 'bool',
    },
    // 0x47
    {
        name: 'Limiter Threshold',
        type: 'number',
        unit: 'dB',
        min: -24,
        max: 0,
        step: 0.1,
    },
    // 0x48
    {
        name: 'Limiter Release',
        type: 'enum',
        unit: 'ms',
        values: constants.logZeroTo4000Ms,
    },
    // 0x49
    {
        name: 'Polarity',
        type: 'enum',
        values: constants.polarities,
    },
    // 0x4A
    {
        name: 'Phase',
        type: 'number',
        unit: '°',
        min: 0,
        max: 180,
        step: 5,
    },
    // 0x4B
    {
        name: 'Short Delay',
        type: 'number',
        unit: 'mm',
        min: 0,
        max: 4000,
        step: 2,
    },
];
//# sourceMappingURL=commands.js.map
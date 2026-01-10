import constants from '../constants/index.js';

export type Command = {
  name: string;
  type: 'bool' | 'enum' | 'number';
  values?: readonly string[];
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  paramNumber?: number;
};

export const setupCommands: Command[] = [
  {
    name: 'Input Sum Type',
    type: 'enum',
    values: constants.inputSumTypes,
    paramNumber: 0x02,
  },
  {
    name: 'Input AB Source',
    type: 'enum',
    values: constants.inputAbSources,
    paramNumber: 0x03,
  },
  {
    name: 'Input C Gain',
    type: 'enum',
    values: constants.inputCGains,
    paramNumber: 0x04,
  },
  {
    name: 'Output Config',
    type: 'enum',
    values: constants.outputConfigs,
    paramNumber: 0x05,
  },
  {
    name: 'Stereolink',
    type: 'bool',
    paramNumber: 0x06,
  },
  {
    name: 'Stereolink Mode',
    type: 'enum',
    values: constants.stereoLinkModes,
    paramNumber: 0x07,
  },
  {
    name: 'Delay Link',
    type: 'bool',
    paramNumber: 0x08,
  },
  {
    name: 'Crossover Link',
    type: 'bool',
    paramNumber: 0x09,
  },
  {
    name: 'Is Delay Correction On',
    type: 'bool',
    paramNumber: 0x0a,
  },
  {
    name: 'Air Temperature',
    unit: '°C',
    type: 'number',
    min: -20,
    max: 50,
    step: 1,
    paramNumber: 0x0b,
  },
  {
    name: 'Delay Units',
    type: 'enum',
    values: constants.delayUnits,
    paramNumber: 0x14,
  },
  {
    name: 'Mute Outs When Powered',
    type: 'bool',
    paramNumber: 0x15,
  },
  {
    name: 'Input A Sum Gain',
    type: 'number',
    unit: 'dB',
    min: -15,
    max: 15,
    step: 0.1,
    paramNumber: 0x16,
  },
  {
    name: 'Input B Sum Gain',
    type: 'number',
    unit: 'dB',
    min: -15,
    max: 15,
    step: 0.1,
    paramNumber: 0x17,
  },
  {
    name: 'Input C Sum Gain',
    type: 'number',
    unit: 'dB',
    min: -15,
    max: 15,
    step: 0.1,
    paramNumber: 0x18,
  },
];

export const inputOutputCommands: Command[] = [
  {
    name: 'Gain',
    type: 'number',
    unit: 'dB',

    min: -15,
    max: 15,
    step: 0.1,
    paramNumber: 0x02,
  },
  {
    name: 'Mute',
    type: 'bool',
    paramNumber: 0x03,
  },
  {
    name: 'Is Delay On',
    type: 'bool',
    paramNumber: 0x04,
  },
  {
    name: 'Long Delay',
    type: 'number',
    unit: 'cm',

    min: 0,
    max: 20_000,
    step: 5,
    paramNumber: 0x05,
  },
  {
    name: 'Is Equalizer On',
    type: 'bool',
    paramNumber: 0x06,
  },
  {
    name: 'Equalizer Number',
    type: 'number',

    min: 0,
    max: 9,
    step: 1,
    paramNumber: 0x07,
  },
  {
    name: 'Equalizer Index',
    type: 'number',

    min: 0,
    max: 9,
    step: 1,
    paramNumber: 0x08,
  },
  {
    name: 'Dynamic Equalizer Attack',
    type: 'enum',
    unit: 'ms',
    values: constants.attackTimes,
    paramNumber: 0x09,
  },
  {
    name: 'Dynamic Equalizer Release',
    type: 'enum',
    unit: 'ms',
    values: constants.logZeroTo4000Ms,
    paramNumber: 0x0a,
  },
  {
    name: 'Dynamic Equalizer Ratio',
    type: 'enum',
    values: constants.equalizerRatios,
    paramNumber: 0x0b,
  },
  {
    name: 'Dynamic Equalizer Threshold',
    type: 'number',
    unit: 'dB',

    min: -60,
    max: 0,
    step: 0.1,
    paramNumber: 0x0c,
  },
  {
    name: 'Is Dynamic Equalizer On',
    type: 'bool',
    paramNumber: 0x0d,
  },
  {
    name: 'Dynamic Equalizer Frequency',
    type: 'enum',
    unit: 'Hz',
    values: constants.logFrequencyScale,
    paramNumber: 0x0e,
  },
  {
    name: 'Dynamic Equalizer Q',
    type: 'enum',
    values: constants.equalizerQValues,
    paramNumber: 0x0f,
  },
  {
    name: 'Dynamic Equalizer Gain',
    type: 'number',
    unit: 'dB',

    min: -15,
    max: 15,
    step: 0.1,
    paramNumber: 0x10,
  },
  {
    name: 'Dynamic Equalizer Type',
    type: 'enum',
    values: constants.equalizerTypes,
    paramNumber: 0x11,
  },
  {
    name: 'Dynamic Equalizer Shelving',
    type: 'enum',
    values: constants.equalizerShelvingSlopes,
    paramNumber: 0x12,
  },
];

export const equalizerCommands: Command[] = [
  {
    name: 'Equalizer Frequency',
    type: 'enum',
    unit: 'Hz',
    values: constants.logFrequencyScale,
    paramNumber: 0x13,
  },
  {
    name: 'Equalizer Q',
    type: 'enum',
    values: constants.equalizerQValues,
    paramNumber: 0x14,
  },
  {
    name: 'Equalizer Gain',
    type: 'number',
    unit: 'dB',

    min: -15,
    max: 15,
    step: 0.1,
    paramNumber: 0x15,
  },
  {
    name: 'Equalizer Type',
    type: 'enum',
    values: constants.equalizerTypes,
    paramNumber: 0x16,
  },
  {
    name: 'Equalizer Shelving',
    type: 'enum',
    values: constants.equalizerShelvingSlopes,
    paramNumber: 0x17,
  },
];

export const outputCommands: Command[] = [
  {
    name: 'Channel Name',
    type: 'enum',
    values: constants.outputNames,
    paramNumber: 0x40,
  },
  {
    name: 'Source',
    type: 'enum',
    values: constants.outputSources,
    paramNumber: 0x41,
  },
  {
    name: 'Highpass Filter',
    type: 'enum',
    values: constants.crossoverFilters,
    paramNumber: 0x42,
  },
  {
    name: 'Highpass Frequency',
    type: 'enum',
    unit: 'Hz',
    values: constants.logFrequencyScale,
    paramNumber: 0x43,
  },
  {
    name: 'Lowpass Filter',
    type: 'enum',
    values: constants.crossoverFilters,
    paramNumber: 0x44,
  },
  {
    name: 'Lowpass Frequency',
    type: 'enum',
    unit: 'Hz',
    values: constants.logFrequencyScale,
    paramNumber: 0x45,
  },
  {
    name: 'Is Limiter On',
    type: 'bool',
    paramNumber: 0x46,
  },
  {
    name: 'Limiter Threshold',
    type: 'number',
    unit: 'dB',

    min: -24,
    max: 0,
    step: 0.1,
    paramNumber: 0x47,
  },
  {
    name: 'Limiter Release',
    type: 'enum',
    unit: 'ms',
    values: constants.logZeroTo4000Ms,
    paramNumber: 0x48,
  },
  {
    name: 'Polarity',
    type: 'enum',
    values: constants.polarities,
    paramNumber: 0x49,
  },
  {
    name: 'Phase',
    type: 'number',
    unit: '°',

    min: 0,
    max: 180,
    step: 5,
    paramNumber: 0x4a,
  },
  {
    name: 'Short Delay',
    type: 'number',
    unit: 'mm',

    min: 0,
    max: 4000,
    step: 2,
    paramNumber: 0x4b,
  },
];

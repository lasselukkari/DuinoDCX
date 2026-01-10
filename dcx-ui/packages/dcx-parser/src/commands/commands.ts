import constants from '../constants/index.js';

export type Command = {
  name: string;
  type: 'bool' | 'enum' | 'number';
  values?: readonly string[];
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
};

export const setupCommands: Command[] = [
  {
    name: 'Input Sum Type',
    type: 'enum',
    values: constants.inputSumTypes,
  },
  {
    name: 'Input AB Source',
    type: 'enum',
    values: constants.inputAbSources,
  },
  {
    name: 'Input C Gain',
    type: 'enum',
    values: constants.INPUT_C_GAINS,
  },
  {
    name: 'Output Config',
    type: 'enum',
    values: constants.OUTPUT_CONFIGS,
  },
  {
    name: 'Stereolink',
    type: 'bool',
  },
  {
    name: 'Stereolink Mode',
    type: 'enum',
    values: constants.STEREO_LINK_MODES,
  },
  {
    name: 'Delay Link',
    type: 'bool',
  },
  {
    name: 'Crossover Link',
    type: 'bool',
  },
  {
    name: 'Is Delay Correction On',
    type: 'bool',
  },
  {
    name: 'Air Temperature',
    unit: '°C',
    type: 'number',
    min: -20,
    max: 50,
    step: 1,
  },
  {
    name: 'Delay Units',
    type: 'enum',
    values: constants.DELAY_UNITS,
  },
  {
    name: 'Mute Outs When Powered',
    type: 'bool',
  },
  {
    name: 'Input A Sum Gain',
    type: 'number',
    unit: 'dB',
    min: -15,
    max: 15,
    step: 0.1,
  },
  {
    name: 'Input B Sum Gain',
    type: 'number',
    unit: 'dB',
    min: -15,
    max: 15,
    step: 0.1,
  },
  {
    name: 'Input C Sum Gain',
    type: 'number',
    unit: 'dB',
    min: -15,
    max: 15,
    step: 0.1,
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
  },
  {
    name: 'Mute',
    type: 'bool',
  },
  {
    name: 'Is Delay On',
    type: 'bool',
  },
  {
    name: 'Long Delay',
    type: 'number',
    unit: 'cm',

    min: 0,
    max: 20_000,
    step: 5,
  },
  {
    name: 'Is Equalizer On',
    type: 'bool',
  },
  {
    name: 'Equalizer Number',
    type: 'number',

    min: 0,
    max: 9,
    step: 1,
  },
  {
    name: 'Equalizer Index',
    type: 'number',

    min: 0,
    max: 9,
    step: 1,
  },
  {
    name: 'Dynamic Equalizer Attack',
    type: 'enum',
    unit: 'ms',
    values: constants.attackTimes,
  },
  {
    name: 'Dynamic Equalizer Release',
    type: 'enum',
    unit: 'ms',
    values: constants.logZeroTo4000Ms,
  },
  {
    name: 'Dynamic Equalizer Ratio',
    type: 'enum',
    values: constants.equalizerRatios,
  },
  {
    name: 'Dynamic Equalizer Threshold',
    type: 'number',
    unit: 'dB',

    min: -60,
    max: 0,
    step: 0.1,
  },
  {
    name: 'Is Dynamic Equalizer On',
    type: 'bool',
  },
  {
    name: 'Dynamic Equalizer Frequency',
    type: 'enum',
    unit: 'Hz',
    values: constants.logFrequencyScale,
  },
  {
    name: 'Dynamic Equalizer Q',
    type: 'enum',
    values: constants.equalizerQValues,
  },
  {
    name: 'Dynamic Equalizer Gain',
    type: 'number',
    unit: 'dB',

    min: -15,
    max: 15,
    step: 0.1,
  },
  {
    name: 'Dynamic Equalizer Type',
    type: 'enum',
    values: constants.equalizerTypes,
  },
  {
    name: 'Dynamic Equalizer Shelving',
    type: 'enum',
    values: constants.equalizerShelvingSlopes,
  },
];

export const equalizerCommands: Command[] = [
  {
    name: 'Equalizer Frequency',
    type: 'enum',
    unit: 'Hz',
    values: constants.logFrequencyScale,
  },
  {
    name: 'Equalizer Q',
    type: 'enum',
    values: constants.equalizerQValues,
  },
  {
    name: 'Equalizer Gain',
    type: 'number',
    unit: 'dB',

    min: -15,
    max: 15,
    step: 0.1,
  },
  {
    name: 'Equalizer Type',
    type: 'enum',
    values: constants.equalizerTypes,
  },
  {
    name: 'Equalizer Shelving',
    type: 'enum',
    values: constants.equalizerShelvingSlopes,
  },
];

export const outputCommands: Command[] = [
  {
    name: 'Channel Name',
    type: 'enum',
    values: constants.outputNames,
  },
  {
    name: 'Source',
    type: 'enum',
    values: constants.outputSources,
  },
  {
    name: 'Highpass Filter',
    type: 'enum',
    values: constants.crossoverFilters,
  },
  {
    name: 'Highpass Frequency',
    type: 'enum',
    unit: 'Hz',
    values: constants.logFrequencyScale,
  },
  {
    name: 'Lowpass Filter',
    type: 'enum',
    values: constants.crossoverFilters,
  },
  {
    name: 'Lowpass Frequency',
    type: 'enum',
    unit: 'Hz',
    values: constants.logFrequencyScale,
  },
  {
    name: 'Is Limiter On',
    type: 'bool',
  },
  {
    name: 'Limiter Threshold',
    type: 'number',
    unit: 'dB',

    min: -24,
    max: 0,
    step: 0.1,
  },
  {
    name: 'Limiter Release',
    type: 'enum',
    unit: 'ms',
    values: constants.logZeroTo4000Ms,
  },
  {
    name: 'Polarity',
    type: 'enum',
    values: constants.POLARITIES,
  },
  {
    name: 'Phase',
    type: 'number',
    unit: '°',

    min: 0,
    max: 180,
    step: 5,
  },
  {
    name: 'Short Delay',
    type: 'number',
    unit: 'mm',

    min: 0,
    max: 4000,
    step: 2,
  },
];

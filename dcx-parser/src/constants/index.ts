import * as protocol from './protocol.js';
import * as logFrequencyScale from './enums/log-frequency-scale.js';
import * as logZeroTo4000Ms from './enums/log-zero-to-4000-ms.js';
import * as attackTimes from './enums/attack-times.js';
import * as outputSources from './enums/output-sources.js';
import * as inputSumTypes from './enums/input-sum-types.js';
import * as inputAbSources from './enums/input-ab-sources.js';
import * as outputConfigs from './enums/output-configs.js';
import * as stereoLinkModes from './enums/stereo-link-modes.js';
import * as equalizerRatios from './enums/equalizer-ratios.js';
import * as equalizerQValues from './enums/equalizer-q-values.js';
import * as equalizerTypes from './enums/equalizer-types.js';
import * as equalizerShelvingSlopes from './enums/equalizer-shelving-slopes.js';
import * as crossoverFilters from './enums/crossover-filters.js';
import * as outputNames from './enums/output-names.js';
import * as inputCGains from './enums/input-c-gains.js';
import * as polarities from './enums/polarities.js';
import * as inputs from './enums/inputs.js';
import * as outputs from './enums/outputs.js';
import * as channels from './enums/channels.js';
import * as channelLevels from './enums/channel-levels.js';
import * as delayUnits from './enums/delay-units.js';

export * from './protocol.js';
export * from './enums/log-frequency-scale.js';
export * from './enums/log-zero-to-4000-ms.js';
export * from './enums/attack-times.js';
export * from './enums/output-sources.js';
export * from './enums/input-sum-types.js';
export * from './enums/input-ab-sources.js';
export * from './enums/output-configs.js';
export * from './enums/stereo-link-modes.js';
export * from './enums/equalizer-ratios.js';
export * from './enums/equalizer-q-values.js';
export * from './enums/equalizer-types.js';
export * from './enums/equalizer-shelving-slopes.js';
export * from './enums/crossover-filters.js';
export * from './enums/output-names.js';
export * from './enums/input-c-gains.js';
export * from './enums/polarities.js';
export * from './enums/inputs.js';
export * from './enums/outputs.js';
export * from './enums/channels.js';
export * from './enums/channel-levels.js';
export * from './enums/delay-units.js';

const constants = {
  ...protocol,
  ...logFrequencyScale,
  ...logZeroTo4000Ms,
  ...attackTimes,
  ...outputSources,
  ...inputSumTypes,
  ...inputAbSources,
  ...outputConfigs,
  ...stereoLinkModes,
  ...equalizerRatios,
  ...equalizerQValues,
  ...equalizerTypes,
  ...equalizerShelvingSlopes,
  ...crossoverFilters,
  ...outputNames,
  ...inputCGains,
  ...polarities,
  ...inputs,
  ...outputs,
  ...channels,
  ...channelLevels,
  ...delayUnits,
};

export default constants;

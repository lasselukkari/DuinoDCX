export function createEmptyEqualizer() {
  return {
    equalizerType: '',
    equalizerFrequency: '',
    equalizerGain: 0,
    equalizerQ: '',
    equalizerShelving: '',
  };
}

export function createEmptyChannel() {
  const equalizers = {};
  for (let i = 1; i <= 9; i++) {
    equalizers[String(i)] = createEmptyEqualizer();
  }

  return {
    channelName: '',
    gain: 0,
    mute: false,
    isDelayOn: false,
    longDelay: 0,
    isEqualizerOn: false,
    equalizerNumber: 0,
    equalizerIndex: 0,
    isDynamicEqualizerOn: false,
    dynamicEqualizerType: '',
    dynamicEqualizerFrequency: '',
    dynamicEqualizerGain: 0,
    dynamicEqualizerQ: '',
    dynamicEqualizerShelving: '',
    dynamicEqualizerAttack: '',
    dynamicEqualizerRelease: '',
    dynamicEqualizerRatio: '',
    dynamicEqualizerThreshold: 0,
    equalizers,
  };
}

export function createEmptyState() {
  return {
    presetName: '',
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
      1: createEmptyChannel(),
      2: createEmptyChannel(),
      3: createEmptyChannel(),
      4: createEmptyChannel(),
      5: createEmptyChannel(),
      6: createEmptyChannel(),
    },
  };
}

/**
 * Convert a command name to a camelCase property key.
 * "Is Delay On" → "isDelayOn"
 * "Equalizer Frequency" → "equalizerFrequency"
 */
export function camelize(string_) {
  return string_
    .replaceAll(/\s+(.)/g, (_, c) => c.toUpperCase())
    .replaceAll(/\s/g, '')
    .replace(/^(.)/, (_, c) => c.toLowerCase());
}
// # sourceMappingURL=helpers.js.map

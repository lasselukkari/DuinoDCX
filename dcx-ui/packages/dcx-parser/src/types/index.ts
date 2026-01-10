/**
 * DCX2496 State Types
 */

/** Equalizer band settings */
export type Equalizer = {
  equalizerType: string;
  equalizerFrequency: string;
  equalizerGain: number;
  equalizerQ: string;
  equalizerShelving: string;
};

/** Channel settings (inputs and outputs share common properties) */
export type Channel = {
  channelName: string;
  gain: number;
  mute: boolean;
  isDelayOn: boolean;
  longDelay: number;
  isEqualizerOn: boolean;
  equalizerNumber: number;
  equalizerIndex: number;
  // Dynamic Equalizer
  isDynamicEqualizerOn: boolean;
  dynamicEqualizerType: string;
  dynamicEqualizerFrequency: string;
  dynamicEqualizerGain: number;
  dynamicEqualizerQ: string;
  dynamicEqualizerShelving: string;
  dynamicEqualizerAttack: string;
  dynamicEqualizerRelease: string;
  dynamicEqualizerRatio: string;
  dynamicEqualizerThreshold: number;
  // Crossover (outputs only, undefined for inputs)
  highpassFilter?: string;
  highpassFrequency?: number;
  lowpassFilter?: string;
  lowpassFrequency?: number;
  // Limiter (outputs only)
  isLimiterOn?: boolean;
  limiterThreshold?: number;
  limiterRelease?: string;
  // Phase (outputs only)
  polarity?: string;
  phase?: number;
  // Source (outputs only)
  source?: string;
  // Short delay (outputs only)
  shortDelay?: number;
  // Equalizer bands (1-9)
  equalizers: Record<string, Equalizer>;
};

/** Global setup settings */
export type Setup = {
  inputSumType: string;
  inputAbSource: string;
  inputCGain: string;
  outputConfig: string;
  stereolink: boolean;
  stereolinkMode: string;
  delayLink: boolean;
  crossoverLink: boolean;
  isDelayCorrectionOn: boolean;
  airTemperature: number;
  delayUnits: string;
  muteOutsWhenPowered: boolean;
  inputASumGain: number;
  inputBSumGain: number;
  inputCSumGain: number;
};

/** Device state */
export type State = {
  presetName: string;
  setup: Setup;
  inputs: Record<string, Channel>;
  outputs: Record<string, Channel>;
};

/** Level meter status */
export type Status = {
  inputs: Array<{name: string; level: number; isLimited: boolean}>;
  outputs: Array<{name: string; level: number; isLimited: boolean}>;
  free: number;
};

/**
 * DCX2496 State Types
 */

/** EQ band settings */
export type Eq = {
  eqType: string;
  eqFrequency: string;
  eqGain: number;
  eqQ: string;
  eqShelving: string;
};

/** Channel settings (inputs and outputs share common properties) */
export type Channel = {
  channelName: string;
  gain: number;
  mute: boolean;
  isDelayOn: boolean;
  longDelay: number;
  isEqOn: boolean;
  eqNumber: number;
  eqIndex: number;
  // Dynamic EQ
  isDynamicEqOn: boolean;
  dynamicEqType: string;
  dynamicEqFrequency: string;
  dynamicEqGain: number;
  dynamicEqQ: string;
  dynamicEqShelving: string;
  dynamicEqAttack: string;
  dynamicEqRelease: string;
  dynamicEqRatio: string;
  dynamicEqThreshold: number;
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
  // EQ bands (1-9)
  eqs: Record<string, Eq>;
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
  activePreset: string;
  setup: Setup;
  inputs: Record<string, Channel>;
  outputs: Record<string, Channel>;
};

/** Level meter status */
export type Status = {
  inputs: Array<{ name: string; level: number; isLimited: boolean }>;
  outputs: Array<{ name: string; level: number; isLimited: boolean }>;
  free: number;
};

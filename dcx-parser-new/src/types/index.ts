export type Setup = {
  [key: string]: any;
  inputSumType?: string;
  inputABSource?: string;
  inputCGain?: string;
  outputConfig?: string;
  stereolink?: boolean;
  stereolinkMode?: string;
  delayLink?: boolean;
  crossoverLink?: boolean;
  airTemperature?: number;
  delayUnits?: string;
  isDelayCorrectionOn?: boolean;
  muteOutsWhenPowered?: boolean;
  inputASumGain?: number;
  inputBSumGain?: number;
  inputCSumGain?: number;
};

export type Equalizer = {
  [key: string]: any;
  equalizerType?: string;
  equalizerFrequency: string;
  equalizerGain: number;
  equalizerQ: string;
  equalizerShelving: string;
};

export type EqBand = {
  frequency: number;
  q: string;
  gain: number;
  type: string;
  shelving: string;
};

export type InputChannel = {
  [key: string]: any;
  gain: number;
  mute: boolean;
  isDelayOn: boolean;
  longDelay: number;
  isEqualizerOn: boolean;
  channelName: string;

  // Dynamic EQ
  dynamicEqualizerAttack: string;
  dynamicEqualizerRelease: string;
  dynamicEqualizerRatio: string;
  dynamicEqualizerThreshold: number;
  isDynamicEqualizerOn: boolean;
  dynamicEqualizerFrequency: string;
  dynamicEqualizerQ: string;
  dynamicEqualizerGain: number;
  dynamicEqualizerType: string;
  dynamicEqualizerShelving: string;

  // EQs bank for legacy UI
  equalizers: Record<string, Equalizer>;
};

export type OutputChannel = {
  source: string;
  highpassFilter: string;
  highpassFrequency: string;
  lowpassFilter: string;
  lowpassFrequency: string;
  isLimiterOn: boolean;
  limiterThreshold: number;
  limiterRelease: string;
  polarity: string;
  phase: number;
  shortDelay: number;
} & InputChannel;

export type BufferHeader = {
  // XPCR block
  xpcrSignature: string;
  xpcrVersion: number;
  xpcrExtension: Uint8Array;

  // XPRB block
  xprbSignature: string;
  xprbVersion: number;
  xprbExtension: Uint8Array;

  // Device info
  deviceName: string;
  deviceNamePadding: Uint8Array;

  // Signatures
  signatureBytes: Uint8Array;

  // XCUR block
  xcurSignature: string;
  xcurVersion: number;
  xcurExtension: Uint8Array;

  // Preset info
  presetName: string;
  presetNamePadding: Uint8Array;
  headerReserved: Uint8Array;
};

export type Channel = InputChannel | OutputChannel;

export function isOutputChannel(channel: Channel): channel is OutputChannel {
  return (channel as OutputChannel).source !== undefined;
}

export type State = {
  header: BufferHeader;
  setup: Setup;
  inputs: Record<string, InputChannel>;
  outputs: Record<string, OutputChannel>;
};

export type Status = {
  inputs: Array<{name: string; level: number; isLimited: boolean}>;
  outputs: Array<{name: string; level: number; isLimited: boolean}>;
  free: number;
};

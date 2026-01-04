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
    highpassFilter?: string;
    highpassFrequency?: number;
    lowpassFilter?: string;
    lowpassFrequency?: number;
    isLimiterOn?: boolean;
    limiterThreshold?: number;
    limiterRelease?: string;
    polarity?: string;
    phase?: number;
    source?: string;
    shortDelay?: number;
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
    inputs: Array<{
        name: string;
        level: number;
        isLimited: boolean;
    }>;
    outputs: Array<{
        name: string;
        level: number;
        isLimited: boolean;
    }>;
    free: number;
};
//# sourceMappingURL=index.d.ts.map
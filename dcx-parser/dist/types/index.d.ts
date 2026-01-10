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
    xpcrSignature: string;
    xpcrVersion: number;
    xpcrExtension: Uint8Array;
    xprbSignature: string;
    xprbVersion: number;
    xprbExtension: Uint8Array;
    deviceName: string;
    deviceNamePadding: Uint8Array;
    signatureBytes: Uint8Array;
    xcurSignature: string;
    xcurVersion: number;
    xcurExtension: Uint8Array;
    presetName: string;
    presetNamePadding: Uint8Array;
    headerReserved: Uint8Array;
};
export type Channel = InputChannel | OutputChannel;
export declare function isOutputChannel(channel: Channel): channel is OutputChannel;
export type State = {
    header: BufferHeader;
    setup: Setup;
    inputs: Record<string, InputChannel>;
    outputs: Record<string, OutputChannel>;
};
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
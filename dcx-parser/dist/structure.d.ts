/**
 * Preset Structure Definition V3
 * Derived from:
 * 1. DCX-Remote.exe embedded template (offset 0xf8dac)
 * 2. preset_00_calibration.bin byte analysis
 *
 * Key differences from Edit Buffer:
 * - Parameter order differs in DynEQ section
 * - No dynamicEqualizerQ field (it's dynamicEqualizerGain)
 * - 124 bytes per Input Channel
 * - 10 bytes per EQ band (same as Edit Buffer)
 */
export type ParameterDefinition = string | undefined | {
    name: string;
    type: 'string';
    length: number;
} | {
    name: string;
    type: 'skip';
    length: number;
} | {
    name: string;
    type: 'uint32';
};
export declare const EDIT_BUFFER_SETUP_PARAMS: ParameterDefinition[];
export declare const PRESET_SETUP_PARAMS: ParameterDefinition[];
export declare const INPUT_CHANNEL_PARAMS: ParameterDefinition[];
export declare const EQ_BAND_PARAMS: ParameterDefinition[];
export declare const OUTPUT_CHANNEL_PARAMS_PREFIX: ParameterDefinition[];
export declare const OUTPUT_EXTRA_PARAMS: ParameterDefinition[];
export declare const INPUT_NAMES: readonly ["A", "B", "C", "Sum"];
export declare const OUTPUT_NAMES: readonly ["1", "2", "3", "4", "5", "6"];
export declare const INPUT_CHANNEL_SIZE = 124;
export declare const EQ_BAND_SIZE = 10;
export declare const INPUT_EQ_COUNT = 9;
export declare const OUTPUT_EQ_COUNT = 9;
export declare const INPUT_PREFIX_SIZE = 34;
export declare const OUTPUT_PREFIX_SIZE = 34;
//# sourceMappingURL=structure.d.ts.map
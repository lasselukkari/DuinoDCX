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
export declare const EDIT_BUFFER_SETUP_PARAMETERS: ParameterDefinition[];
export declare const PRESET_SETUP_PARAMETERS: ParameterDefinition[];
export declare const INPUT_CHANNEL_PARAMETERS: ParameterDefinition[];
export declare const EQUALIZER_BAND_PARAMETERS: ParameterDefinition[];
export declare const OUTPUT_CHANNEL_PARAMETERS_PREFIX: ParameterDefinition[];
export declare const OUTPUT_EXTRA_PARAMETERS: ParameterDefinition[];
export declare const INPUT_NAMES: readonly ["A", "B", "C", "Sum"];
export declare const OUTPUT_NAMES: readonly ["1", "2", "3", "4", "5", "6"];
//# sourceMappingURL=structure.d.ts.map
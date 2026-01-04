export type ParameterInfo = {
    name: string;
    type: "bool" | "enum" | "number";
    index: number;
    highByteIndex?: number;
    wordOffset?: number;
    wordHighOffset?: number;
    values?: readonly string[];
    unit?: string;
    min?: number;
    max?: number;
    step?: number;
};
export declare const setupParameters: ParameterInfo[];
export declare const channelParameters: Array<{
    name: string;
    type: "bool" | "enum" | "number";
    channels: Array<{
        index: number;
        highByteIndex?: number;
        wordOffset?: number;
        wordHighOffset?: number;
    } | null>;
    values?: readonly string[];
    unit?: string;
    min?: number;
    max?: number;
    step?: number;
}>;
export declare const outputOnlyParameters: Array<{
    name: string;
    type: "bool" | "enum" | "number";
    outputs: Array<{
        index: number;
        highByteIndex?: number;
        wordOffset?: number;
        wordHighOffset?: number;
    } | null>;
    values?: readonly string[];
    unit?: string;
    min?: number;
    max?: number;
    step?: number;
}>;
export declare const equalizerParameters: Array<{
    name: string;
    type: "bool" | "enum" | "number";
    bands: Array<{
        index: number;
        highByteIndex?: number;
        wordOffset?: number;
        wordHighOffset?: number;
    } | null>;
    values?: readonly string[];
    unit?: string;
    min?: number;
    max?: number;
    step?: number;
}>;
//# sourceMappingURL=parameter-mappings.d.ts.map
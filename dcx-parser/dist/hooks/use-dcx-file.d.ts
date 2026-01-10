import { type ParsedPreset, type DcxFile } from '../dcx-file.js';
/**
 * Hook for handling .dcx file parsing
 */
export declare function useDcxFile(): {
    file: DcxFile | null;
    presets: ParsedPreset[];
    dcxData: Uint8Array<ArrayBufferLike> | null;
    error: string | null;
    isLoading: boolean;
    loadFromBuffer: (data: Uint8Array) => void;
    getPreset: (slot: number) => ParsedPreset;
    clear: () => void;
};
//# sourceMappingURL=use-dcx-file.d.ts.map
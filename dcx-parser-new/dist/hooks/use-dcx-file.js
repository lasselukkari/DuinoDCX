/**
 * Hook for reading .dcx files.
 */
import { useState, useCallback } from 'react';
import { parseDcxFile, parseDcxPresets, isValidDcxFile, } from '../dcx-file.js';
/**
 * Hook for handling .dcx file parsing
 */
export function useDcxFile() {
    const [file, setFile] = useState(null);
    const [presets, setPresets] = useState([]);
    const [dcxData, setDcxData] = useState(null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    /**
     * Parse a raw .dcx file (Uint8Array)
     */
    const loadFromBuffer = useCallback((data) => {
        setIsLoading(true);
        setError(null);
        setFile(null);
        setPresets([]);
        setDcxData(null);
        try {
            if (!isValidDcxFile(data)) {
                throw new Error('Invalid .dcx file signature');
            }
            // Parse file structure info
            const parsedFile = parseDcxFile(data);
            setFile(parsedFile);
            // Parse all presets (handles compact deltas)
            const parsedPresets = parseDcxPresets(data);
            setPresets(parsedPresets);
            setDcxData(data);
        }
        catch (error_) {
            console.error('Failed to parse .dcx file', error_);
            setError(error_ instanceof Error ? error_.message : String(error_));
        }
        finally {
            setIsLoading(false);
        }
    }, []);
    /**
     * Get a specific preset by slot index (0-59)
     */
    const getPreset = useCallback((slot) => {
        return presets[slot];
    }, [presets]);
    /**
     * Clear loaded file
     */
    const clear = useCallback(() => {
        setFile(null);
        setPresets([]);
        setDcxData(null);
        setError(null);
    }, []);
    return {
        file,
        presets,
        dcxData,
        error,
        isLoading,
        loadFromBuffer,
        getPreset,
        clear,
    };
}
//# sourceMappingURL=use-dcx-file.js.map
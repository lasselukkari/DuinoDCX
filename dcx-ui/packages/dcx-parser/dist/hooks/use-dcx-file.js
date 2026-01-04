/**
 * Hook for managing .dcx file data.
 *
 * Provides access to preset data from either:
 * - A file loaded from the client
 * - Downloaded device backup
 */
import { useState, useCallback, useMemo } from 'react';
import { parseDcxFileToStates } from '../file/preset-parser.js';
/**
 * Hook for managing .dcx file data and accessing presets.
 */
export function useDcxFile() {
    const [dcxData, setDcxData] = useState(null);
    const [parsedPresets, setParsedPresets] = useState([]);
    const [lockFlags, setLockFlags] = useState([]);
    /**
     * Load from a File object (e.g., from file picker).
     */
    const loadFromFile = useCallback(async (file) => {
        const buffer = await file.arrayBuffer();
        const data = new Uint8Array(buffer);
        loadFromBuffer(data);
    }, []);
    /**
     * Load from a Uint8Array (e.g., downloaded from device).
     */
    const loadFromBuffer = useCallback((data) => {
        try {
            const result = parseDcxFileToStates(data);
            setDcxData(data);
            setParsedPresets(result.presets);
            setLockFlags(result.lockFlags);
        }
        catch (error) {
            console.error('Failed to parse DCX file:', error);
            setDcxData(null);
            setParsedPresets([]);
            setLockFlags([]);
        }
    }, []);
    /**
     * Clear current file data.
     */
    const clear = useCallback(() => {
        setDcxData(null);
        setParsedPresets([]);
        setLockFlags([]);
    }, []);
    /**
     * Build the presets array with all 60 slots.
     * Empty slots have isEmpty: true.
     */
    const presets = useMemo(() => {
        const result = [];
        // Build a map of parsed presets by slot
        const presetMap = new Map();
        for (const preset of parsedPresets) {
            presetMap.set(preset.slot, preset);
        }
        // Generate all 60 slots
        for (let slot = 1; slot <= 60; slot++) {
            const preset = presetMap.get(slot);
            if (preset) {
                result.push({
                    slot,
                    name: preset.name,
                    isEmpty: false,
                    isLocked: preset.isLocked,
                    state: preset.state,
                });
            }
            else {
                result.push({
                    slot,
                    name: `<Empty ${slot}>`,
                    isEmpty: true,
                    isLocked: lockFlags[slot - 1] ?? false,
                    state: null, // Empty slots have no state
                });
            }
        }
        return result;
    }, [parsedPresets, lockFlags]);
    /**
     * Get a single preset by slot number (1-60).
     */
    const getPreset = useCallback((slot) => {
        return presets.find((p) => p.slot === slot);
    }, [presets]);
    return {
        dcxData,
        presets,
        loadFromFile,
        loadFromBuffer,
        clear,
        getPreset,
    };
}
//# sourceMappingURL=use-dcx-file.js.map
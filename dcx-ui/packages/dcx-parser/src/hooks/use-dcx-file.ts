/**
 * Hook for managing .dcx file data.
 *
 * Provides access to preset data from either:
 * - A file loaded from the client
 * - Downloaded device backup
 */

import {useState, useCallback, useMemo} from 'react';
import type {State} from '../types/index.js';
import {
  parseDcxFileToStates,
  type ParsedPreset,
} from '../file/preset-parser.js';

/**
 * Entry for a single preset slot.
 */
export type PresetEntry = {
  slot: number;
  name: string;
  isEmpty: boolean;
  isLocked: boolean;
  state: State;
};

/**
 * Hook for managing .dcx file data and accessing presets.
 */
export function useDcxFile() {
  const [dcxData, setDcxData] = useState<Uint8Array | undefined>(undefined);
  const [parsedPresets, setParsedPresets] = useState<ParsedPreset[]>([]);
  const [lockFlags, setLockFlags] = useState<boolean[]>([]);

  /**
   * Load from a File object (e.g., from file picker).
   */
  const loadFromFile = useCallback(async (file: File) => {
    const buffer = await file.arrayBuffer();
    const data = new Uint8Array(buffer);
    loadFromBuffer(data);
  }, []);

  /**
   * Load from a Uint8Array (e.g., downloaded from device).
   */
  const loadFromBuffer = useCallback((data: Uint8Array) => {
    try {
      const result = parseDcxFileToStates(data);
      setDcxData(data);
      setParsedPresets(result.presets);
      setLockFlags(result.lockFlags);
    } catch (error) {
      console.error('Failed to parse DCX file:', error);
      setDcxData(undefined);
      setParsedPresets([]);
      setLockFlags([]);
    }
  }, []);

  /**
   * Clear current file data.
   */
  const clear = useCallback(() => {
    setDcxData(undefined);
    setParsedPresets([]);
    setLockFlags([]);
  }, []);

  /**
   * Build the presets array with all 60 slots.
   * Empty slots have isEmpty: true.
   */
  const presets = useMemo<PresetEntry[]>(() => {
    const result: PresetEntry[] = [];

    // Build a map of parsed presets by slot
    const presetMap = new Map<number, ParsedPreset>();
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
      } else {
        result.push({
          slot,
          name: `<Empty ${slot}>`,
          isEmpty: true,
          isLocked: lockFlags[slot - 1] ?? false,
          state: undefined as unknown as State, // Empty slots have no state
        });
      }
    }

    return result;
  }, [parsedPresets, lockFlags]);

  /**
   * Get a single preset by slot number (1-60).
   */
  const getPreset = useCallback(
    (slot: number): PresetEntry | undefined => {
      return presets.find((p: PresetEntry) => p.slot === slot);
    },
    [presets],
  );

  return {
    dcxData,
    presets,
    loadFromFile,
    loadFromBuffer,
    clear,
    getPreset,
  };
}

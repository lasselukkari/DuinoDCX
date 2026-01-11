/**
 * Hook for reading .dcx files.
 */
import {useState, useCallback} from 'react';
import {
  type ParsedPreset,
  type DcxFile,
  parseDcxFile,
  parseDcxPresets,
  isValidDcxFile,
} from 'dcx-parser';

/**
 * Hook for handling .dcx file parsing
 */
export function useDcxFile() {
  const [file, setFile] = useState<DcxFile | undefined>(undefined);
  const [presets, setPresets] = useState<ParsedPreset[]>([]);
  const [dcxData, setDcxData] = useState<Uint8Array | undefined>(undefined);
  const [error, setError] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Parse a raw .dcx file (Uint8Array)
   */
  const loadFromBuffer = useCallback((data: Uint8Array) => {
    setIsLoading(true);
    setError(undefined);
    setFile(undefined);
    setPresets([]);
    setDcxData(undefined);

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
    } catch (error_) {
      console.error('Failed to parse .dcx file', error_);
      setError(error_ instanceof Error ? error_.message : String(error_));
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Get a specific preset by slot index (0-59)
   */
  const getPreset = useCallback(
    (slot: number) => {
      return presets[slot];
    },
    [presets],
  );

  /**
   * Clear loaded file
   */
  const clear = useCallback(() => {
    setFile(undefined);
    setPresets([]);
    setDcxData(undefined);
    setError(undefined);
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

/**
 * Hook for managing .dcx file data.
 *
 * Provides access to preset data from either:
 * - A file loaded from the client
 * - Downloaded device backup
 */
import type {State} from '../types/index.js';
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
export declare function useDcxFile(): {
  dcxData: Uint8Array;
  presets: PresetEntry[];
  loadFromFile: (file: File) => Promise<void>;
  loadFromBuffer: (data: Uint8Array) => void;
  clear: () => void;
  getPreset: (slot: number) => PresetEntry | undefined;
};
// # sourceMappingURL=use-dcx-file.d.ts.map

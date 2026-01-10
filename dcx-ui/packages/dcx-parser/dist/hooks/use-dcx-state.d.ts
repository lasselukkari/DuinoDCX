/**
 * Hook for real-time device state synchronization.
 *
 * Provides:
 * - Current device state
 * - Real-time updates from device
 * - High-level setters for parameter changes
 */
import type {DcxConnection} from '../transport/types.js';
import type {State, Setup} from '../types/index.js';
/**
 * Hook for real-time device state.
 */
export declare function useDcxState(connection: DcxConnection | undefined): {
  state: State;
  isLoading: boolean;
  error: string;
  sync: () => Promise<void>;
  setSetup: (
    key: keyof Setup,
    value: boolean | string | number,
  ) => Promise<void>;
  setChannel: (
    group: 'inputs' | 'outputs',
    id: string,
    key: string,
    value: boolean | string | number,
  ) => Promise<void>;
  setEqualizer: (
    group: 'inputs' | 'outputs',
    channelId: string,
    band: number,
    key: string,
    value: boolean | string | number,
  ) => Promise<void>;
};
// # sourceMappingURL=use-dcx-state.d.ts.map

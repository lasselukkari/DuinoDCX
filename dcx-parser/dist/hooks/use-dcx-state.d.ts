/**
 * Hook for real-time device state synchronization.
 *
 * Uses React's useSyncExternalStore to subscribe to an external store.
 * This is the React-recommended pattern for subscribing to external data.
 *
 * @see https://react.dev/reference/react/useSyncExternalStore
 */
import type { DcxConnection } from '../transport/types.js';
import type { Setup } from '../types/index.js';
/**
 * Hook for real-time device state.
 */
export declare function useDcxState(connection: DcxConnection | undefined): {
    state: import("../index.js").State | null;
    isLoading: boolean;
    error: string | null;
    sync: () => Promise<void>;
    setSetup: (key: keyof Setup, value: boolean | string | number) => Promise<void>;
    setChannel: (group: "inputs" | "outputs", id: string, key: string, value: boolean | string | number) => Promise<void>;
    setEqualizer: (group: "inputs" | "outputs", channelId: string, band: number, key: string, value: boolean | string | number) => Promise<void>;
};
//# sourceMappingURL=use-dcx-state.d.ts.map
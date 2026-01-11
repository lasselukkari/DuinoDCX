/**
 * External store for DCX2496 device state.
 *
 * This store lives outside React and provides a subscription-based interface
 * for React's useSyncExternalStore hook. This pattern is recommended by React
 * for subscribing to external data sources.
 *
 * @see https://react.dev/reference/react/useSyncExternalStore
 */
import type { State } from '../types/index.js';
type Listener = () => void;
/**
 * External store for device state.
 */
export declare class DcxStore {
    private state;
    private readonly listeners;
    /**
     * Get the current state snapshot.
     * Required by useSyncExternalStore.
     */
    getSnapshot: () => State | undefined;
    /**
     * Subscribe to state changes.
     * Required by useSyncExternalStore.
     */
    subscribe: (listener: Listener) => (() => void);
    /**
     * Set the full state from a parsed edit buffer.
     * Called when both edit buffer parts have been received and parsed.
     */
    setFullState(newState: State): void;
    /**
     * Apply a direct parameter update from the device.
     * Called when a CMD_DIRECT (0x20) message is received.
     */
    applyDirectUpdate(channel: number, parameter: number, value: number): void;
    /**
     * Apply an optimistic update from the UI.
     * Called when the user changes a value before the device confirms.
     */
    applyOptimisticUpdate(group: 'setup' | 'inputs' | 'outputs', id: string | undefined, key: string, value: boolean | string | number): void;
    /**
     * Reset the store to initial state.
     */
    reset(): void;
    /**
     * Notify all listeners of a state change.
     */
    private notify;
    /**
     * Deep clone state for immutable updates.
     */
    /**
     * Deep clone state for immutable updates.
     * Updated for V2 State structure (no equalizers wrapping).
     */
    private cloneState;
}
/**
 * Singleton instance of the store.
 */
export declare const dcxStore: DcxStore;
export {};
//# sourceMappingURL=dcx-store.d.ts.map
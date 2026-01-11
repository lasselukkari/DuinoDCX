/**
 * External store for DCX2496 device state.
 *
 * This store lives outside React and provides a subscription-based interface
 * for React's useSyncExternalStore hook. This pattern is recommended by React
 * for subscribing to external data sources.
 *
 * @see https://react.dev/reference/react/useSyncExternalStore
 */

import type {State} from '../types/index.js';
import {
  directLookup,
  convertValue,
  applyToState,
  type DirectKey,
} from '../model/param-lookup.js';

type Listener = () => void;

/**
 * External store for device state.
 */
export class DcxStore {
  private state: State | undefined;
  private readonly listeners = new Set<Listener>();

  /**
   * Get the current state snapshot.
   * Required by useSyncExternalStore.
   */
  getSnapshot = (): State | undefined => {
    return this.state;
  };

  /**
   * Subscribe to state changes.
   * Required by useSyncExternalStore.
   */
  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  /**
   * Set the full state from a parsed edit buffer.
   * Called when both edit buffer parts have been received and parsed.
   */
  setFullState(newState: State): void {
    this.state = newState;
    this.notify();
  }

  /**
   * Apply a direct parameter update from the device.
   * Called when a CMD_DIRECT (0x20) message is received.
   */
  applyDirectUpdate(channel: number, parameter: number, value: number): void {
    if (!this.state) return;

    const key: DirectKey = `${channel}:${parameter}`;
    const def = directLookup.get(key);

    if (!def) {
      console.warn(
        `[DcxStore] Unknown parameter: channel=${channel}, param=${parameter}`,
      );
      return;
    }

    // Create new state immutably
    const newState = this.cloneState(this.state);
    const typedValue = convertValue(def, value);

    applyToState(newState, def, typedValue);

    this.state = newState;
    this.notify();
  }

  /**
   * Apply an optimistic update from the UI.
   * Called when the user changes a value before the device confirms.
   */
  applyOptimisticUpdate(
    group: 'setup' | 'inputs' | 'outputs',
    id: string | undefined,
    key: string,
    value: boolean | string | number,
  ): void {
    if (!this.state) return;

    console.log(
      `[DcxStore] Optimistic Update: ${group}.${id ?? ''}.${key} = ${value}`,
    );
    const newState = this.cloneState(this.state);

    if (group === 'setup') {
      newState.setup[key] = value;
    } else if (id) {
      // Check inputs or outputs
      if (group === 'inputs') {
        const channel = newState.inputs[id];
        channel[key] = value;
      } else if (group === 'outputs') {
        const channel = newState.outputs[id];
        channel[key] = value;
      }
    }

    this.state = newState;
    this.notify();
  }

  /**
   * Reset the store to initial state.
   */
  reset(): void {
    console.log('[DcxStore] Reset');
    this.state = undefined;
    this.notify();
  }

  /**
   * Notify all listeners of a state change.
   */
  private notify(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }

  /**
   * Deep clone state for immutable updates.
   */
  /**
   * Deep clone state for immutable updates.
   * Updated for V2 State structure (no equalizers wrapping).
   */
  private cloneState(state: State): State {
    // Since V2 state structure is deep, JSON clone is safest and easiest for now.
    // Performance impact is negligible for this size of object (few KB).
    return structuredClone(state);
  }
}

/**
 * Singleton instance of the store.
 */
export const dcxStore = new DcxStore();

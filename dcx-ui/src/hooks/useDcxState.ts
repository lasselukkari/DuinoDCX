/**
 * Hook for real-time device state synchronization.
 *
 * Uses React's useSyncExternalStore to subscribe to an external store.
 * This is the React-recommended pattern for subscribing to external data.
 *
 * Uses EditBufferSession for proper sequencing (part 0 before part 1).
 *
 * @see https://react.dev/reference/react/useSyncExternalStore
 */

import {
  useSyncExternalStore,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  type DcxConnection,
  type Setup,
  parseMessage,
  buildParameterChangeCommand,
  type ParameterTarget,
  dcxStore,
  EditBufferSession,
  EditBufferPhase,
} from 'dcx-parser';

/**
 * Hook for real-time device state.
 */
export function useDcxState(connection: DcxConnection | undefined) {
  // Subscribe to the external store using React's recommended pattern
  const state = useSyncExternalStore(
    dcxStore.subscribe,
    dcxStore.getSnapshot,
    () => undefined, // Server snapshot (SSR)
  );

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  // Session for edit buffer fetch (handles part 0 before part 1 sequencing)
  const sessionRef = useRef<EditBufferSession>(new EditBufferSession());

  /**
   * Send next message from session queue.
   */
  const sendNextMessage = useCallback(async () => {
    if (!connection) return;

    const message = sessionRef.current.getNextMessage();
    if (message) {
      await connection.send(message);
    }
  }, [connection]);

  /**
   * Fetch current state from device using EditBufferSession.
   */
  const sync = useCallback(async () => {
    if (!connection) {
      setError('No connection');
      return;
    }

    console.log('[useDcxState] Starting edit buffer session');
    sessionRef.current.reset();
    sessionRef.current.start();
    setIsLoading(true);
    setError(undefined);

    // Send the first message (part 0 request)
    await sendNextMessage();
  }, [connection, sendNextMessage]);

  /**
   * Subscribe to device messages and drive the session.
   */
  useEffect(() => {
    if (!connection) return;

    const unsubscribe = connection.onMessage((data) => {
      const message = parseMessage(data);
      if (!message) return;

      // Feed message to the session (only if downloading)
      const session = sessionRef.current;
      if (session.getPhase() === EditBufferPhase.DOWNLOADING) {
        session.processResponse(message);

        // Check if session just completed
        if (session.isComplete()) {
          const newState = session.getState();
          if (newState) {
            console.log('[useDcxState] State parsed, setting full state');
            dcxStore.setFullState(newState);
          }
          setIsLoading(false);
          // Reset session to IDLE so it doesn't retrigger
          session.reset();
        } else if (session.isError()) {
          console.error('[useDcxState] Session error:', session.getError());
          setError(session.getError());
          setIsLoading(false);
          session.reset();
        } else {
          // Send next message if there's one queued (e.g., part 1 request)
          void sendNextMessage();
        }
      }

      // Handle direct parameter updates (real-time changes)
      if (message.type === 'direct') {
        console.log('[useDcxState] Received direct update:', message.parameters);
        for (const {channel, param, value} of message.parameters) {
          dcxStore.applyDirectUpdate(channel, param, value);
        }
      }
    });

    return unsubscribe;
  }, [connection, sendNextMessage]);

  /**
   * Set a setup parameter.
   */
  const setSetup = useCallback(
    async (key: keyof Setup, value: boolean | string | number) => {
      if (!connection) return;

      const target: ParameterTarget = {kind: 'setup', key: String(key)};
      const cmd = buildParameterChangeCommand(target, value);
      if (cmd) {
        await connection.send(cmd);
        // Optimistic update through the store
        dcxStore.applyOptimisticUpdate('setup', undefined, String(key), value);
      }
    },
    [connection],
  );

  /**
   * Set a channel parameter.
   */
  const setChannel = useCallback(
    async (
      group: 'inputs' | 'outputs',
      id: string,
      key: string,
      value: boolean | string | number,
    ) => {
      if (!connection) return;

      const target: ParameterTarget = {kind: 'channel', group, id, key};
      const cmd = buildParameterChangeCommand(target, value);
      if (cmd) {
        await connection.send(cmd);
        // Optimistic update through the store
        dcxStore.applyOptimisticUpdate(group, id, key, value);
      }
    },
    [connection],
  );

  /**
   * Set an equalizer parameter.
   */
  const setEqualizer = useCallback(
    async (
      target: {group: 'inputs' | 'outputs'; channelId: string; band: number},
      key: string,
      value: boolean | string | number,
    ) => {
      if (!connection) return;

      const fullTarget: ParameterTarget = {
        kind: 'equalizer',
        ...target,
        key,
      };
      const cmd = buildParameterChangeCommand(fullTarget, value);
      if (cmd) {
        await connection.send(cmd);
        // Note: Equalizer changes flow through the device state sync
      }
    },
    [connection],
  );

  return {
    state,
    isLoading,
    error,
    sync,
    setSetup,
    setChannel,
    setEqualizer,
  };
}

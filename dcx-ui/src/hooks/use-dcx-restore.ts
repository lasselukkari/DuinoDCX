/**
 * Hook for restoring .dcx file to device.
 *
 * Wraps the RestoreSession class for React usage.
 */

import {useState, useCallback, useRef, useEffect} from 'react';
import {type DcxConnection, RestoreSession, parseMessage} from 'dcx-parser';

export type RestoreStatus =
  | 'idle'
  | 'initializing'
  | 'transferring'
  | 'completed'
  | 'error';

/**
 * Hook for restoring .dcx file to device.
 */
export function useDcxRestore(connection: DcxConnection | undefined) {
  const [status, setStatus] = useState<RestoreStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | undefined>(undefined);
  const sessionRef = useRef<RestoreSession | undefined>(undefined);
  const unsubscribeRef = useRef<(() => void) | undefined>(undefined);

  /**
   * Start the restore process.
   */
  const start = useCallback(
    async (dcxData: Uint8Array) => {
      if (!connection) {
        setError('No connection');
        setStatus('error');
        return;
      }

      // Reset state
      setStatus('initializing');
      setProgress(0);
      setError(undefined);

      // Create restore session
      const session = new RestoreSession(dcxData);
      sessionRef.current = session;
      session.start();

      // Subscribe to messages
      unsubscribeRef.current = connection.onMessage((data) => {
        const message = parseMessage(data);
        if (!message || !sessionRef.current) return;

        sessionRef.current.processResponse(message);

        // Update status based on session phase
        const sessionStatus = sessionRef.current.getStatus();
        switch (sessionStatus.phase) {
          case 'INITIALIZING': {
            setStatus('initializing');
            break;
          }

          case 'MAIN_MEMORY':
          case 'CURRENT_STATE': {
            setStatus('transferring');
            break;
          }

          case 'COMPLETED': {
            setStatus('completed');
            setProgress(1);
            unsubscribeRef.current?.();
            unsubscribeRef.current = undefined;
            return;
          }

          case 'ERROR': {
            setStatus('error');
            unsubscribeRef.current?.();
            unsubscribeRef.current = undefined;
            return;
          }

          default: {
            break;
          }
        }

        // Send next message if available
        void sendNextMessage();
      });

      // Start sending messages
      void sendNextMessage();

      async function sendNextMessage() {
        if (!sessionRef.current || !connection) return;

        const message = sessionRef.current.getNextMessage();
        if (message) {
          try {
            await connection.send(message);

            // Update progress based on phase
            const sessionStatus = sessionRef.current.getStatus();
            if (sessionStatus.phase === 'MAIN_MEMORY') {
              // Phase 1: pages 0-11 (0% to 80%)
              setProgress((12 - sessionStatus.queueLength) / 15);
            } else if (sessionStatus.phase === 'CURRENT_STATE') {
              // Phase 2: pages 0-1 (80% to 100%)
              setProgress(0.8 + (2 - sessionStatus.queueLength) / 10);
            }

            // Check for more messages immediately
            const nextMessage = sessionRef.current.getNextMessage();
            if (nextMessage) {
              // Small delay to avoid flooding
              setTimeout(async () => sendNextMessage(), 50);
            }
          } catch (error_) {
            setError(String(error_));
            setStatus('error');
            unsubscribeRef.current?.();
            unsubscribeRef.current = undefined;
          }
        }
      }
    },
    [connection],
  );

  /**
   * Reset to idle state.
   */
  const reset = useCallback(() => {
    unsubscribeRef.current?.();
    unsubscribeRef.current = undefined;
    sessionRef.current = undefined;
    setStatus('idle');
    setProgress(0);
    setError(undefined);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      unsubscribeRef.current?.();
    };
  }, []);

  return {
    status,
    progress,
    error,
    start,
    reset,
  };
}

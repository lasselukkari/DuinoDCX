/**
 * Hook for downloading device backup.
 *
 * Uses the BackupSession state machine to download all 12 memory pages
 * one at a time, waiting for each response before requesting the next.
 */

import {useState, useCallback, useRef, useEffect} from 'react';
import {type DcxConnection, parseMessage, BackupSession} from 'dcx-parser';

export type BackupStatus = 'idle' | 'downloading' | 'completed' | 'error';

/**
 * Hook for downloading device backup.
 */
export function useDcxBackup(connection: DcxConnection | undefined) {
  const [status, setStatus] = useState<BackupStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [dcxData, setDcxData] = useState<Uint8Array | undefined>(undefined);
  const [error, setError] = useState<string | undefined>(undefined);

  const sessionRef = useRef<BackupSession | undefined>(undefined);
  const unsubscribeRef = useRef<(() => void) | undefined>(undefined);

  /**
   * Process pending messages from the session.
   * Called after session state changes to send any queued requests.
   */
  const flushMessages = useCallback(async () => {
    const session = sessionRef.current;
    if (!session || !connection) return;

    const message = session.getNextMessage();
    if (message) {
      try {
        await connection.send(message);
      } catch (error_) {
        console.error('Failed to send backup request:', error_);
      }
    }
  }, [connection]);

  /**
   * Handle incoming messages from the device.
   */
  const handleMessage = useCallback(
    (data: Uint8Array) => {
      const session = sessionRef.current;
      if (!session) return;

      const message = parseMessage(data);
      if (!message) return;

      // Let the state machine process the response
      session.processResponse(message);

      // Update React state based on session state
      const sessionStatus = session.getStatus();
      setProgress(sessionStatus.progress);

      if (session.isComplete()) {
        setDcxData(session.getDcxData());
        setStatus('completed');
        // Cleanup subscription
        unsubscribeRef.current?.();
        unsubscribeRef.current = undefined;
      } else if (session.isError()) {
        setError(session.getError());
        setStatus('error');
        // Cleanup subscription
        unsubscribeRef.current?.();
        unsubscribeRef.current = undefined;
      } else {
        // Send the next queued message (if any)
        void flushMessages();
      }
    },
    [flushMessages],
  );

  /**
   * Start the backup process.
   */
  const start = useCallback(async () => {
    if (!connection) {
      setError('No connection');
      setStatus('error');
      return;
    }

    // Reset state
    setStatus('downloading');
    setProgress(0);
    setDcxData(undefined);
    setError(undefined);

    // Create new session
    const session = new BackupSession();
    sessionRef.current = session;

    // Subscribe to messages BEFORE starting
    unsubscribeRef.current = connection.onMessage(handleMessage);

    // Start the session (queues first page request)
    session.start();

    // Send the first message
    await flushMessages();
  }, [connection, handleMessage, flushMessages]);

  /**
   * Reset to idle state.
   */
  const reset = useCallback(() => {
    unsubscribeRef.current?.();
    unsubscribeRef.current = undefined;
    sessionRef.current?.reset();
    sessionRef.current = undefined;
    setStatus('idle');
    setProgress(0);
    setDcxData(undefined);
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
    dcxData,
    error,
    start,
    reset,
  };
}

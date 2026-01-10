/**
 * Hook for downloading device backup.
 *
 * Uses the BackupSession state machine to download all 12 memory pages
 * one at a time, waiting for each response before requesting the next.
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import { parseMessage } from '../protocol/sysex.js';
import { BackupSession } from '../transport/backup.js';
/**
 * Hook for downloading device backup.
 */
export function useDcxBackup(connection) {
    const [status, setStatus] = useState('idle');
    const [progress, setProgress] = useState(0);
    const [dcxData, setDcxData] = useState(null);
    const [error, setError] = useState(null);
    const sessionRef = useRef(null);
    const unsubscribeRef = useRef(null);
    /**
     * Process pending messages from the session.
     * Called after session state changes to send any queued requests.
     */
    const flushMessages = useCallback(async () => {
        const session = sessionRef.current;
        if (!session || !connection)
            return;
        let message = session.getNextMessage();
        while (message) {
            try {
                await connection.send(message);
            }
            catch (err) {
                console.error('Failed to send backup request:', err);
                break;
            }
            // Only send one message at a time, let the response trigger the next
            break;
        }
    }, [connection]);
    /**
     * Handle incoming messages from the device.
     */
    const handleMessage = useCallback((data) => {
        const session = sessionRef.current;
        if (!session)
            return;
        const message = parseMessage(data);
        if (!message)
            return;
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
            unsubscribeRef.current = null;
        }
        else if (session.isError()) {
            setError(session.getError());
            setStatus('error');
            // Cleanup subscription
            unsubscribeRef.current?.();
            unsubscribeRef.current = null;
        }
        else {
            // Send the next queued message (if any)
            void flushMessages();
        }
    }, [flushMessages]);
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
        setDcxData(null);
        setError(null);
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
        unsubscribeRef.current = null;
        sessionRef.current?.reset();
        sessionRef.current = null;
        setStatus('idle');
        setProgress(0);
        setDcxData(null);
        setError(null);
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
//# sourceMappingURL=use-dcx-backup.js.map
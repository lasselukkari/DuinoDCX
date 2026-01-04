/**
 * Hook for restoring .dcx file to device.
 *
 * Wraps the RestoreSession class for React usage.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { DcxConnection } from '../transport/types.js';
import { RestoreSession } from '../transport/restore.js';
import { parseMessage } from '../protocol/sysex.js';

export type RestoreStatus = 'idle' | 'initializing' | 'transferring' | 'completed' | 'error';

/**
 * Hook for restoring .dcx file to device.
 */
export function useDcxRestore(connection: DcxConnection | null) {
    const [status, setStatus] = useState<RestoreStatus>('idle');
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const sessionRef = useRef<RestoreSession | null>(null);
    const unsubscribeRef = useRef<(() => void) | null>(null);

    /**
     * Start the restore process.
     */
    const start = useCallback(async (dcxData: Uint8Array) => {
        if (!connection) {
            setError('No connection');
            setStatus('error');
            return;
        }

        // Reset state
        setStatus('initializing');
        setProgress(0);
        setError(null);

        // Create restore session
        const session = new RestoreSession(dcxData);
        sessionRef.current = session;
        session.start();

        // Subscribe to messages
        unsubscribeRef.current = connection.onMessage((data) => {
            const msg = parseMessage(data);
            if (!msg || !sessionRef.current) return;

            sessionRef.current.processResponse(msg);

            // Update status based on session phase
            const sessionStatus = sessionRef.current.getStatus();
            switch (sessionStatus.phase) {
                case 'INITIALIZING':
                    setStatus('initializing');
                    break;
                case 'MAIN_MEMORY':
                case 'CURRENT_STATE':
                    setStatus('transferring');
                    break;
                case 'COMPLETED':
                    setStatus('completed');
                    setProgress(1);
                    unsubscribeRef.current?.();
                    unsubscribeRef.current = null;
                    return;
                case 'ERROR':
                    setStatus('error');
                    unsubscribeRef.current?.();
                    unsubscribeRef.current = null;
                    return;
            }

            // Send next message if available
            sendNextMessage();
        });

        // Start sending messages
        sendNextMessage();

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
                        setTimeout(() => sendNextMessage(), 50);
                    }
                } catch (err) {
                    setError(String(err));
                    setStatus('error');
                    unsubscribeRef.current?.();
                    unsubscribeRef.current = null;
                }
            }
        }
    }, [connection]);

    /**
     * Reset to idle state.
     */
    const reset = useCallback(() => {
        unsubscribeRef.current?.();
        unsubscribeRef.current = null;
        sessionRef.current = null;
        setStatus('idle');
        setProgress(0);
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
        error,
        start,
        reset,
    };
}

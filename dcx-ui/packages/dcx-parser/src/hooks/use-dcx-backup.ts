/**
 * Hook for downloading device backup.
 *
 * Downloads all 12 memory pages and assembles them into a .dcx file.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { DcxConnection } from '../transport/types.js';
import { buildPageDumpRequest } from '../commands/builders.js';
import { parseMessage } from '../protocol/sysex.js';
import { assemblePagesIntoDcxFile } from '../dcx-file.js';

export type BackupStatus = 'idle' | 'downloading' | 'completed' | 'error';

const TOTAL_PAGES = 12;

/**
 * Hook for downloading device backup.
 */
export function useDcxBackup(connection: DcxConnection | null) {
    const [status, setStatus] = useState<BackupStatus>('idle');
    const [progress, setProgress] = useState(0);
    const [dcxData, setDcxData] = useState<Uint8Array | null>(null);
    const [error, setError] = useState<string | null>(null);

    const pagesRef = useRef<Map<number, Uint8Array>>(new Map());
    const unsubscribeRef = useRef<(() => void) | null>(null);

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
        pagesRef.current.clear();

        // Subscribe to messages
        unsubscribeRef.current = connection.onMessage((data) => {
            const msg = parseMessage(data);
            if (msg?.type === 'pageDump') {
                pagesRef.current.set(msg.page, msg.data);
                setProgress((pagesRef.current.size / TOTAL_PAGES));

                // Check if all pages received
                if (pagesRef.current.size === TOTAL_PAGES) {
                    try {
                        // Assemble pages into DCX file
                        const pages: Array<{ page: number; data: Uint8Array }> = [];
                        for (let i = 0; i < TOTAL_PAGES; i++) {
                            const pageData = pagesRef.current.get(i);
                            if (!pageData) throw new Error(`Missing page ${i}`);
                            pages.push({ page: i, data: pageData });
                        }

                        const dcx = assemblePagesIntoDcxFile(pages);
                        setDcxData(dcx);
                        setStatus('completed');
                    } catch (err) {
                        setError(String(err));
                        setStatus('error');
                    }

                    // Cleanup
                    unsubscribeRef.current?.();
                    unsubscribeRef.current = null;
                }
            }
        });

        // Request all pages
        try {
            for (let page = 0; page < TOTAL_PAGES; page++) {
                await connection.send(buildPageDumpRequest(page));
            }
        } catch (err) {
            setError(String(err));
            setStatus('error');
            unsubscribeRef.current?.();
            unsubscribeRef.current = null;
        }
    }, [connection]);

    /**
     * Reset to idle state.
     */
    const reset = useCallback(() => {
        unsubscribeRef.current?.();
        unsubscribeRef.current = null;
        setStatus('idle');
        setProgress(0);
        setDcxData(null);
        setError(null);
        pagesRef.current.clear();
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

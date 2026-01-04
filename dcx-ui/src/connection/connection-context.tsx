/**
 * Connection Context Provider using SSE-based DcxConnection.
 *
 * This replaces the old DeviceConnectionProvider with one that uses
 * the dcx-parser library's DcxConnection interface.
 */

import {
    createContext,
    useContext,
    useEffect,
    useRef,
    useMemo,
    type ReactNode,
} from 'react';
import type { DcxConnection } from 'dcx-parser';
import { createSseConnection } from './sse-connection.js';

type DcxConnectionContextValue = {
    connection: DcxConnection & {
        connect: () => void;
        disconnect: () => void;
        isConnected: () => boolean;
    };
    clientId: string;
};

const DcxConnectionContext = createContext<DcxConnectionContextValue | undefined>(
    undefined,
);

export const useDcxConnection = () => {
    const context = useContext(DcxConnectionContext);
    if (!context) {
        throw new Error(
            'useDcxConnection must be used within a DcxConnectionProvider',
        );
    }
    return context;
};

export function DcxConnectionProvider({
    children,
}: {
    readonly children: ReactNode;
}) {
    // Generate persistent Client ID
    const clientIdRef = useRef<string>(
        Math.random().toString(36).slice(2, 15) +
        Math.random().toString(36).slice(2, 15),
    );

    // Create connection once
    const connectionRef = useRef<ReturnType<typeof createSseConnection> | null>(null);

    if (!connectionRef.current) {
        connectionRef.current = createSseConnection({
            clientId: clientIdRef.current,
        });
    }

    const connection = connectionRef.current;

    // Connect on mount, disconnect on unmount
    useEffect(() => {
        connection.connect();
        return () => {
            connection.disconnect();
        };
    }, [connection]);

    const value = useMemo(
        () => ({
            connection,
            clientId: clientIdRef.current,
        }),
        [connection],
    );

    return (
        <DcxConnectionContext.Provider value={value}>
            {children}
        </DcxConnectionContext.Provider>
    );
}

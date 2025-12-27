import { useEffect, useRef } from 'react';
import constants from '../dcx2496/constants';
import Parser from '../dcx2496/parser';

interface UseDeviceEventsProps {
    onSearchResponse?: (data: Uint8Array) => void;
    onPingResponse?: (data: Uint8Array) => void;
    onDumpResponse?: (data: Uint8Array) => void;
    onDirectCommand?: (data: Uint8Array) => void;
}

export function useDeviceEvents({
    onSearchResponse,
    onPingResponse,
    onDumpResponse,
    onDirectCommand,
}: UseDeviceEventsProps) {
    const eventSourceRef = useRef<EventSource | null>(null);

    // Use refs for callbacks to avoid re-connecting when they change
    const callbacksRef = useRef({
        onSearchResponse,
        onPingResponse,
        onDumpResponse,
        onDirectCommand,
    });

    useEffect(() => {
        callbacksRef.current = {
            onSearchResponse,
            onPingResponse,
            onDumpResponse,
            onDirectCommand,
        };
    }, [onSearchResponse, onPingResponse, onDumpResponse, onDirectCommand]);

    useEffect(() => {
        const eventSource = new EventSource('/api/events');
        eventSourceRef.current = eventSource;

        eventSource.onopen = () => {
            console.log('SSE connection opened');
        };

        eventSource.onmessage = (event) => {
            if (!event.data) return;

            try {
                const data = Parser.hexToBytes(event.data);

                // Ensure data is long enough to have a command byte
                if (data.length <= constants.COMMAND_BYTE) return;

                const command = data[constants.COMMAND_BYTE];

                switch (command) {
                    case constants.SEARCH_RESPONSE:
                        callbacksRef.current.onSearchResponse?.(data);
                        break;
                    case constants.PING_RESPONSE:
                        callbacksRef.current.onPingResponse?.(data);
                        break;
                    case constants.DUMP_RESPONSE:
                        callbacksRef.current.onDumpResponse?.(data);
                        break;
                    case constants.DIRECT_COMMAND:
                        callbacksRef.current.onDirectCommand?.(data);
                        break;
                    default:
                        console.warn('Unknown SSE command:', command);
                }
            } catch (error) {
                console.error('Error processing SSE message:', error);
            }
        };

        eventSource.onerror = (error) => {
            console.error('SSE connection error:', error);
            // EventSource will automatically reconnect
        };

        return () => {
            eventSource.close();
            eventSourceRef.current = null;
        };
    }, []);
}

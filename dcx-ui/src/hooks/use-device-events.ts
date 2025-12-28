import { useEffect, useRef } from 'react';
import constants from '../dcx2496/constants';
import Parser from '../dcx2496/parser';

interface UseDeviceEventsProps {
    onSearchResponse?: (data: Uint8Array) => void;
    onPingResponse?: (data: Uint8Array) => void;
    onDumpResponse?: (data: Uint8Array) => void;
    onDirectCommand?: (data: Uint8Array) => void;
    onAckResponse?: (data: Uint8Array) => void;
    onOtherResponse?: (data: Uint8Array) => void;
}

export function useDeviceEvents({
    onSearchResponse,
    onPingResponse,
    onDumpResponse,
    onDirectCommand,
    onAckResponse,
    onOtherResponse,
}: UseDeviceEventsProps) {
    const eventSourceRef = useRef<EventSource | null>(null);

    // Use refs for callbacks to avoid re-connecting when they change
    const callbacksRef = useRef({
        onSearchResponse,
        onPingResponse,
        onDumpResponse,
        onDirectCommand,
        onAckResponse,
        onOtherResponse,
    });

    // Generate or retrieve a persistent client ID
    const clientIdRef = useRef<string>('');
    if (!clientIdRef.current) {
        // Simple random ID generation
        clientIdRef.current = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }

    useEffect(() => {
        callbacksRef.current = {
            onSearchResponse,
            onPingResponse,
            onDumpResponse,
            onDirectCommand,
            onAckResponse,
            onOtherResponse,
        };
    }, [onSearchResponse, onPingResponse, onDumpResponse, onDirectCommand, onAckResponse, onOtherResponse]);

    useEffect(() => {
        const eventSource = new EventSource(`/api/events?clientId=${clientIdRef.current}`);
        eventSourceRef.current = eventSource;

        // ... (rest of the event source logic is same)
        eventSource.onopen = () => {
            console.log('SSE connection opened', clientIdRef.current);
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
                    case 0x52: // ACK Command (used in restore handshake)
                        callbacksRef.current.onAckResponse?.(data);
                        break;
                    case 0x50: // Request Command (used in restore handshake)
                        // Use onOtherResponse or a dedicated handler if we added one
                        callbacksRef.current.onOtherResponse?.(data);
                        break;
                    default:
                        // Allow a generic fallback if needed, or just log
                        console.warn('Unknown SSE command:', command);
                        callbacksRef.current.onOtherResponse?.(data);
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

    return clientIdRef.current;
}

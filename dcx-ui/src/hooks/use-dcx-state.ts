/**
 * Hook for real-time device state synchronization.
 *
 * Uses React's useSyncExternalStore to subscribe to an external store.
 * This is the React-recommended pattern for subscribing to external data.
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
    parseEditBuffer,
    buildEditBufferRequest,
    buildParamChangeCommand,
    type ParameterTarget,
    dcxStore,
    getSetupParamId,
    getInputOutputParamId,
    getEqualizerParamId,
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

    // Refs for accumulating edit buffer parts
    const part0Ref = useRef<Uint8Array | undefined>(undefined);
    const part1Ref = useRef<Uint8Array | undefined>(undefined);

    /**
     * Fetch current state from device.
     */
    const sync = useCallback(async () => {
        if (!connection) {
            setError('No connection');
            return;
        }

        setIsLoading(true);
        setError(undefined);
        part0Ref.current = undefined;
        part1Ref.current = undefined;

        try {
            // Request both edit buffer parts
            await connection.send(buildEditBufferRequest(0));
            await connection.send(buildEditBufferRequest(1));
        } catch (error_) {
            setError(String(error_));
            setIsLoading(false);
        }
    }, [connection]);

    /**
     * Subscribe to device messages.
     * No state dependency - uses the store directly.
     */
    useEffect(() => {
        if (!connection) return;

        const unsubscribe = connection.onMessage((data) => {
            const message = parseMessage(data);
            if (!message) return;

            // Handle edit buffer responses
            if (message.type === 'editBuffer') {
                if (message.part === 0) {
                    part0Ref.current = message.data;
                } else if (message.part === 1) {
                    part1Ref.current = message.data;
                }

                // If both parts received, parse state
                if (part0Ref.current && part1Ref.current) {
                    // Concatenate parts (already 8-bit decoded by sysex parser)
                    const combined = new Uint8Array(
                        part0Ref.current.length + part1Ref.current.length,
                    );
                    combined.set(part0Ref.current);
                    combined.set(part1Ref.current, part0Ref.current.length);

                    const newState = parseEditBuffer(combined);
                    dcxStore.setFullState(newState);
                    setIsLoading(false);
                }
            }

            // Handle direct parameter updates (real-time changes)
            if (message.type === 'direct') {
                for (const { channel, param, value } of message.parameters) {
                    dcxStore.applyDirectUpdate(channel, param, value);
                }
            }
        });

        return unsubscribe;
    }, [connection]); // Only depends on connection, not state!

    /**
     * Set a setup parameter.
     */
    const setSetup = useCallback(
        async (key: keyof Setup, value: boolean | string | number) => {
            if (!connection) return;

            const target: ParameterTarget = { kind: 'setup', key: String(key) };
            const cmd = buildParamChangeCommand(target, value);
            if (cmd) {
                await connection.send(cmd);
                // Optimistic update through the store with type-safe ParamId
                const paramId = getSetupParamId(String(key));
                dcxStore.updateSetupParam(paramId, value);
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

            const target: ParameterTarget = { kind: 'channel', group, id, key };
            const cmd = buildParamChangeCommand(target, value);
            if (cmd) {
                await connection.send(cmd);
                // Optimistic update through the store with type-safe ParamId
                const paramId = getInputOutputParamId(key);
                dcxStore.updateChannelParam(group, id, paramId, value);
            }
        },
        [connection],
    );

    /**
     * Set an equalizer parameter.
     */
    const setEqualizer = useCallback(
        async (
            group: 'inputs' | 'outputs',
            channelId: string,
            band: number,
            key: string,
            value: boolean | string | number,
        ) => {
            if (!connection) return;

            const target: ParameterTarget = {
                kind: 'equalizer',
                group,
                channelId,
                band,
                key,
            };
            const cmd = buildParamChangeCommand(target, value);
            if (cmd) {
                await connection.send(cmd);
                // Optimistic update through the store with type-safe ParamId
                const paramId = getEqualizerParamId(key);
                dcxStore.updateEqualizerParam(group, channelId, band, paramId, value);
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

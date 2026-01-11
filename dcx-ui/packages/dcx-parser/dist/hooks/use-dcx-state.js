/**
 * Hook for real-time device state synchronization.
 *
 * Provides:
 * - Current device state
 * - Real-time updates from device
 * - High-level setters for parameter changes
 */
import {useState, useCallback, useRef, useEffect} from 'react';
import {parseMessage} from '../protocol/sysex.js';
import {parseEditBuffer} from '../model/state-parser.js';
import {
  buildEditBufferRequest,
  buildParameterChangeCommand,
} from '../commands/builders.js';
import {
  applyToState,
  directLookup,
  convertValue,
} from '../model/param-lookup.js';
/**
 * Hook for real-time device state.
 */
export function useDcxState(connection) {
  const [state, setState] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const unsubscribeRef = useRef(null);
  const part0Ref = useRef(null);
  const part1Ref = useRef(null);
  /**
   * Fetch current state from device.
   */
  const sync = useCallback(async () => {
    if (!connection) {
      setError('No connection');
      return;
    }

    setIsLoading(true);
    setError(null);
    part0Ref.current = null;
    part1Ref.current = null;
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
   */
  useEffect(() => {
    if (!connection) return;
    unsubscribeRef.current = connection.onMessage((data) => {
      const message = parseMessage(data);
      if (!message) return;
      // Handle edit buffer responses
      if (message.type === 'pageDump') {
        if (message.page === 0) {
          part0Ref.current = message.data;
        } else if (message.page === 1) {
          part1Ref.current = message.data;
        }

        // If both parts received, parse state
        if (part0Ref.current && part1Ref.current) {
          const newState = parseEditBuffer(part0Ref.current, part1Ref.current);
          setState(newState);
          setIsLoading(false);
        }
      }

      // Handle direct parameter updates (real-time changes)
      if (message.type === 'direct' && state) {
        const newState = {...state};
        for (const {channel, param, value} of message.parameters) {
          const key = `${channel}:${param}`;
          const def = directLookup.get(key);
          if (def) {
            const typedValue = convertValue(def, value);
            applyToState(newState, def, typedValue);
          }
        }

        setState(newState);
      }
    });
    return () => {
      unsubscribeRef.current?.();
      unsubscribeRef.current = null;
    };
  }, [connection, state]);
  /**
   * Set a setup parameter.
   */
  const setSetup = useCallback(
    async (key, value) => {
      if (!connection) return;
      const target = {kind: 'setup', key};
      const cmd = buildParameterChangeCommand(target, value);
      if (cmd) {
        await connection.send(cmd);
        // Optimistic update
        if (state) {
          setState({
            ...state,
            setup: {...state.setup, [key]: value},
          });
        }
      }
    },
    [connection, state],
  );
  /**
   * Set a channel parameter.
   */
  const setChannel = useCallback(
    async (group, id, key, value) => {
      if (!connection) return;
      const target = {kind: 'channel', group, id, key};
      const cmd = buildParameterChangeCommand(target, value);
      if (cmd) {
        await connection.send(cmd);
        // Optimistic update
        if (state) {
          const channels = {...state[group]};
          channels[id] = {...channels[id], [key]: value};
          setState({...state, [group]: channels});
        }
      }
    },
    [connection, state],
  );
  /**
   * Set an equalizer parameter.
   */
  const setEqualizer = useCallback(
    async (group, channelId, band, key, value) => {
      if (!connection) return;
      const target = {
        kind: 'equalizer',
        group,
        channelId,
        band,
        key,
      };
      const cmd = buildParameterChangeCommand(target, value);
      if (cmd) {
        await connection.send(cmd);
        // Optimistic update
        if (state) {
          const channels = {...state[group]};
          const channel = {...channels[channelId]};
          const equalizers = {...channel.equalizers};
          equalizers[String(band)] = {
            ...equalizers[String(band)],
            [key]: value,
          };
          channel.equalizers = equalizers;
          channels[channelId] = channel;
          setState({...state, [group]: channels});
        }
      }
    },
    [connection, state],
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
// # sourceMappingURL=use-dcx-state.js.map

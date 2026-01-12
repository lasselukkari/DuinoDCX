/**
 * Hook for device polling (ping/search) with multi-client coordination.
 *
 * Uses timeout-based self-coordination:
 * - Sends ping if no ping response seen in 1 second
 * - Sends search periodically until device found, then stops
 * - If no ping response for 5 seconds, restarts search (device lost)
 * - All clients see all responses, so they naturally coordinate
 */

import {useEffect, useRef, useCallback} from 'react';
import {
  type DcxConnection,
  parseMessage,
  buildPingCommand,
  buildSearchCommand,
  buildListenModeCommand,
} from 'dcx-parser';

const PING_TIMEOUT = 1000; // Send ping if no response in 1s
const DEVICE_LOST_TIMEOUT = 5000; // Restart search if no ping for 5s

/**
 * Hook for timeout-based ping/search coordination.
 *
 * @param connection - The DcxConnection instance
 * @param hasDevice - Whether at least one device has been discovered
 * @param deviceId - The device ID to ping
 * @param onDeviceFound - Callback when device is first discovered (for triggering sync)
 */
export function useDevicePolling(
  connection: DcxConnection | undefined,
  hasDevice: boolean,
  deviceId: number,
  onDeviceFound?: (deviceId: number) => void,
): void {
  // Initialize to past time so first check immediately sends commands
  const lastPingResponse = useRef<number>(0);
  const isSearchingRef = useRef(!hasDevice);
  const listenModeEnabledRef = useRef(false);

  // Update timestamp when we receive ping response
  const handleMessage = useCallback(
    (data: Uint8Array) => {
      const message = parseMessage(data);
      if (!message) return;

      // Ping response is type 'status' (command 0x04)
      if (message.type === 'status') {
        lastPingResponse.current = Date.now();
        isSearchingRef.current = false; // Device is responding, stop searching
      }

      // Search response also means device found
      if (message.type === 'search') {
        isSearchingRef.current = false;
        // Don't reset lastPingResponse here - let the ping trigger immediately

        // Enable listen mode once when device found, then immediately ping
        if (!listenModeEnabledRef.current && connection) {
          console.log('[useDevicePolling] Device found, enabling listen mode and pinging');
          void connection.send(buildListenModeCommand());
          // Immediately send ping to get status data (for navbar)
          void connection.send(buildPingCommand(message.deviceId));
          listenModeEnabledRef.current = true;

          // Notify caller that device was found (for triggering sync)
          onDeviceFound?.(message.deviceId);
        }
      }
    },
    [connection, onDeviceFound],
  );

  // Update searching state when hasDevice changes
  useEffect(() => {
    if (!hasDevice) {
      isSearchingRef.current = true;
    }
  }, [hasDevice]);

  useEffect(() => {
    if (!connection) return;

    // Subscribe to messages to track responses
    const unsubscribe = connection.onMessage(handleMessage);

    // Main polling interval - runs every 250ms
    // First iteration will immediately send search/ping since lastPingResponse is 0
    const pollInterval = globalThis.setInterval(() => {
      const timeSinceLastResponse = Date.now() - lastPingResponse.current;

      if (isSearchingRef.current) {
        // In search mode - send search commands
        console.log('[useDevicePolling] Sending search command');
        void connection.send(buildSearchCommand());
      } else if (timeSinceLastResponse > DEVICE_LOST_TIMEOUT) {
        // Device lost - restart search
        console.log('[useDevicePolling] Device lost, restarting search');
        isSearchingRef.current = true;
        void connection.send(buildSearchCommand());
      } else if (timeSinceLastResponse > PING_TIMEOUT) {
        // Send ping to keep connection alive
        console.log(`[useDevicePolling] Sending ping to device ${deviceId}`);
        void connection.send(buildPingCommand(deviceId));
      }
    }, 250); // Check 4x per second

    return () => {
      unsubscribe();
      clearInterval(pollInterval);
    };
    // Only re-run when connection or deviceId changes, NOT when searching state changes
  }, [connection, deviceId, handleMessage]);
}

/**
 * Trigger a device search manually.
 * Use this for the "Rescan Devices" button.
 */
export async function triggerSearch(connection: DcxConnection): Promise<void> {
  await connection.send(buildSearchCommand());
}

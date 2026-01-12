/**
 * SSE-based implementation of DcxConnection for dcx-ui.
 *
 * This adapter bridges the dcx-parser library's transport-agnostic
 * DcxConnection interface with the dcx-ui's SSE (Server-Sent Events)
 * architecture.
 *
 * The backend streams raw serial bytes, which are accumulated here
 * into complete SysEx messages before being dispatched to listeners.
 */

import type {DcxConnection} from 'dcx-parser';
import {createByteAccumulator} from './byteAccumulator.js';

/** Hex string to Uint8Array */
function hexToBytes(hex: string): Uint8Array {
  const cleanHex = hex.replaceAll(/[:\s]/g, '');
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = Number.parseInt(cleanHex.slice(i * 2, i * 2 + 2), 16);
  }

  return bytes;
}

export type SseConnectionOptions = {
  /** Base URL for API endpoints (default: '') */
  baseUrl?: string;
  /** Client ID for SSE connection */
  clientId: string;
};

/**
 * Creates a DcxConnection that uses SSE for receiving messages
 * and HTTP POST for sending messages.
 */
export function createSseConnection(
  options: SseConnectionOptions,
): DcxConnection & {
  /** Connect to the SSE endpoint */
  connect: () => void;
  /** Disconnect from the SSE endpoint */
  disconnect: () => void;
  /** Check if connected */
  isConnected: () => boolean;
} {
  const {baseUrl = ''} = options;
  let eventSource: EventSource | undefined;
  const listeners = new Set<(data: Uint8Array) => void>();

  // Byte accumulator dispatches complete messages to listeners
  const accumulator = createByteAccumulator((message: Uint8Array) => {
    for (const listener of listeners) {
      try {
        listener(message);
      } catch (error) {
        console.error('[SseConnection] Listener error:', error);
      }
    }
  });

  function connect() {
    if (eventSource) return;

    const url = `${baseUrl}/api/events`;
    console.log('[SseConnection] Connecting to:', url);
    eventSource = new EventSource(url);

    eventSource.addEventListener('open', () => {
      console.log('[SseConnection] Connected');
      accumulator.reset(); // Clear any stale buffer on reconnect
    });

    eventSource.addEventListener('message', (event: MessageEvent) => {
      const rawData = event.data as string | undefined;
      if (!rawData || typeof rawData !== 'string') return;

      try {
        const bytes = hexToBytes(rawData);
        accumulator.feed(bytes); // Accumulate and dispatch complete messages
      } catch (error) {
        console.error('[SseConnection] Parse error:', error);
      }
    });

    eventSource.addEventListener('error', (error) => {
      console.error('[SseConnection] Error:', error);
    });
  }

  function disconnect() {
    if (eventSource) {
      console.log('[SseConnection] Disconnecting');
      eventSource.close();
      eventSource = undefined;
    }
  }

  function isConnected() {
    return eventSource?.readyState === EventSource.OPEN;
  }

  const connection: DcxConnection & {
    connect: () => void;
    disconnect: () => void;
    isConnected: () => boolean;
  } = {
    async send(data: Uint8Array): Promise<void> {
      const blob = new Blob([new Uint8Array(data)]);
      const response = await fetch(`${baseUrl}/api/commands`, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {'Content-Type': 'application/binary'},
        body: blob,
      });

      if (!response.ok) {
        throw new Error(`Send failed: ${response.status}`);
      }
    },

    onMessage(callback: (data: Uint8Array) => void): () => void {
      listeners.add(callback);
      return () => {
        listeners.delete(callback);
      };
    },

    connect,
    disconnect,
    isConnected,
  };

  return connection;
}

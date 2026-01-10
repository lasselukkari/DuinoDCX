/**
 * SSE-based implementation of DcxConnection for dcx-ui.
 *
 * This adapter bridges the dcx-parser library's transport-agnostic
 * DcxConnection interface with the dcx-ui's SSE (Server-Sent Events)
 * architecture.
 */

import type { DcxConnection } from 'dcx-parser';

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
  const { baseUrl = '', clientId } = options;
  let eventSource: EventSource | undefined = undefined;
  const listeners = new Set<(data: Uint8Array) => void>();

  function connect() {
    if (eventSource) return;

    const url = `${baseUrl}/api/events?clientId=${clientId}`;
    console.log('[SseConnection] Connecting to:', url);
    eventSource = new EventSource(url);

    eventSource.addEventListener('open', () => {
      console.log('[SseConnection] Connected');
    });

    eventSource.addEventListener('message', (event: MessageEvent) => {
      const rawData = event.data as string | undefined;
      if (!rawData || typeof rawData !== 'string') return;

      try {
        const bytes = hexToBytes(rawData);

        for (const listener of listeners) {
          try {
            listener(bytes);
          } catch (error) {
            console.error('[SseConnection] Listener error:', error);
          }
        }
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
    return eventSource !== undefined && eventSource.readyState === EventSource.OPEN;
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
        headers: { 'Content-Type': 'application/binary' },
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

/**
 * WebSocket-based implementation of DcxConnection for dcx-ui.
 *
 * This adapter bridges the dcx-parser library's transport-agnostic
 * DcxConnection interface with WebSocket for bidirectional communication.
 *
 * Binary messages are used for efficiency - no hex encoding needed.
 */

import type {DcxConnection} from 'dcx-parser';
import {createByteAccumulator} from './byteAccumulator.js';

export type WsConnectionOptions = {
  /** Base URL for WebSocket endpoint (default: '') */
  baseUrl?: string;
  /** Reconnection delay in ms (default: 1000) */
  reconnectDelay?: number;
};

/**
 * Creates a DcxConnection that uses WebSocket for bidirectional communication.
 */
export function createWsConnection(
  options: WsConnectionOptions = {},
): DcxConnection & {
  /** Connect to the WebSocket endpoint */
  connect: () => void;
  /** Disconnect from the WebSocket endpoint */
  disconnect: () => void;
  /** Check if connected */
  isConnected: () => boolean;
} {
  const {baseUrl = '', reconnectDelay = 1000} = options;
  let socket: WebSocket | undefined;
  let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
  const listeners = new Set<(data: Uint8Array) => void>();

  // Byte accumulator dispatches complete SysEx messages to listeners
  const accumulator = createByteAccumulator((message: Uint8Array) => {
    for (const listener of listeners) {
      try {
        listener(message);
      } catch (error) {
        console.error('[WsConnection] Listener error:', error);
      }
    }
  });

  function getWsUrl(): string {
    // Convert http(s) to ws(s)
    const base = baseUrl || globalThis.location.origin;
    const wsProtocol = base.startsWith('https') ? 'wss' : 'ws';
    const host = base.replace(/^https?:\/\//, '');
    return `${wsProtocol}://${host}/api/ws`;
  }

  function connect() {
    if (
      socket?.readyState === WebSocket.OPEN ||
      socket?.readyState === WebSocket.CONNECTING
    ) {
      return;
    }

    const url = getWsUrl();
    console.log('[WsConnection] Connecting to:', url);
    socket = new WebSocket(url);
    socket.binaryType = 'arraybuffer';

    socket.addEventListener('open', () => {
      console.log('[WsConnection] Connected');
      accumulator.reset(); // Clear any stale buffer on reconnect
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = undefined;
      }
    });

    socket.addEventListener('message', (event: MessageEvent) => {
      if (event.data instanceof ArrayBuffer) {
        const bytes = new Uint8Array(event.data);
        accumulator.feed(bytes);
      }
    });

    socket.addEventListener('close', () => {
      console.log('[WsConnection] Disconnected');
      socket = undefined;
      // Auto-reconnect
      reconnectTimer ||= setTimeout(() => {
        reconnectTimer = undefined;
        connect();
      }, reconnectDelay);
    });

    socket.addEventListener('error', (error) => {
      console.error('[WsConnection] Error:', error);
    });
  }

  function disconnect() {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = undefined;
    }

    if (socket) {
      console.log('[WsConnection] Disconnecting');
      socket.close();
      socket = undefined;
    }
  }

  function isConnected() {
    return socket?.readyState === WebSocket.OPEN;
  }

  const connection: DcxConnection & {
    connect: () => void;
    disconnect: () => void;
    isConnected: () => boolean;
  } = {
    async send(data: Uint8Array): Promise<void> {
      if (socket?.readyState !== WebSocket.OPEN) {
        throw new Error('WebSocket not connected');
      }

      socket.send(data);
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

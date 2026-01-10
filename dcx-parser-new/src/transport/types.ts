/**
 * Transport layer types for DCX2496 communication.
 *
 * The DcxConnection interface provides a transport-agnostic way to
 * communicate with the device. Implementations can use:
 * - Web Serial API (direct USB connection)
 * - WebSocket (via server proxy)
 * - SSE + HTTP (like current dcx-ui)
 */

/**
 * Bidirectional connection to a DCX2496 device.
 */
export type DcxConnection = {
  /**
   * Send a SysEx message to the device.
   */
  send(data: Uint8Array): Promise<void>;

  /**
   * Register a callback for incoming messages.
   * Returns an unsubscribe function.
   */
  onMessage(callback: (data: Uint8Array) => void): () => void;

  /**
   * Close the connection (optional).
   */
  close?(): Promise<void>;
};

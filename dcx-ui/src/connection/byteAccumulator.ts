/**
 * Byte accumulator for raw serial data from SSE.
 *
 * Accumulates incoming bytes and extracts complete SysEx messages
 * using the dcx-parser's extractSysexMessages function.
 */

import {extractSysexMessages} from 'dcx-parser';

export type ByteAccumulator = {
  /** Feed raw bytes from SSE */
  feed: (bytes: Uint8Array) => void;
  /** Reset the accumulator buffer */
  reset: () => void;
};

/**
 * Create a byte accumulator that extracts complete SysEx messages.
 *
 * @param onMessage - Callback for each complete SysEx message
 */
export function createByteAccumulator(
  onMessage: (message: Uint8Array) => void,
): ByteAccumulator {
  let buffer = new Uint8Array(0);

  return {
    feed(bytes: Uint8Array): void {
      // Append incoming bytes to buffer
      const newBuffer = new Uint8Array(buffer.length + bytes.length);
      newBuffer.set(buffer);
      newBuffer.set(bytes, buffer.length);
      buffer = newBuffer;

      // Extract complete SysEx messages
      const {messages, remaining} = extractSysexMessages(buffer);
      buffer = new Uint8Array(remaining);

      // Dispatch complete messages
      for (const message of messages) {
        onMessage(message);
      }
    },

    reset(): void {
      buffer = new Uint8Array(0);
    },
  };
}

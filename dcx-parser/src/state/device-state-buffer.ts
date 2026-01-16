import {parseEditBuffer} from '../edit-buffer-parser.js';
import type {State} from '../types/index.js';

export const PAGE_SIZE = 875; // Size of Part 0 (also used for page splitting)

/**
 * DeviceStateBuffer - Binary source of truth for device edit buffer.
 * 
 * Stores the combined 8-bit buffer (1659 bytes = 875 + 784).
 * State is derived lazily and cached until buffer changes.
 */
export class DeviceStateBuffer {
  // Raw 8-bit buffer (source of truth)
  private data: Uint8Array;
  
  // Cached derived state
  private cachedState: State | undefined;
  private isDirty = true;

  /**
   * Create buffer from combined data
   */
  constructor(data: Uint8Array) {
    // Store COPY to prevent external mutation
    this.data = new Uint8Array(data);
  }
  
  /**
   * Factory: Create from two parts (as received from device)
   */
  static fromParts(part0: Uint8Array, part1: Uint8Array): DeviceStateBuffer {
    const combined = new Uint8Array(part0.length + part1.length);
    combined.set(part0);
    combined.set(part1, part0.length);
    return new DeviceStateBuffer(combined);
  }
  
  /**
   * Get derived State object (cached until buffer is modified)
   */
  getState(): State {
    if (this.isDirty || !this.cachedState) {
      this.cachedState = parseEditBuffer(this.data);
      this.isDirty = false;
    }
    return this.cachedState;
  }
  
  /**
   * Get raw buffer data
   */
  getData(): Uint8Array {
    return this.data;
  }
  
  /**
   * Get Part 0 (first 875 bytes)
   */
  getPart0(): Uint8Array {
    return this.data.subarray(0, PAGE_SIZE);
  }
  
  /**
   * Get Part 1 (remaining bytes after 875)
   */
  getPart1(): Uint8Array {
    return this.data.subarray(PAGE_SIZE);
  }
  
  /**
   * Update a 16-bit word at the given offset (little-endian)
   */
  updateWord(offset: number, value: number): void {
    this.data[offset] = value & 0xFF;
    this.data[offset + 1] = (value >> 8) & 0xFF;
    this.isDirty = true;
  }
  
  /**
   * Update a UTF-16LE string at the given offset
   * @param offset - Byte offset in buffer
   * @param value - String value (will be padded/truncated to maxChars)
   * @param maxChars - Maximum number of characters (each char = 2 bytes)
   */
  updateString(offset: number, value: string, maxChars: number): void {
    // Pad or truncate to maxChars
    const padded = value.padEnd(maxChars, ' ').substring(0, maxChars);
    
    // Write as UTF-16LE
    for (let i = 0; i < padded.length; i++) {
      const charCode = padded.charCodeAt(i);
      this.data[offset + i * 2] = charCode & 0xFF;        // Low byte
      this.data[offset + i * 2 + 1] = (charCode >> 8) & 0xFF;  // High byte
    }
    
    this.isDirty = true;
  }
}

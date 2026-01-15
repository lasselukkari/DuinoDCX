/**
 * Edit Buffer Session State Machine.
 *
 * Event-driven state machine for fetching device edit buffer.
 * Follows the same pattern as BackupSession:
 * 1. start() - queues part 0 request, transitions to DOWNLOADING state
 * 2. processResponse() - reacts to editBuffer messages, queues next part request
 * 3. getNextMessage() - returns next message to send (non-blocking)
 */

import type {ParsedMessage} from '../protocol/sysex.js';
import {buildEditBufferRequest} from '../commands/builders.js';
import {DeviceStateBuffer} from '../state/device-state-buffer.js';
import type {State} from '../types/index.js';

const TOTAL_PARTS = 2;

/**
 * Edit Buffer Phases
 */
export enum EditBufferPhase {
  IDLE,
  DOWNLOADING,
  COMPLETED,
  ERROR,
}

/**
 * Manages the state of an edit buffer fetch session.
 *
 * Implements a reactive Pull-based protocol:
 * 1. start() - send part 0 request
 * 2. On part 0 response - send part 1 request
 * 3. On part 1 response - parse and complete
 */
export class EditBufferSession {
  private phase: EditBufferPhase = EditBufferPhase.IDLE;
  private readonly messageQueue: Uint8Array[] = [];
  private readonly parts = new Map<number, Uint8Array>();
  private nextPartToRequest = 0;
  private buffer: DeviceStateBuffer | undefined = undefined;
  private errorMessage: string | undefined = undefined;

  /**
   * Start the edit buffer fetch process.
   * Queues only the first part request.
   */
  public start(): void {
    if (this.phase !== EditBufferPhase.IDLE) {
      return; // Already started
    }

    console.log('[EditBufferSession] Starting, requesting part 0');
    this.phase = EditBufferPhase.DOWNLOADING;
    this.parts.clear();
    this.nextPartToRequest = 0;
    this.buffer = undefined;
    this.errorMessage = undefined;

    // Queue only the first part request
    this.queuePartRequest(0);
    this.nextPartToRequest = 1;
  }

  /**
   * Reset to idle state.
   */
  public reset(): void {
    this.phase = EditBufferPhase.IDLE;
    this.parts.clear();
    this.nextPartToRequest = 0;
    this.buffer = undefined;
    this.errorMessage = undefined;
    this.messageQueue.length = 0;
  }

  /**
   * Get the next message to send to the device.
   * Returns undefined if no messages are pending.
   */
  public getNextMessage(): Uint8Array | undefined {
    if (
      this.phase === EditBufferPhase.ERROR ||
      this.phase === EditBufferPhase.COMPLETED ||
      this.phase === EditBufferPhase.IDLE
    ) {
      return undefined;
    }

    return this.messageQueue.shift() ?? undefined;
  }

  /**
   * Process a message received from the device.
   * Reacts to editBuffer messages by queuing the next part request.
   */
  public processResponse(message: ParsedMessage): void {
    if (this.phase !== EditBufferPhase.DOWNLOADING) {
      return;
    }

    // Handle edit buffer responses
    if (message.type === 'editBuffer') {
      const {part, data} = message;
      console.log(`[EditBufferSession] Received part ${part}, size: ${data.length}`);

      // Store the part data
      this.parts.set(part, data);

      // Check if all parts received
      if (this.parts.size === TOTAL_PARTS) {
        this.assembleAndComplete();
      } else if (this.nextPartToRequest < TOTAL_PARTS) {
        // Queue the next part request
        console.log(`[EditBufferSession] Requesting part ${this.nextPartToRequest}`);
        this.queuePartRequest(this.nextPartToRequest);
        this.nextPartToRequest++;
      }
    }
  }

  /**
   * Get the current status.
   */
  public getStatus(): {
    phase: string;
    progress: number;
    queueLength: number;
  } {
    return {
      phase: EditBufferPhase[this.phase],
      progress: this.parts.size / TOTAL_PARTS,
      queueLength: this.messageQueue.length,
    };
  }

  /**
   * Check if download is complete.
   */
  public isComplete(): boolean {
    return this.phase === EditBufferPhase.COMPLETED;
  }

  /**
   * Check if there was an error.
   */
  public isError(): boolean {
    return this.phase === EditBufferPhase.ERROR;
  }

  /**
   * Get the binary buffer (only available after completion).
   */
  public getBuffer(): DeviceStateBuffer | undefined {
    return this.buffer;
  }

  /**
   * Get the parsed state (only available after completion).
   * Delegates to buffer's getState() method.
   */
  public getState(): State | undefined {
    return this.buffer?.getState();
  }

  /**
   * Get the error message (only available after error).
   */
  public getError(): string | undefined {
    return this.errorMessage;
  }

  /**
   * Get the current phase.
   */
  public getPhase(): EditBufferPhase {
    return this.phase;
  }

  private queuePartRequest(part: number): void {
    const request = buildEditBufferRequest(part as 0 | 1);
    this.messageQueue.push(request);
  }

  private assembleAndComplete(): void {
    try {
      console.log('[EditBufferSession] Both parts received, creating buffer');
      // Get parts in order
      const part0 = this.parts.get(0);
      const part1 = this.parts.get(1);

      if (!part0 || !part1) {
        throw new Error('Missing edit buffer parts');
      }

      // Create DeviceStateBuffer from parts (binary as source of truth)
      this.buffer = DeviceStateBuffer.fromParts(part0, part1);
      this.phase = EditBufferPhase.COMPLETED;
      console.log('[EditBufferSession] Buffer created successfully');
    } catch (error) {
      this.errorMessage = String(error);
      this.phase = EditBufferPhase.ERROR;
      console.error('[EditBufferSession] Error:', this.errorMessage);
    }
  }
}

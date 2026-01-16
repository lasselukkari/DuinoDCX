/**
 * Edit Buffer Session State Machine.
 *
 * Event-driven state machine for fetching device edit buffer.
 * Follows the same pattern as BackupSession:
 * 1. start() - queues part 0 request, transitions to DOWNLOADING state
 * 2. processResponse() - reacts to editBuffer messages, queues next part request
 * 3. getNextMessage() - returns next message to send (non-blocking)
 */
import type { ParsedMessage } from '../protocol/sysex.js';
import type { State } from '../types/index.js';
/**
 * Edit Buffer Phases
 */
export declare enum EditBufferPhase {
    IDLE = 0,
    DOWNLOADING = 1,
    COMPLETED = 2,
    ERROR = 3
}
/**
 * Manages the state of an edit buffer fetch session.
 *
 * Implements a reactive Pull-based protocol:
 * 1. start() - send part 0 request
 * 2. On part 0 response - send part 1 request
 * 3. On part 1 response - parse and complete
 */
export declare class EditBufferSession {
    private phase;
    private readonly messageQueue;
    private readonly parts;
    private nextPartToRequest;
    private state;
    private errorMessage;
    /**
     * Start the edit buffer fetch process.
     * Queues only the first part request.
     */
    start(): void;
    /**
     * Reset to idle state.
     */
    reset(): void;
    /**
     * Get the next message to send to the device.
     * Returns undefined if no messages are pending.
     */
    getNextMessage(): Uint8Array | undefined;
    /**
     * Process a message received from the device.
     * Reacts to editBuffer messages by queuing the next part request.
     */
    processResponse(message: ParsedMessage): void;
    /**
     * Get the current status.
     */
    getStatus(): {
        phase: string;
        progress: number;
        queueLength: number;
    };
    /**
     * Check if download is complete.
     */
    isComplete(): boolean;
    /**
     * Check if there was an error.
     */
    isError(): boolean;
    /**
     * Get the parsed state (only available after completion).
     */
    getState(): State | undefined;
    /**
     * Get the error message (only available after error).
     */
    getError(): string | undefined;
    /**
     * Get the current phase.
     */
    getPhase(): EditBufferPhase;
    private queuePartRequest;
    private assembleAndComplete;
}
//# sourceMappingURL=edit-buffer.d.ts.map
/**
 * Backup Session State Machine.
 *
 * Event-driven state machine for downloading device presets.
 * Follows the same pattern as RestoreSession:
 * 1. start() - queues page 0 request, transitions to DOWNLOADING state
 * 2. processResponse() - reacts to pageDump messages, queues next page request
 * 3. getNextMessage() - returns next message to send (non-blocking)
 */
import type { ParsedMessage } from '../protocol/sysex.js';
/**
 * Backup Phases
 */
export declare enum BackupPhase {
    IDLE = 0,
    DOWNLOADING = 1,
    COMPLETED = 2,
    ERROR = 3
}
/**
 * Manages the state of a DCX2496 backup session.
 *
 * Implements a reactive Pull-based protocol:
 * 1. start() - send page 0 request
 * 2. On page 0 response - send page 1 request
 * 3. On page 1 response - send page 2 request
 * ... until all 12 pages received
 */
export declare class BackupSession {
    private phase;
    private readonly messageQueue;
    private readonly pages;
    private nextPageToRequest;
    private dcxData;
    private errorMessage;
    /**
     * Start the backup process.
     * Queues only the first page request.
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
     * Reacts to pageDump messages by queuing the next page request.
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
     * Check if backup is complete.
     */
    isComplete(): boolean;
    /**
     * Check if there was an error.
     */
    isError(): boolean;
    /**
     * Get the assembled DCX data (only available after completion).
     */
    getDcxData(): Uint8Array | undefined;
    /**
     * Get the error message (only available after error).
     */
    getError(): string | undefined;
    /**
     * Get the current phase.
     */
    getPhase(): BackupPhase;
    private queuePageRequest;
    private assembleAndComplete;
}
//# sourceMappingURL=backup.d.ts.map
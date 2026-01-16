/**
 * Search Session State Machine.
 *
 * Event-driven state machine for discovering DCX2496 devices on the bus.
 * Follows the same pattern as other sessions:
 * 1. start() - queues search broadcast, transitions to SEARCHING state
 * 2. processResponse() - collects device IDs from search responses
 * 3. getNextMessage() - returns next message to send (non-blocking)
 * 4. isComplete() - true when timeout expires (all devices should have responded)
 */
import type { ParsedMessage } from '../protocol/sysex.js';
/**
 * Search Phases
 */
export declare enum SearchPhase {
    IDLE = 0,
    SEARCHING = 1,
    COMPLETED = 2,
    ERROR = 3
}
/**
 * Manages the state of a device search session.
 *
 * Broadcasts a search command and collects responding device IDs.
 * Completes after a configured timeout (devices may respond at different times).
 */
export declare class SearchSession {
    private phase;
    private readonly messageQueue;
    private readonly deviceIds;
    private startTime;
    private readonly timeoutMs;
    private errorMessage;
    constructor(timeoutMs?: number);
    /**
     * Start the search process.
     * Queues the broadcast search command.
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
     * Collects device IDs from search responses.
     */
    processResponse(message: ParsedMessage): void;
    /**
     * Check for timeout - call this from tick loop.
     * Returns true if search should complete.
     */
    tick(now: number): void;
    /**
     * Get the current status.
     */
    getStatus(): {
        phase: string;
        deviceCount: number;
        queueLength: number;
    };
    /**
     * Check if search is complete.
     */
    isComplete(): boolean;
    /**
     * Check if there was an error.
     */
    isError(): boolean;
    /**
     * Get the discovered device IDs (only available after completion).
     */
    getDeviceIds(): number[];
    /**
     * Get the error message (only available after error).
     */
    getError(): string | undefined;
    /**
     * Get the current phase.
     */
    getPhase(): SearchPhase;
}
//# sourceMappingURL=search.d.ts.map
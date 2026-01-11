import { type ParsedMessage } from '../protocol/sysex.js';
/**
 * Protocol Phases
 */
export declare enum RestorePhase {
    IDLE = 0,
    INITIALIZING = 1,// Sending ID + Listen Mode
    MAIN_MEMORY = 2,// Transferring Pages 0-11 (Type 00)
    CURRENT_STATE = 3,// Transferring Pages 0-1 (Type 01)
    COMPLETED = 4,
    ERROR = 5
}
/**
 * Manages the state of a DCX2496 restore session.
 *
 * Implements the Pull-Based Protocol:
 * 1. Initialize (CMD_40, CMD_3F)
 * 2. Phase 1: Send Page 0 (unsolicited), wait for requests 1-11
 * 3. Phase 2: Send Page 0 (Type 01, unsolicited), wait for request 1
 */
export declare class RestoreSession {
    private readonly pages;
    private phase;
    private readonly messageQueue;
    private readonly deviceId;
    constructor(fileBuffer: Uint8Array, deviceId?: number);
    /**
     * Start the restore process.
     * Queues the initial commands and the first page.
     */
    start(): void;
    /**
     * Get the next message to send to the device.
     * Returns undefined if no messages are pending (waiting for device request).
     */
    getNextMessage(): Uint8Array | undefined;
    /**
     * Process a message received from the device.
     * Expects 'pageRequest' messages to drive the transfer.
     */
    processResponse(message: ParsedMessage): void;
    getStatus(): {
        phase: string;
        queueLength: number;
    };
    isComplete(): boolean;
    private handleMainPageRequest;
    private handleCurrentStateRequest;
    private queuePage;
    private transitionToError;
}
//# sourceMappingURL=restore.d.ts.map
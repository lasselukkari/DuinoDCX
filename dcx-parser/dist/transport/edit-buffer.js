/**
 * Edit Buffer Session State Machine.
 *
 * Event-driven state machine for fetching device edit buffer.
 * Follows the same pattern as BackupSession:
 * 1. start() - queues part 0 request, transitions to DOWNLOADING state
 * 2. processResponse() - reacts to editBuffer messages, queues next part request
 * 3. getNextMessage() - returns next message to send (non-blocking)
 */
import { buildEditBufferRequest } from '../commands/builders.js';
import { parseEditBuffer } from '../edit-buffer-parser.js';
const TOTAL_PARTS = 2;
/**
 * Edit Buffer Phases
 */
export var EditBufferPhase;
(function (EditBufferPhase) {
    EditBufferPhase[EditBufferPhase["IDLE"] = 0] = "IDLE";
    EditBufferPhase[EditBufferPhase["DOWNLOADING"] = 1] = "DOWNLOADING";
    EditBufferPhase[EditBufferPhase["COMPLETED"] = 2] = "COMPLETED";
    EditBufferPhase[EditBufferPhase["ERROR"] = 3] = "ERROR";
})(EditBufferPhase || (EditBufferPhase = {}));
/**
 * Manages the state of an edit buffer fetch session.
 *
 * Implements a reactive Pull-based protocol:
 * 1. start() - send part 0 request
 * 2. On part 0 response - send part 1 request
 * 3. On part 1 response - parse and complete
 */
export class EditBufferSession {
    phase = EditBufferPhase.IDLE;
    messageQueue = [];
    parts = new Map();
    nextPartToRequest = 0;
    state = undefined;
    errorMessage = undefined;
    /**
     * Start the edit buffer fetch process.
     * Queues only the first part request.
     */
    start() {
        if (this.phase !== EditBufferPhase.IDLE) {
            return; // Already started
        }
        console.log('[EditBufferSession] Starting, requesting part 0');
        this.phase = EditBufferPhase.DOWNLOADING;
        this.parts.clear();
        this.nextPartToRequest = 0;
        this.state = undefined;
        this.errorMessage = undefined;
        // Queue only the first part request
        this.queuePartRequest(0);
        this.nextPartToRequest = 1;
    }
    /**
     * Reset to idle state.
     */
    reset() {
        this.phase = EditBufferPhase.IDLE;
        this.parts.clear();
        this.nextPartToRequest = 0;
        this.state = undefined;
        this.errorMessage = undefined;
        this.messageQueue.length = 0;
    }
    /**
     * Get the next message to send to the device.
     * Returns undefined if no messages are pending.
     */
    getNextMessage() {
        if (this.phase === EditBufferPhase.ERROR ||
            this.phase === EditBufferPhase.COMPLETED ||
            this.phase === EditBufferPhase.IDLE) {
            return undefined;
        }
        return this.messageQueue.shift() ?? undefined;
    }
    /**
     * Process a message received from the device.
     * Reacts to editBuffer messages by queuing the next part request.
     */
    processResponse(message) {
        if (this.phase !== EditBufferPhase.DOWNLOADING) {
            return;
        }
        // Handle edit buffer responses
        if (message.type === 'editBuffer') {
            const { part, data } = message;
            console.log(`[EditBufferSession] Received part ${part}, size: ${data.length}`);
            // Store the part data
            this.parts.set(part, data);
            // Check if all parts received
            if (this.parts.size === TOTAL_PARTS) {
                this.assembleAndComplete();
            }
            else if (this.nextPartToRequest < TOTAL_PARTS) {
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
    getStatus() {
        return {
            phase: EditBufferPhase[this.phase],
            progress: this.parts.size / TOTAL_PARTS,
            queueLength: this.messageQueue.length,
        };
    }
    /**
     * Check if download is complete.
     */
    isComplete() {
        return this.phase === EditBufferPhase.COMPLETED;
    }
    /**
     * Check if there was an error.
     */
    isError() {
        return this.phase === EditBufferPhase.ERROR;
    }
    /**
     * Get the parsed state (only available after completion).
     */
    getState() {
        return this.state;
    }
    /**
     * Get the error message (only available after error).
     */
    getError() {
        return this.errorMessage;
    }
    /**
     * Get the current phase.
     */
    getPhase() {
        return this.phase;
    }
    queuePartRequest(part) {
        const request = buildEditBufferRequest(part);
        this.messageQueue.push(request);
    }
    assembleAndComplete() {
        try {
            console.log('[EditBufferSession] Both parts received, parsing state');
            // Get parts in order
            const part0 = this.parts.get(0);
            const part1 = this.parts.get(1);
            if (!part0 || !part1) {
                throw new Error('Missing edit buffer parts');
            }
            // Concatenate parts
            const combined = new Uint8Array(part0.length + part1.length);
            combined.set(part0);
            combined.set(part1, part0.length);
            // Parse the combined data
            this.state = parseEditBuffer(combined);
            this.phase = EditBufferPhase.COMPLETED;
            console.log('[EditBufferSession] State parsed successfully');
        }
        catch (error) {
            this.errorMessage = String(error);
            this.phase = EditBufferPhase.ERROR;
            console.error('[EditBufferSession] Error:', this.errorMessage);
        }
    }
}
//# sourceMappingURL=edit-buffer.js.map
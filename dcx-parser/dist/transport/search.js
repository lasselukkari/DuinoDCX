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
import { buildSearchCommand } from '../commands/builders.js';
/**
 * Search Phases
 */
export var SearchPhase;
(function (SearchPhase) {
    SearchPhase[SearchPhase["IDLE"] = 0] = "IDLE";
    SearchPhase[SearchPhase["SEARCHING"] = 1] = "SEARCHING";
    SearchPhase[SearchPhase["COMPLETED"] = 2] = "COMPLETED";
    SearchPhase[SearchPhase["ERROR"] = 3] = "ERROR";
})(SearchPhase || (SearchPhase = {}));
/**
 * Manages the state of a device search session.
 *
 * Broadcasts a search command and collects responding device IDs.
 * Completes after a configured timeout (devices may respond at different times).
 */
export class SearchSession {
    phase = SearchPhase.IDLE;
    messageQueue = [];
    deviceIds = new Set();
    startTime = 0;
    timeoutMs;
    errorMessage = undefined;
    constructor(timeoutMs = 500) {
        this.timeoutMs = timeoutMs;
    }
    /**
     * Start the search process.
     * Queues the broadcast search command.
     */
    start() {
        if (this.phase !== SearchPhase.IDLE) {
            return; // Already started
        }
        console.log('[SearchSession] Starting device search');
        this.phase = SearchPhase.SEARCHING;
        this.deviceIds.clear();
        this.startTime = 0; // Will be set on first tick
        this.errorMessage = undefined;
        // Queue broadcast search command
        const searchCmd = buildSearchCommand();
        this.messageQueue.push(searchCmd);
    }
    /**
     * Reset to idle state.
     */
    reset() {
        this.phase = SearchPhase.IDLE;
        this.deviceIds.clear();
        this.startTime = 0;
        this.errorMessage = undefined;
        this.messageQueue.length = 0;
    }
    /**
     * Get the next message to send to the device.
     * Returns undefined if no messages are pending.
     */
    getNextMessage() {
        if (this.phase === SearchPhase.ERROR ||
            this.phase === SearchPhase.COMPLETED ||
            this.phase === SearchPhase.IDLE) {
            return undefined;
        }
        return this.messageQueue.shift() ?? undefined;
    }
    /**
     * Process a message received from the device.
     * Collects device IDs from search responses.
     */
    processResponse(message) {
        if (this.phase !== SearchPhase.SEARCHING) {
            return;
        }
        // Handle search response (contains device ID and name)
        if (message.type === 'search') {
            const deviceId = message.deviceId;
            if (!this.deviceIds.has(deviceId)) {
                console.log(`[SearchSession] Found device ID ${deviceId}: ${message.name}`);
                this.deviceIds.add(deviceId);
            }
        }
    }
    /**
     * Check for timeout - call this from tick loop.
     * Returns true if search should complete.
     */
    tick(now) {
        if (this.phase !== SearchPhase.SEARCHING) {
            return;
        }
        // Initialize startTime on first tick
        if (this.startTime === 0) {
            this.startTime = now;
        }
        if (now - this.startTime >= this.timeoutMs) {
            if (this.deviceIds.size > 0) {
                console.log(`[SearchSession] Search complete, found ${this.deviceIds.size} device(s)`);
                this.phase = SearchPhase.COMPLETED;
            }
            else {
                // No devices found - stay searching, will retry
                this.startTime = now;
                const searchCmd = buildSearchCommand();
                this.messageQueue.push(searchCmd);
            }
        }
    }
    /**
     * Get the current status.
     */
    getStatus() {
        return {
            phase: SearchPhase[this.phase],
            deviceCount: this.deviceIds.size,
            queueLength: this.messageQueue.length,
        };
    }
    /**
     * Check if search is complete.
     */
    isComplete() {
        return this.phase === SearchPhase.COMPLETED;
    }
    /**
     * Check if there was an error.
     */
    isError() {
        return this.phase === SearchPhase.ERROR;
    }
    /**
     * Get the discovered device IDs (only available after completion).
     */
    getDeviceIds() {
        return [...this.deviceIds];
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
}
//# sourceMappingURL=search.js.map
/**
 * Ping Session State Machine.
 *
 * Event-driven state machine for keep-alive pinging of a DCX2496 device.
 * Follows the same pattern as other sessions:
 * 1. start() - begins ping cycle
 * 2. processResponse() - handles status responses
 * 3. getNextMessage() - returns next message to send (non-blocking)
 *
 * Unlike other sessions, PingSession is continuous - it auto-restarts after each cycle.
 */
import { buildPingCommand } from '../commands/builders.js';
/**
 * Ping Phases
 */
export var PingPhase;
(function (PingPhase) {
    PingPhase[PingPhase["IDLE"] = 0] = "IDLE";
    PingPhase[PingPhase["WAITING_FOR_RESPONSE"] = 1] = "WAITING_FOR_RESPONSE";
    PingPhase[PingPhase["ERROR"] = 2] = "ERROR";
})(PingPhase || (PingPhase = {}));
/**
 * Manages the state of a device ping session.
 *
 * Sends periodic ping commands to keep the device connection alive.
 * Tracks whether responses are received within timeout.
 */
export class PingSession {
    phase = PingPhase.IDLE;
    messageQueue = [];
    deviceId;
    lastPingTime = 0;
    lastResponseTime = 0;
    pingIntervalMs;
    timeoutMs;
    enabled = true;
    errorMessage = undefined;
    constructor(deviceId, pingIntervalMs = 2000, timeoutMs = 5000) {
        this.deviceId = deviceId;
        this.pingIntervalMs = pingIntervalMs;
        this.timeoutMs = timeoutMs;
    }
    /**
     * Start the ping session.
     */
    start() {
        if (this.phase !== PingPhase.IDLE) {
            return;
        }
        console.log(`[PingSession] Starting ping for device ${this.deviceId}`);
        this.lastResponseTime = Date.now(); // Assume connected initially
        this.queuePing();
    }
    /**
     * Reset to idle state.
     */
    reset() {
        this.phase = PingPhase.IDLE;
        this.lastPingTime = 0;
        this.lastResponseTime = 0;
        this.errorMessage = undefined;
        this.messageQueue.length = 0;
    }
    /**
     * Enable or disable pinging.
     * When disabled, no new pings are queued and timeouts are not checked.
     * When re-enabled, lastResponseTime is reset to prevent false timeouts
     * after long operations.
     */
    setEnabled(enabled) {
        // Reset response time when re-enabling to prevent false timeout
        if (enabled && !this.enabled) {
            this.lastResponseTime = Date.now();
        }
        this.enabled = enabled;
    }
    /**
     * Check if pinging is enabled.
     */
    isEnabled() {
        return this.enabled;
    }
    /**
     * Get the next message to send to the device.
     * Returns undefined if no messages are pending.
     */
    getNextMessage() {
        if (this.phase === PingPhase.ERROR) {
            return undefined;
        }
        return this.messageQueue.shift() ?? undefined;
    }
    /**
     * Process a message received from the device.
     * Any response indicates the device is alive.
     */
    processResponse(message) {
        if (this.phase === PingPhase.ERROR) {
            return;
        }
        // Any response from our device indicates it's alive
        if (message.type === 'status' || message.type === 'search') {
            this.lastResponseTime = Date.now();
            this.phase = PingPhase.IDLE;
        }
    }
    /**
     * Check timeouts and queue new pings - call this from tick loop.
     */
    tick(now) {
        if (this.phase === PingPhase.ERROR) {
            return;
        }
        // Skip timeout check when disabled (device is busy with an operation)
        if (!this.enabled) {
            return;
        }
        // Check for response timeout
        if (now - this.lastResponseTime > this.timeoutMs) {
            console.log(`[PingSession] Device ${this.deviceId} timeout - no response`);
            this.phase = PingPhase.ERROR;
            this.errorMessage = 'Device not responding';
            return;
        }
        // Queue new ping if interval elapsed and enabled
        if (now - this.lastPingTime >= this.pingIntervalMs) {
            this.queuePing();
        }
    }
    /**
     * Get the current status.
     */
    getStatus() {
        return {
            phase: PingPhase[this.phase],
            enabled: this.enabled,
            timeSinceLastResponse: Date.now() - this.lastResponseTime,
            queueLength: this.messageQueue.length,
        };
    }
    /**
     * Check if there was an error (device not responding).
     */
    isError() {
        return this.phase === PingPhase.ERROR;
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
    /**
     * Queue a ping command.
     */
    queuePing() {
        const pingCmd = buildPingCommand(this.deviceId);
        this.messageQueue.push(pingCmd);
        this.lastPingTime = Date.now();
        this.phase = PingPhase.WAITING_FOR_RESPONSE;
    }
}
//# sourceMappingURL=ping.js.map
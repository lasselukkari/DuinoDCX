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
import type { ParsedMessage } from '../protocol/sysex.js';
/**
 * Ping Phases
 */
export declare enum PingPhase {
    IDLE = 0,
    WAITING_FOR_RESPONSE = 1,
    ERROR = 2
}
/**
 * Manages the state of a device ping session.
 *
 * Sends periodic ping commands to keep the device connection alive.
 * Tracks whether responses are received within timeout.
 */
export declare class PingSession {
    private phase;
    private readonly messageQueue;
    private readonly deviceId;
    private lastPingTime;
    private lastResponseTime;
    private readonly pingIntervalMs;
    private readonly timeoutMs;
    private enabled;
    private errorMessage;
    constructor(deviceId: number, pingIntervalMs?: number, timeoutMs?: number);
    /**
     * Start the ping session.
     */
    start(): void;
    /**
     * Reset to idle state.
     */
    reset(): void;
    /**
     * Enable or disable pinging.
     * When disabled, no new pings are queued and timeouts are not checked.
     * When re-enabled, lastResponseTime is reset to prevent false timeouts
     * after long operations.
     */
    setEnabled(enabled: boolean): void;
    /**
     * Check if pinging is enabled.
     */
    isEnabled(): boolean;
    /**
     * Get the next message to send to the device.
     * Returns undefined if no messages are pending.
     */
    getNextMessage(): Uint8Array | undefined;
    /**
     * Process a message received from the device.
     * Any response indicates the device is alive.
     */
    processResponse(message: ParsedMessage): void;
    /**
     * Check timeouts and queue new pings - call this from tick loop.
     */
    tick(now: number): void;
    /**
     * Get the current status.
     */
    getStatus(): {
        phase: string;
        enabled: boolean;
        timeSinceLastResponse: number;
        queueLength: number;
    };
    /**
     * Check if there was an error (device not responding).
     */
    isError(): boolean;
    /**
     * Get the error message (only available after error).
     */
    getError(): string | undefined;
    /**
     * Get the current phase.
     */
    getPhase(): PingPhase;
    /**
     * Queue a ping command.
     */
    private queuePing;
}
//# sourceMappingURL=ping.d.ts.map
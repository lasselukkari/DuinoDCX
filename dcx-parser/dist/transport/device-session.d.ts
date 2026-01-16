/**
 * Device Session State Machine.
 *
 * Unified state machine for all device communication:
 * - Search for devices
 * - Sync edit buffer (2 parts)
 * - Ping for status
 * - Download presets (12 pages)
 *
 * Only one operation runs at a time. Ping only happens in IDLE state
 * when pingEnabled is true.
 */
import type { ParsedMessage } from '../protocol/sysex.js';
import type { State } from '../types/index.js';
/**
 * Device Session Phases
 */
export declare enum DevicePhase {
    /** Not connected to WebSocket */
    DISCONNECTED = "DISCONNECTED",
    /** Searching for device on the bus */
    SEARCHING = "SEARCHING",
    /** Downloading edit buffer (initial sync) */
    SYNCING = "SYNCING",
    /** Normal operation - can ping if enabled */
    IDLE = "IDLE",
    /** Downloading all preset pages */
    DOWNLOADING_PRESETS = "DOWNLOADING_PRESETS"
}
/**
 * Unified device session state machine.
 *
 * Sequences all device communication to prevent message collisions.
 */
export declare class DeviceSession {
    private phase;
    private pingEnabled;
    private deviceId;
    private readonly messageQueue;
    private lastResponseTime;
    private lastSearchTime;
    private readonly editBufferParts;
    private nextEditBufferPart;
    private editBufferState;
    private readonly presetPages;
    private nextPresetPage;
    private presetData;
    private errorMessage;
    /**
     * Enable or disable pinging.
     * Used by coordination layer to implement leader election.
     */
    setPingEnabled(enabled: boolean): void;
    /**
     * Check if pinging is enabled.
     */
    isPingEnabled(): boolean;
    /**
     * Start the session - transition from DISCONNECTED to SEARCHING.
     */
    connect(): void;
    /**
     * Stop the session - reset all state.
     */
    disconnect(): void;
    /**
     * Request preset download.
     * Returns true if started, false if not in IDLE phase.
     */
    requestPresets(): boolean;
    /**
     * Called periodically (e.g., every 250ms) to check timeouts and queue messages.
     */
    tick(): void;
    /**
     * Process an incoming message from the device.
     */
    processResponse(message: ParsedMessage): void;
    /**
     * Get the next message to send to the device.
     */
    getNextMessage(): Uint8Array | undefined;
    /**
     * Get current phase.
     */
    getPhase(): DevicePhase;
    /**
     * Get parsed device state (from edit buffer).
     */
    getState(): State | undefined;
    /**
     * Get downloaded preset data.
     */
    getPresetData(): Uint8Array | undefined;
    /**
     * Get current device ID.
     */
    getDeviceId(): number;
    /**
     * Get progress for current download operation (0-1).
     */
    getProgress(): number;
    /**
     * Check if currently downloading (syncing or presets).
     */
    isDownloading(): boolean;
    /**
     * Get error message if any.
     */
    getError(): string | undefined;
    private handleSearching;
    private handleSyncing;
    private handleDownloadingPresets;
    private assembleEditBuffer;
    private assemblePresets;
    private queueEditBufferRequest;
    private queuePageRequest;
    private reset;
}
//# sourceMappingURL=device-session.d.ts.map
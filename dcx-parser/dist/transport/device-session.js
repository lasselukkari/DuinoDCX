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
import { buildSearchCommand, buildPingCommand, buildEditBufferRequest, buildPageDumpRequest, buildListenModeCommand, } from '../commands/builders.js';
import { parseEditBuffer } from '../edit-buffer-parser.js';
import { assemblePagesIntoDcxFile } from '../dcx-file.js';
// Constants
const EDIT_BUFFER_PARTS = 2;
const PRESET_PAGES = 12;
const PING_INTERVAL_MS = 1000;
const DEVICE_LOST_TIMEOUT_MS = 5000;
const SEARCH_INTERVAL_MS = 1000;
/**
 * Device Session Phases
 */
export var DevicePhase;
(function (DevicePhase) {
    /** Not connected to WebSocket */
    DevicePhase["DISCONNECTED"] = "DISCONNECTED";
    /** Searching for device on the bus */
    DevicePhase["SEARCHING"] = "SEARCHING";
    /** Downloading edit buffer (initial sync) */
    DevicePhase["SYNCING"] = "SYNCING";
    /** Normal operation - can ping if enabled */
    DevicePhase["IDLE"] = "IDLE";
    /** Downloading all preset pages */
    DevicePhase["DOWNLOADING_PRESETS"] = "DOWNLOADING_PRESETS";
})(DevicePhase || (DevicePhase = {}));
/**
 * Unified device session state machine.
 *
 * Sequences all device communication to prevent message collisions.
 */
export class DeviceSession {
    // Phase
    phase = DevicePhase.DISCONNECTED;
    // Control flags
    pingEnabled = true;
    // Device info
    deviceId = 0;
    // Message queue
    messageQueue = [];
    // Timing
    lastResponseTime = 0;
    lastSearchTime = 0;
    // Edit buffer state
    editBufferParts = new Map();
    nextEditBufferPart = 0;
    editBufferState = undefined;
    // Preset download state
    presetPages = new Map();
    nextPresetPage = 0;
    presetData = undefined;
    // Error state
    errorMessage = undefined;
    // ─────────────────────────────────────────────────────────────────────────
    // Public API
    // ─────────────────────────────────────────────────────────────────────────
    /**
     * Enable or disable pinging.
     * Used by coordination layer to implement leader election.
     */
    setPingEnabled(enabled) {
        this.pingEnabled = enabled;
    }
    /**
     * Check if pinging is enabled.
     */
    isPingEnabled() {
        return this.pingEnabled;
    }
    /**
     * Start the session - transition from DISCONNECTED to SEARCHING.
     */
    connect() {
        if (this.phase !== DevicePhase.DISCONNECTED) {
            return;
        }
        console.log('[DeviceSession] Starting search');
        this.phase = DevicePhase.SEARCHING;
        this.lastSearchTime = 0; // Force immediate search
        this.lastResponseTime = Date.now();
    }
    /**
     * Stop the session - reset all state.
     */
    disconnect() {
        console.log('[DeviceSession] Disconnecting');
        this.reset();
    }
    /**
     * Request preset download.
     * Returns true if started, false if not in IDLE phase.
     */
    requestPresets() {
        if (this.phase !== DevicePhase.IDLE) {
            console.log('[DeviceSession] Cannot download presets - not idle');
            return false;
        }
        console.log('[DeviceSession] Starting preset download');
        this.phase = DevicePhase.DOWNLOADING_PRESETS;
        this.presetPages.clear();
        this.nextPresetPage = 0;
        this.presetData = undefined;
        // Queue first page request
        this.queuePageRequest(0);
        this.nextPresetPage = 1;
        return true;
    }
    /**
     * Called periodically (e.g., every 250ms) to check timeouts and queue messages.
     */
    tick() {
        const now = Date.now();
        switch (this.phase) {
            case DevicePhase.DISCONNECTED:
                // Nothing to do
                break;
            case DevicePhase.SEARCHING:
                // Send periodic search commands
                if (now - this.lastSearchTime > SEARCH_INTERVAL_MS) {
                    this.messageQueue.push(buildSearchCommand());
                    this.lastSearchTime = now;
                }
                break;
            case DevicePhase.IDLE:
                // Check for device lost
                if (now - this.lastResponseTime > DEVICE_LOST_TIMEOUT_MS) {
                    console.log('[DeviceSession] Device lost, restarting search');
                    this.phase = DevicePhase.SEARCHING;
                    this.editBufferState = undefined;
                    this.lastSearchTime = 0;
                    break;
                }
                // Send ping if enabled and timeout elapsed
                if (this.pingEnabled && now - this.lastResponseTime > PING_INTERVAL_MS) {
                    this.messageQueue.push(buildPingCommand(this.deviceId));
                    // Don't update lastResponseTime here - only on actual response
                }
                break;
            case DevicePhase.SYNCING:
            case DevicePhase.DOWNLOADING_PRESETS:
                // These phases drive themselves via processResponse
                break;
        }
    }
    /**
     * Process an incoming message from the device.
     */
    processResponse(message) {
        // Any device response resets the timeout
        if (message.type === 'status' ||
            message.type === 'editBuffer' ||
            message.type === 'pageDump') {
            this.lastResponseTime = Date.now();
        }
        switch (this.phase) {
            case DevicePhase.SEARCHING:
                this.handleSearching(message);
                break;
            case DevicePhase.SYNCING:
                this.handleSyncing(message);
                break;
            case DevicePhase.IDLE:
                // Status responses keep us alive (handled above)
                break;
            case DevicePhase.DOWNLOADING_PRESETS:
                this.handleDownloadingPresets(message);
                break;
        }
    }
    /**
     * Get the next message to send to the device.
     */
    getNextMessage() {
        return this.messageQueue.shift();
    }
    /**
     * Get current phase.
     */
    getPhase() {
        return this.phase;
    }
    /**
     * Get parsed device state (from edit buffer).
     */
    getState() {
        return this.editBufferState;
    }
    /**
     * Get downloaded preset data.
     */
    getPresetData() {
        return this.presetData;
    }
    /**
     * Get current device ID.
     */
    getDeviceId() {
        return this.deviceId;
    }
    /**
     * Get progress for current download operation (0-1).
     */
    getProgress() {
        switch (this.phase) {
            case DevicePhase.SYNCING:
                return this.editBufferParts.size / EDIT_BUFFER_PARTS;
            case DevicePhase.DOWNLOADING_PRESETS:
                return this.presetPages.size / PRESET_PAGES;
            default:
                return 0;
        }
    }
    /**
     * Check if currently downloading (syncing or presets).
     */
    isDownloading() {
        return (this.phase === DevicePhase.SYNCING ||
            this.phase === DevicePhase.DOWNLOADING_PRESETS);
    }
    /**
     * Get error message if any.
     */
    getError() {
        return this.errorMessage;
    }
    // ─────────────────────────────────────────────────────────────────────────
    // Phase handlers
    // ─────────────────────────────────────────────────────────────────────────
    handleSearching(message) {
        if (message.type === 'search') {
            console.log(`[DeviceSession] Device found: ID ${message.deviceId}`);
            this.deviceId = message.deviceId;
            // Transition to SYNCING
            this.phase = DevicePhase.SYNCING;
            this.editBufferParts.clear();
            this.nextEditBufferPart = 0;
            // Enable remote control and request first edit buffer part
            this.messageQueue.push(buildListenModeCommand());
            this.queueEditBufferRequest(0);
            this.nextEditBufferPart = 1;
        }
    }
    handleSyncing(message) {
        if (message.type === 'editBuffer') {
            const { part, data } = message;
            console.log(`[DeviceSession] Received edit buffer part ${part}, ${data.length} bytes`);
            this.editBufferParts.set(part, data);
            if (this.editBufferParts.size === EDIT_BUFFER_PARTS) {
                // All parts received - parse state
                this.assembleEditBuffer();
            }
            else if (this.nextEditBufferPart < EDIT_BUFFER_PARTS) {
                // Request next part
                this.queueEditBufferRequest(this.nextEditBufferPart);
                this.nextEditBufferPart++;
            }
        }
    }
    handleDownloadingPresets(message) {
        if (message.type === 'pageDump') {
            const { page, data } = message;
            console.log(`[DeviceSession] Received preset page ${page}, ${data.length} bytes`);
            this.presetPages.set(page, data);
            if (this.presetPages.size === PRESET_PAGES) {
                // All pages received - assemble file
                this.assemblePresets();
            }
            else if (this.nextPresetPage < PRESET_PAGES) {
                // Request next page
                this.queuePageRequest(this.nextPresetPage);
                this.nextPresetPage++;
            }
        }
    }
    // ─────────────────────────────────────────────────────────────────────────
    // Assembly helpers
    // ─────────────────────────────────────────────────────────────────────────
    assembleEditBuffer() {
        try {
            console.log('[DeviceSession] Assembling edit buffer');
            const part0 = this.editBufferParts.get(0);
            const part1 = this.editBufferParts.get(1);
            if (!part0 || !part1) {
                throw new Error('Missing edit buffer parts');
            }
            const combined = new Uint8Array(part0.length + part1.length);
            combined.set(part0);
            combined.set(part1, part0.length);
            this.editBufferState = parseEditBuffer(combined);
            this.phase = DevicePhase.IDLE;
            this.lastResponseTime = Date.now();
            console.log('[DeviceSession] Edit buffer parsed, transitioning to IDLE');
        }
        catch (error) {
            console.error('[DeviceSession] Edit buffer parse error:', error);
            this.errorMessage = String(error);
            // Stay in SYNCING or retry? For now, go to IDLE anyway
            this.phase = DevicePhase.IDLE;
        }
    }
    assemblePresets() {
        try {
            console.log('[DeviceSession] Assembling preset data');
            const pageArray = [];
            for (let i = 0; i < PRESET_PAGES; i++) {
                const pageData = this.presetPages.get(i);
                if (!pageData) {
                    throw new Error(`Missing page ${i}`);
                }
                pageArray.push({ page: i, data: pageData });
            }
            this.presetData = assemblePagesIntoDcxFile(pageArray);
            this.phase = DevicePhase.IDLE;
            this.lastResponseTime = Date.now();
            console.log('[DeviceSession] Presets assembled, transitioning to IDLE');
        }
        catch (error) {
            console.error('[DeviceSession] Preset assembly error:', error);
            this.errorMessage = String(error);
            this.phase = DevicePhase.IDLE;
        }
    }
    // ─────────────────────────────────────────────────────────────────────────
    // Queue helpers
    // ─────────────────────────────────────────────────────────────────────────
    queueEditBufferRequest(part) {
        this.messageQueue.push(buildEditBufferRequest(part, this.deviceId));
    }
    queuePageRequest(page) {
        this.messageQueue.push(buildPageDumpRequest(page, this.deviceId));
    }
    reset() {
        this.phase = DevicePhase.DISCONNECTED;
        this.pingEnabled = true;
        this.deviceId = 0;
        this.messageQueue.length = 0;
        this.lastResponseTime = 0;
        this.lastSearchTime = 0;
        this.editBufferParts.clear();
        this.nextEditBufferPart = 0;
        this.editBufferState = undefined;
        this.presetPages.clear();
        this.nextPresetPage = 0;
        this.presetData = undefined;
        this.errorMessage = undefined;
    }
}
//# sourceMappingURL=device-session.js.map
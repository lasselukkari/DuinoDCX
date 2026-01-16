/**
 * Device Coordinator.
 *
 * Central coordinator for all device operations. Manages:
 * - Multi-device state (Map of device ID -> state/presets)
 * - Operation queue (one at a time)
 * - Ping sessions for each device
 * - Direct parameter changes with optimistic updates
 */
import { buildParameterChangeCommand } from '../commands/builders.js';
import { parseDcxPresets, isValidDcxFile } from '../dcx-file.js';
import { SearchSession } from './search.js';
import { PingSession } from './ping.js';
import { EditBufferSession } from './edit-buffer.js';
import { BackupSession } from './backup.js';
import { RestoreSession } from './restore.js';
/**
 * Coordinator phases
 */
export var CoordinatorPhase;
(function (CoordinatorPhase) {
    CoordinatorPhase[CoordinatorPhase["DISCONNECTED"] = 0] = "DISCONNECTED";
    CoordinatorPhase[CoordinatorPhase["SEARCHING"] = 1] = "SEARCHING";
    CoordinatorPhase[CoordinatorPhase["IDLE"] = 2] = "IDLE";
    CoordinatorPhase[CoordinatorPhase["BUSY"] = 3] = "BUSY";
})(CoordinatorPhase || (CoordinatorPhase = {}));
/**
 * Operation types for granular loading states
 */
export var OperationType;
(function (OperationType) {
    OperationType[OperationType["NONE"] = 0] = "NONE";
    OperationType[OperationType["SYNC_STATE"] = 1] = "SYNC_STATE";
    OperationType[OperationType["BACKUP_PRESETS"] = 2] = "BACKUP_PRESETS";
    OperationType[OperationType["RESTORE_PRESETS"] = 3] = "RESTORE_PRESETS";
})(OperationType || (OperationType = {}));
/**
 * Device Coordinator - single source of truth for device operations.
 */
export class DeviceCoordinator {
    // Multi-device state
    devices = new Map();
    // Current operation
    searchSession;
    currentSession;
    currentDeviceId;
    pendingOperations = [];
    // Message queue for direct commands
    messageQueue = [];
    // Progress tracking
    operationProgress = 0;
    currentOperationType = OperationType.NONE;
    /**
     * Connect - start searching for devices.
     */
    connect() {
        if (this.searchSession) {
            return; // Already searching
        }
        console.log('[DeviceCoordinator] Starting device search');
        this.searchSession = new SearchSession(1000);
        this.searchSession.start();
    }
    /**
     * Disconnect - stop everything.
     */
    disconnect() {
        console.log('[DeviceCoordinator] Disconnecting');
        this.searchSession = undefined;
        this.currentSession = undefined;
        this.devices.clear();
        this.messageQueue.length = 0;
        this.pendingOperations.length = 0;
    }
    /**
     * Tick - check timeouts, manage sessions. Call from interval.
     */
    tick(now) {
        // Tick search session
        if (this.searchSession) {
            this.searchSession.tick(now);
            if (this.searchSession.isComplete()) {
                this.handleSearchComplete();
            }
        }
        // Tick ping sessions for each device
        for (const [deviceId, data] of this.devices) {
            data.pingSession.tick(now);
            if (data.pingSession.isError()) {
                console.log(`[DeviceCoordinator] Device ${deviceId} lost connection`);
                // Could remove device or try to reconnect
            }
        }
        // Start next operation if idle
        if (!this.currentSession && this.pendingOperations.length > 0) {
            const next = this.pendingOperations.shift();
            this.startOperation(next.deviceId, next.operationType, next.create());
        }
    }
    /**
     * Process a message from the device.
     */
    processResponse(message) {
        // Route to search session
        if (this.searchSession) {
            this.searchSession.processResponse(message);
        }
        // Route to current operation session
        if (this.currentSession) {
            this.currentSession.processResponse(message);
            this.checkOperationComplete();
        }
        // Route to ping sessions
        for (const data of this.devices.values()) {
            data.pingSession.processResponse(message);
        }
        // Handle direct echoes
        if (message.type === 'direct') {
            // Direct command echo - state already updated optimistically
            // Could verify here if needed
        }
    }
    /**
     * Get next message to send.
     */
    getNextMessage() {
        // Priority: search, then current operation, then pings, then direct commands
        if (this.searchSession) {
            const msg = this.searchSession.getNextMessage();
            if (msg)
                return msg;
        }
        if (this.currentSession) {
            const msg = this.currentSession.getNextMessage();
            if (msg)
                return msg;
        }
        // Ping messages
        for (const data of this.devices.values()) {
            const msg = data.pingSession.getNextMessage();
            if (msg)
                return msg;
        }
        // Direct command queue
        return this.messageQueue.shift();
    }
    // ============================================================================
    // State Queries
    // ============================================================================
    getPhase() {
        if (!this.searchSession && this.devices.size === 0) {
            return CoordinatorPhase.DISCONNECTED;
        }
        if (this.searchSession && !this.searchSession.isComplete()) {
            return CoordinatorPhase.SEARCHING;
        }
        if (this.currentSession) {
            return CoordinatorPhase.BUSY;
        }
        return CoordinatorPhase.IDLE;
    }
    getProgress() {
        return this.operationProgress;
    }
    getDeviceIds() {
        return [...this.devices.keys()];
    }
    getDeviceState(deviceId) {
        return this.devices.get(deviceId)?.state;
    }
    getPresets(deviceId) {
        return this.devices.get(deviceId)?.presets ?? [];
    }
    isLoading() {
        return this.currentSession !== undefined;
    }
    getOperationType() {
        return this.currentOperationType;
    }
    getDevicesSnapshot() {
        const snapshot = new Map();
        for (const [id, data] of this.devices) {
            snapshot.set(id, { state: data.state, presets: data.presets });
        }
        return snapshot;
    }
    // ============================================================================
    // Operations
    // ============================================================================
    /**
     * Request device state (edit buffer) for a device.
     */
    requestDeviceState(deviceId) {
        this.queueOperation(deviceId, OperationType.SYNC_STATE, () => {
            const session = new EditBufferSession();
            session.start();
            return session;
        });
    }
    /**
     * Request presets (backup) for a device.
     */
    requestPresets(deviceId) {
        console.log(`[DeviceCoordinator] Queueing preset download for device ${deviceId}`);
        this.queueOperation(deviceId, OperationType.BACKUP_PRESETS, () => {
            const session = new BackupSession();
            session.start();
            return session;
        });
    }
    /**
     * Upload presets (restore) to a device.
     */
    uploadPresets(deviceId, dcxData) {
        this.queueOperation(deviceId, OperationType.RESTORE_PRESETS, () => {
            const session = new RestoreSession(dcxData, deviceId);
            session.start();
            return session;
        });
    }
    /**
     * Load presets from file (preview only, no device communication).
     */
    loadPresetsFromFile(deviceId, dcxData) {
        const device = this.devices.get(deviceId);
        if (!device) {
            console.warn(`[DeviceCoordinator] Device ${deviceId} not found`);
            return;
        }
        if (isValidDcxFile(dcxData)) {
            try {
                device.presets = parseDcxPresets(dcxData);
                console.log(`[DeviceCoordinator] Loaded ${device.presets.length} presets from file`);
            }
            catch (error) {
                console.error('[DeviceCoordinator] Failed to parse DCX file:', error);
            }
        }
    }
    /**
     * Send a parameter change command.
     */
    sendParameterChange(deviceId, target, value) {
        const cmd = buildParameterChangeCommand(target, value, deviceId);
        if (cmd) {
            // TODO: Apply optimistic update to local state
            this.messageQueue.push(cmd);
        }
    }
    // ============================================================================
    // Private Helpers
    // ============================================================================
    handleSearchComplete() {
        if (!this.searchSession)
            return;
        const deviceIds = this.searchSession.getDeviceIds();
        console.log(`[DeviceCoordinator] Search complete, found ${deviceIds.length} device(s)`);
        // Create entries for each device
        for (const deviceId of deviceIds) {
            if (!this.devices.has(deviceId)) {
                this.devices.set(deviceId, {
                    state: undefined,
                    presets: [],
                    pingSession: new PingSession(deviceId),
                });
                // Start ping session
                this.devices.get(deviceId).pingSession.start();
                // Auto-request device state
                this.requestDeviceState(deviceId);
            }
        }
        this.searchSession = undefined;
    }
    queueOperation(deviceId, operationType, create) {
        // Pause pinging during operations
        const device = this.devices.get(deviceId);
        if (device) {
            device.pingSession.setEnabled(false);
        }
        if (this.currentSession) {
            // Queue if busy
            this.pendingOperations.push({ deviceId, operationType, create });
        }
        else {
            this.startOperation(deviceId, operationType, create());
        }
    }
    startOperation(deviceId, operationType, session) {
        console.log(`[DeviceCoordinator] Starting operation for device ${deviceId}`);
        this.currentSession = session;
        this.currentDeviceId = deviceId;
        this.currentOperationType = operationType;
        this.operationProgress = 0;
    }
    checkOperationComplete() {
        if (!this.currentSession)
            return;
        const session = this.currentSession;
        const deviceId = this.currentDeviceId;
        // Update progress based on session type
        if (session instanceof EditBufferSession) {
            const status = session.getStatus();
            this.operationProgress = status.progress;
            if (session.isComplete()) {
                const device = this.devices.get(deviceId);
                if (device) {
                    device.state = session.getState();
                    console.log(`[DeviceCoordinator] Device ${deviceId} state synced`);
                }
            }
        }
        if (session instanceof BackupSession) {
            const status = session.getStatus();
            this.operationProgress = status.progress;
            if (session.isComplete()) {
                const device = this.devices.get(deviceId);
                const dcxData = session.getDcxData();
                if (device && dcxData && isValidDcxFile(dcxData)) {
                    device.presets = parseDcxPresets(dcxData);
                    console.log(`[DeviceCoordinator] Device ${deviceId} presets synced (${device.presets.length})`);
                }
            }
        }
        // Clean up on complete or error
        if (session.isComplete() || session.isError?.()) {
            this.currentSession = undefined;
            this.currentDeviceId = undefined;
            this.currentOperationType = OperationType.NONE;
            this.operationProgress = 0;
            // Re-enable pinging
            const device = this.devices.get(deviceId);
            if (device) {
                device.pingSession.setEnabled(true);
            }
        }
    }
}
//# sourceMappingURL=device-coordinator.js.map
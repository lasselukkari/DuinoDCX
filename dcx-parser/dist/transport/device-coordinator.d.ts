/**
 * Device Coordinator.
 *
 * Central coordinator for all device operations. Manages:
 * - Multi-device state (Map of device ID -> state/presets)
 * - Operation queue (one at a time)
 * - Ping sessions for each device
 * - Direct parameter changes with optimistic updates
 */
import type { ParsedMessage } from '../protocol/sysex.js';
import type { State } from '../types/index.js';
import type { ParsedPreset } from '../dcx-file.js';
import type { ParameterTarget } from '../commands/builders.js';
import { PingSession } from './ping.js';
/**
 * Coordinator phases
 */
export declare enum CoordinatorPhase {
    DISCONNECTED = 0,
    SEARCHING = 1,
    IDLE = 2,
    BUSY = 3
}
/**
 * Operation types for granular loading states
 */
export declare enum OperationType {
    NONE = 0,
    SYNC_STATE = 1,
    BACKUP_PRESETS = 2,
    RESTORE_PRESETS = 3
}
/**
 * Per-device data
 */
export interface DeviceData {
    state: State | undefined;
    presets: ParsedPreset[];
    pingSession: PingSession;
}
/**
 * Device Coordinator - single source of truth for device operations.
 */
export declare class DeviceCoordinator {
    private devices;
    private searchSession;
    private currentSession;
    private currentDeviceId;
    private pendingOperations;
    private messageQueue;
    private operationProgress;
    private currentOperationType;
    /**
     * Connect - start searching for devices.
     */
    connect(): void;
    /**
     * Disconnect - stop everything.
     */
    disconnect(): void;
    /**
     * Tick - check timeouts, manage sessions. Call from interval.
     */
    tick(now: number): void;
    /**
     * Process a message from the device.
     */
    processResponse(message: ParsedMessage): void;
    /**
     * Get next message to send.
     */
    getNextMessage(): Uint8Array | undefined;
    getPhase(): CoordinatorPhase;
    getProgress(): number;
    getDeviceIds(): number[];
    getDeviceState(deviceId: number): State | undefined;
    getPresets(deviceId: number): ParsedPreset[];
    isLoading(): boolean;
    getOperationType(): OperationType;
    getDevicesSnapshot(): Map<number, {
        state: State | undefined;
        presets: ParsedPreset[];
    }>;
    /**
     * Request device state (edit buffer) for a device.
     */
    requestDeviceState(deviceId: number): void;
    /**
     * Request presets (backup) for a device.
     */
    requestPresets(deviceId: number): void;
    /**
     * Upload presets (restore) to a device.
     */
    uploadPresets(deviceId: number, dcxData: Uint8Array): void;
    /**
     * Load presets from file (preview only, no device communication).
     */
    loadPresetsFromFile(deviceId: number, dcxData: Uint8Array): void;
    /**
     * Send a parameter change command.
     */
    sendParameterChange(deviceId: number, target: ParameterTarget, value: boolean | string | number): void;
    private handleSearchComplete;
    private queueOperation;
    private startOperation;
    private checkOperationComplete;
}
//# sourceMappingURL=device-coordinator.d.ts.map
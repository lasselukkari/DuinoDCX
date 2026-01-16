/**
 * Device Coordinator.
 *
 * Central coordinator for all device operations. Manages:
 * - Multi-device state (Map of device ID -> state/presets)
 * - Operation queue (one at a time)
 * - Ping sessions for each device
 * - Direct parameter changes with optimistic updates
 */

import type {ParsedMessage} from '../protocol/sysex.js';
import type {State} from '../types/index.js';
import type {ParsedPreset} from '../dcx-file.js';
import type {ParameterTarget} from '../commands/builders.js';
import {buildParameterChangeCommand} from '../commands/builders.js';
import {parseDcxPresets, isValidDcxFile} from '../dcx-file.js';
import {SearchSession} from './search.js';
import {PingSession} from './ping.js';
import {EditBufferSession} from './edit-buffer.js';
import {BackupSession} from './backup.js';
import {RestoreSession} from './restore.js';
import {DeviceStateBuffer} from '../state/device-state-buffer.js';

/**
 * Coordinator phases
 */
export enum CoordinatorPhase {
  DISCONNECTED,
  SEARCHING,
  IDLE,
  BUSY,
}

/**
 * Operation types for granular loading states
 */
export enum OperationType {
  NONE,
  SYNC_STATE,
  BACKUP_PRESETS,
  RESTORE_PRESETS,
}

/**
 * Per-device data
 */
export interface DeviceData {
  buffer: DeviceStateBuffer | undefined;  // Binary source of truth
  presets: ParsedPreset[];
  pingSession: PingSession;
}

/**
 * Session interface for type safety
 */
interface Session {
  getNextMessage(): Uint8Array | undefined;
  processResponse(message: ParsedMessage): void;
  isComplete(): boolean;
  isError?(): boolean;  // Optional - RestoreSession doesn't have this
}

/**
 * Device Coordinator - single source of truth for device operations.
 */
export class DeviceCoordinator {
  // Multi-device state
  private devices: Map<number, DeviceData> = new Map();

  // Current operation
  private searchSession: SearchSession | undefined;
  private currentSession: Session | undefined;
  private currentDeviceId: number | undefined;
  private pendingOperations: Array<{deviceId: number; operationType: OperationType; create: () => Session}> = [];

  // Message queue for direct commands
  private messageQueue: Uint8Array[] = [];

  // Progress tracking
  private operationProgress = 0;
  private currentOperationType: OperationType = OperationType.NONE;

  /**
   * Connect - start searching for devices.
   */
  public connect(): void {
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
  public disconnect(): void {
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
  public tick(now: number): void {
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
      const next = this.pendingOperations.shift()!;
      this.startOperation(next.deviceId, next.operationType, next.create());
    }
  }

  /**
   * Process a message from the device.
   */
  public processResponse(message: ParsedMessage): void {
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
  public getNextMessage(): Uint8Array | undefined {
    // Priority: search, then current operation, then pings, then direct commands
    if (this.searchSession) {
      const msg = this.searchSession.getNextMessage();
      if (msg) return msg;
    }

    if (this.currentSession) {
      const msg = this.currentSession.getNextMessage();
      if (msg) return msg;
    }

    // Ping messages
    for (const data of this.devices.values()) {
      const msg = data.pingSession.getNextMessage();
      if (msg) return msg;
    }

    // Direct command queue
    return this.messageQueue.shift();
  }

  // ============================================================================
  // State Queries
  // ============================================================================

  public getPhase(): CoordinatorPhase {
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

  public getProgress(): number {
    return this.operationProgress;
  }

  public getDeviceIds(): number[] {
    return [...this.devices.keys()];
  }

  public getDeviceState(deviceId: number): State | undefined {
    return this.devices.get(deviceId)?.buffer?.getState();
  }

  public getPresets(deviceId: number): ParsedPreset[] {
    return this.devices.get(deviceId)?.presets ?? [];
  }

  public isLoading(): boolean {
    return this.currentSession !== undefined;
  }

  public getOperationType(): OperationType {
    return this.currentOperationType;
  }

  public getDevicesSnapshot(): Map<number, {state: State | undefined; presets: ParsedPreset[]}> {
    const snapshot = new Map<number, {state: State | undefined; presets: ParsedPreset[]}>();
    for (const [id, data] of this.devices) {
      snapshot.set(id, {state: data.buffer?.getState(), presets: data.presets});
    }

    return snapshot;
  }

  // ============================================================================
  // Operations
  // ============================================================================

  /**
   * Request device state (edit buffer) for a device.
   */
  public requestDeviceState(deviceId: number): void {
    this.queueOperation(deviceId, OperationType.SYNC_STATE, () => {
      const session = new EditBufferSession();
      session.start();
      return session;
    });
  }

  /**
   * Request presets (backup) for a device.
   */
  public requestPresets(deviceId: number): void {
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
  public uploadPresets(deviceId: number, dcxData: Uint8Array): void {
    this.queueOperation(deviceId, OperationType.RESTORE_PRESETS, () => {
      const session = new RestoreSession(dcxData, deviceId);
      session.start();
      return session;
    });
  }

  /**
   * Load presets from file (preview only, no device communication).
   */
  public loadPresetsFromFile(deviceId: number, dcxData: Uint8Array): void {
    const device = this.devices.get(deviceId);
    if (!device) {
      console.warn(`[DeviceCoordinator] Device ${deviceId} not found`);
      return;
    }

    if (isValidDcxFile(dcxData)) {
      try {
        device.presets = parseDcxPresets(dcxData);
        console.log(`[DeviceCoordinator] Loaded ${device.presets.length} presets from file`);
      } catch (error) {
        console.error('[DeviceCoordinator] Failed to parse DCX file:', error);
      }
    }
  }

  /**
   * Send a parameter change command.
   */
  public sendParameterChange(
    deviceId: number,
    target: ParameterTarget,
    value: boolean | string | number,
  ): void {
    const cmd = buildParameterChangeCommand(target, value, deviceId);
    if (cmd) {
      // TODO: Apply optimistic update to local state
      this.messageQueue.push(cmd);
    }
  }

  // ============================================================================
  // Private Helpers
  // ============================================================================

  private handleSearchComplete(): void {
    if (!this.searchSession) return;

    const deviceIds = this.searchSession.getDeviceIds();
    console.log(`[DeviceCoordinator] Search complete, found ${deviceIds.length} device(s)`);

    // Create entries for each device
    for (const deviceId of deviceIds) {
      this.devices.set(deviceId, {
        buffer: undefined,
        presets: [],
        pingSession: new PingSession(deviceId),
      });
      this.devices.get(deviceId)!.pingSession.start();
      this.requestDeviceState(deviceId);
    }

    this.searchSession = undefined;
  }

  private queueOperation(deviceId: number, operationType: OperationType, create: () => Session): void {
    // Pause pinging during operations
    const device = this.devices.get(deviceId);
    if (device) {
      device.pingSession.setEnabled(false);
    }

    if (this.currentSession) {
      // Queue if busy
      this.pendingOperations.push({deviceId, operationType, create});
    } else {
      this.startOperation(deviceId, operationType, create());
    }
  }

  private startOperation(deviceId: number, operationType: OperationType, session: Session): void {
    console.log(`[DeviceCoordinator] Starting operation for device ${deviceId}`);
    this.currentSession = session;
    this.currentDeviceId = deviceId;
    this.currentOperationType = operationType;
    this.operationProgress = 0;
  }

  private checkOperationComplete(): void {
    if (!this.currentSession) return;

    const session = this.currentSession;
    const deviceId = this.currentDeviceId!;

    // Update progress based on session type
    if (session instanceof EditBufferSession) {
      const status = session.getStatus();
      this.operationProgress = status.progress;

      if (session.isComplete()) {
        const device = this.devices.get(deviceId);
        if (device) {
          device.buffer = session.getBuffer();
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

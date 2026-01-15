/**
 * React hook for DeviceCoordinator.
 *
 * Thin wrapper around DeviceCoordinator that:
 * - Has only `connection` as a dependency
 * - Syncs state from coordinator in tick loop
 * - Provides stable callbacks
 */

import {useState, useEffect, useCallback, useRef} from 'react';
import {
  DeviceCoordinator,
  CoordinatorPhase,
  OperationType,
  parseMessage,
  type ParameterTarget,
  type State,
  type ParsedPreset,
  type DcxConnection,
} from 'dcx-parser';

/**
 * Per-device data exposed to UI.
 */
export interface DeviceUIData {
  state: State | undefined;
  presets: ParsedPreset[];
}

/**
 * Hook return type.
 */
export interface UseDeviceCoordinatorReturn {
  // Connection phase
  phase: CoordinatorPhase;
  operationType: OperationType;
  progress: number;
  isLoading: boolean;

  // Device data
  deviceIds: number[];
  devices: Map<number, DeviceUIData>;

  // Convenience for single-device UI
  primaryDeviceId: number | undefined;
  primaryState: State | undefined;
  primaryPresets: ParsedPreset[];

  // Operations
  requestDeviceState: (deviceId: number) => void;
  requestPresets: (deviceId: number) => void;
  uploadPresets: (deviceId: number, data: Uint8Array) => void;
  loadPresetsFromFile: (deviceId: number, data: Uint8Array) => void;
  sendParameterChange: (
    deviceId: number,
    target: ParameterTarget,
    value: boolean | string | number,
  ) => void;
}

/**
 * Hook for device coordination.
 */
export function useDeviceCoordinator(
  connection: DcxConnection | undefined,
): UseDeviceCoordinatorReturn {
  // Coordinator instance (stable across renders)
  const coordinatorRef = useRef<DeviceCoordinator>(new DeviceCoordinator());

  // State synced from coordinator
  const [phase, setPhase] = useState<CoordinatorPhase>(CoordinatorPhase.DISCONNECTED);
  const [operationType, setOperationType] = useState<OperationType>(OperationType.NONE);
  const [progress, setProgress] = useState(0);
  const [deviceIds, setDeviceIds] = useState<number[]>([]);
  const [devices, setDevices] = useState<Map<number, DeviceUIData>>(new Map());

  // Single effect for connection lifecycle
  useEffect(() => {
    if (!connection) {
      setPhase(CoordinatorPhase.DISCONNECTED);
      return;
    }

    const coordinator = coordinatorRef.current;

    // Subscribe to messages
    const unsubscribe = connection.onMessage((data: Uint8Array) => {
      const parsed = parseMessage(data);
      if (parsed) {
        coordinator.processResponse(parsed);
      }
    });

    // Tick interval - sync state and flush messages
    const interval = setInterval(() => {
      coordinator.tick(Date.now());

      // Sync state from coordinator to React
      setPhase(coordinator.getPhase());
      setOperationType(coordinator.getOperationType());
      setProgress(coordinator.getProgress());
      setDeviceIds(coordinator.getDeviceIds());
      setDevices(coordinator.getDevicesSnapshot());

      // Flush messages
      let msg = coordinator.getNextMessage();
      while (msg) {
        connection.send(msg).catch(() => {
          console.error('[useDeviceCoordinator] Failed to send message');
        });
        msg = coordinator.getNextMessage();
      }
    }, 250);

    // Start search
    coordinator.connect();

    return () => {
      unsubscribe();
      clearInterval(interval);
      coordinator.disconnect();
    };
  }, [connection]); // ONLY connection as dependency

  // Stable callbacks
  const requestDeviceState = useCallback((deviceId: number) => {
    coordinatorRef.current.requestDeviceState(deviceId);
  }, []);

  const requestPresets = useCallback((deviceId: number) => {
    coordinatorRef.current.requestPresets(deviceId);
  }, []);

  const uploadPresets = useCallback((deviceId: number, data: Uint8Array) => {
    coordinatorRef.current.uploadPresets(deviceId, data);
  }, []);

  const loadPresetsFromFile = useCallback((deviceId: number, data: Uint8Array) => {
    coordinatorRef.current.loadPresetsFromFile(deviceId, data);
  }, []);

  const sendParameterChange = useCallback(
    (deviceId: number, target: ParameterTarget, value: boolean | string | number) => {
      coordinatorRef.current.sendParameterChange(deviceId, target, value);
    },
    [],
  );

  // Convenience: primary device (first one found)
  const primaryDeviceId = deviceIds[0];
  const primaryData = primaryDeviceId !== undefined ? devices.get(primaryDeviceId) : undefined;

  return {
    phase,
    operationType,
    progress,
    isLoading: phase === CoordinatorPhase.BUSY,

    deviceIds,
    devices,

    primaryDeviceId,
    primaryState: primaryData?.state,
    primaryPresets: primaryData?.presets ?? [],

    requestDeviceState,
    requestPresets,
    uploadPresets,
    loadPresetsFromFile,
    sendParameterChange,
  };
}

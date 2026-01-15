/**
 * App component - Root layout with DeviceContext provider.
 */
import { useState, useEffect, createContext, useContext, useMemo } from 'react';
import { Outlet, useRouter } from '@tanstack/react-router';
import { ToastContainer } from 'react-toastify';
import {
  parseMessage,
  parseStatus,
  type State,
  type DcxConnection,
  type Status,
  type ParsedPreset,
  CoordinatorPhase,
  OperationType,
} from 'dcx-parser';
import 'bootswatch/dist/slate/bootstrap.min.css';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import { useDeviceCoordinator } from '@/hooks/useDeviceCoordinator.js';
import ConfigNavigation from '@/components/ConfigNavigation.js';
import DeviceNavigation from '@/components/DeviceNavigation.js';
import Inputs from '@/pages/Inputs.js';
import Outputs from '@/pages/Outputs.js';

// Device context type
type DeviceContextType = {
  device: State | undefined;
  isBlocking: boolean;
  phase: CoordinatorPhase;
  presets: ParsedPreset[];
  presetProgress: number;
  isDownloadingPresets: boolean;
  requestPresets: () => void;
  primaryDeviceId: number | undefined;
};

const DeviceContext = createContext<DeviceContextType | undefined>(undefined);

export function useDeviceContext() {
  const context = useContext(DeviceContext);
  if (!context) {
    throw new Error('useDeviceContext must be used within a DeviceProvider');
  }

  return context;
}

/**
 * Root app component with device session and context.
 */
export function App() {
  const router = useRouter();
  const { connection } = router.options.context as { connection: DcxConnection | undefined };
  const [isBlocking, setIsBlocking] = useState(true);

  // Unified device coordinator - handles search, sync, ping, preset download
  const {
    phase,
    operationType,
    primaryState: device,
    progress,
    primaryPresets: presets,
    primaryDeviceId,
    requestPresets: requestPresetsInternal,
  } = useDeviceCoordinator(connection);

  // Wrap requestPresets to use primary device
  const requestPresets = useMemo(() => {
    return () => {
      if (primaryDeviceId !== undefined) {
        requestPresetsInternal(primaryDeviceId);
      }
    };
  }, [primaryDeviceId, requestPresetsInternal]);

  const [free, setFree] = useState<number | undefined>(undefined);
  const [inputs, setInputs] = useState<Status['inputs'] | undefined>(undefined);
  const [outputs, setOutputs] = useState<Status['outputs'] | undefined>(
    undefined,
  );

  useEffect(() => {
    if (!connection) return;

    const unsubscribe = connection.onMessage((data: Uint8Array) => {
      const parsed = parseMessage(data);
      if (!parsed) return;

      // Status messages contain channel levels and free memory
      if (parsed.type === 'status') {
        const parsedStatus = parseStatus(data);
        if (parsedStatus.free !== undefined) setFree(parsedStatus.free);
        if (parsedStatus.inputs !== undefined) setInputs(parsedStatus.inputs);
        if (parsedStatus.outputs !== undefined)
          setOutputs(parsedStatus.outputs);
      }
    });

    return unsubscribe;
  }, [connection]);

  const handleBlockingChange = () => {
    setIsBlocking((previous) => !previous);
  };

  const contextValue = useMemo(
    () => ({
      device,
      isBlocking,
      phase,
      presets,
      presetProgress: progress,
      isDownloadingPresets: operationType === OperationType.BACKUP_PRESETS,
      requestPresets,
      primaryDeviceId,
    }),
    [device, isBlocking, phase, presets, progress, operationType, requestPresets, primaryDeviceId],
  );

  return (
    <DeviceContext.Provider value={contextValue}>
      <div>
        {device && inputs && outputs ? (
          <DeviceNavigation
            device={device}
            isBlocking={isBlocking}
            inputs={inputs}
            outputs={outputs}
            onBlockingChange={handleBlockingChange}
          />
        ) : undefined}
        <div className="container">
          <Outlet />
          <div className="mt-5 mb-5 p-3 border rounded bg-dark border-secondary">
            <details>
              <summary className="text-secondary cursor-pointer">
                Debug: Device State JSON
              </summary>
              <pre
                className="mt-3 text-info small"
                style={{ maxHeight: '400px', overflow: 'auto' }}
              >
                {JSON.stringify(device, undefined, 2)}
              </pre>
            </details>
          </div>
        </div>
        <ConfigNavigation
          device={device ?? undefined}
          free={free ?? undefined}
        />
        <ToastContainer />
      </div>
    </DeviceContext.Provider>
  );
}

/**
 * Wrapper for Inputs page - gets device from context.
 */
export function InputsWrapper() {
  const { device, isBlocking } = useDeviceContext();
  if (!device) return undefined;
  return <Inputs device={device} isBlocking={isBlocking} />;
}

/**
 * Wrapper for Outputs page - gets device from context.
 */
export function OutputsWrapper() {
  const { device, isBlocking } = useDeviceContext();
  if (!device) return undefined;
  return <Outputs device={device} isBlocking={isBlocking} />;
}

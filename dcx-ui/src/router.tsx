import {
  createRootRouteWithContext,
  createRoute,
  createRouter,
  Outlet,
  Navigate,
  useRouter,
} from '@tanstack/react-router';
import {useState, useEffect, createContext, useContext, useMemo} from 'react';
import {ToastContainer} from 'react-toastify';
import {
  parseMessage,
  parseStatus,
  type State,
  type DcxConnection,
  type Status,
} from 'dcx-parser';
import 'bootswatch/dist/slate/bootstrap.min.css';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import {useDcxState} from '@/hooks/useDcxState.js';
import ConfigNavigation from '@/components/ConfigNavigation.js';
import DeviceNavigation from '@/components/DeviceNavigation.js';
import Inputs from '@/pages/Inputs.js';
import Outputs from '@/pages/Outputs.js';
import Presets from '@/pages/Presets.js';

type RouterContext = {
  connection: DcxConnection | undefined;
};

type DeviceContextType = {
  device: State | undefined;
  isBlocking: boolean;
};

const DeviceContext = createContext<DeviceContextType | undefined>(undefined);

export function useDeviceContext() {
  const context = useContext(DeviceContext);
  if (!context) {
    throw new Error('useDeviceContext must be used within a DeviceProvider');
  }

  return context;
}

const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
});

function RootComponent() {
  const router = useRouter();
  const {connection} = router.options.context;
  const [isBlocking, setIsBlocking] = useState(true);
  const {state: device, sync, isLoading} = useDcxState(connection);

  const [free, setFree] = useState<number | undefined>(undefined);
  const [inputs, setInputs] = useState<Status['inputs'] | undefined>(undefined);
  const [outputs, setOutputs] = useState<Status['outputs'] | undefined>(
    undefined,
  );

  useEffect(() => {
    if (connection && !device && !isLoading) {
      void sync();
    }
  }, [connection, device, isLoading, sync]);

  useEffect(() => {
    if (!connection) return;

    const unsubscribe = connection.onMessage((data: Uint8Array) => {
      const parsed = parseMessage(data);
      if (!parsed) return;

      if (parsed.type === 'unknown' && data[6] === 0x04) {
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
    () => ({device, isBlocking}),
    [device, isBlocking],
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
                style={{maxHeight: '400px', overflow: 'auto'}}
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

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => <Navigate to="/inputs" />,
});

const inputsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'inputs',
});

const inputsIndexRoute = createRoute({
  getParentRoute: () => inputsRoute,
  path: '/',
  component: () => <InputsWrapper />,
});

const inputsEqualizersRoute = createRoute({
  getParentRoute: () => inputsRoute,
  path: 'equalizers/$channelId',
  component: () => <InputsWrapper />,
});

const inputsDynamicEqualizersRoute = createRoute({
  getParentRoute: () => inputsRoute,
  path: 'dynamic-equalizers',
  component: () => <InputsWrapper />,
});

const inputsTabRoute = createRoute({
  getParentRoute: () => inputsRoute,
  path: '$tab',
  component: () => <InputsWrapper />,
});

function InputsWrapper() {
  const {device, isBlocking} = useDeviceContext();
  if (!device) return undefined;
  return <Inputs device={device} isBlocking={isBlocking} />;
}

const outputsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'outputs',
});

const outputsIndexRoute = createRoute({
  getParentRoute: () => outputsRoute,
  path: '/',
  component: () => <OutputsWrapper />,
});

const outputsEqualizersRoute = createRoute({
  getParentRoute: () => outputsRoute,
  path: 'equalizers/$channelId',
  component: () => <OutputsWrapper />,
});

const outputsDynamicEqualizersRoute = createRoute({
  getParentRoute: () => outputsRoute,
  path: 'dynamic-equalizers',
  component: () => <OutputsWrapper />,
});

const outputsTabRoute = createRoute({
  getParentRoute: () => outputsRoute,
  path: '$tab',
  component: () => <OutputsWrapper />,
});

function OutputsWrapper() {
  const {device, isBlocking} = useDeviceContext();
  if (!device) return undefined;
  return <Outputs device={device} isBlocking={isBlocking} />;
}

const presetsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'presets',
  component: () => <Presets />,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  inputsRoute.addChildren([
    inputsIndexRoute,
    inputsEqualizersRoute,
    inputsDynamicEqualizersRoute,
    inputsTabRoute,
  ]),
  outputsRoute.addChildren([
    outputsIndexRoute,
    outputsEqualizersRoute,
    outputsDynamicEqualizersRoute,
    outputsTabRoute,
  ]),
  presetsRoute,
]);

export const router = createRouter({
  routeTree,
  context: {
    connection: undefined as DcxConnection | undefined,
  },
});

declare module '@tanstack/react-router' {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Register {
    router: typeof router;
  }
}

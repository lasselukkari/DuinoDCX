import {
  createContext,
  useContext,
  useState,
  type ReactNode,
  type Dispatch,
  type SetStateAction,
} from 'react';
import {type State, type Device} from './dcx2496/parser.ts';

type DeviceStateContextValue = {
  device: State | undefined;
  setDevice: Dispatch<SetStateAction<State | undefined>>;
  devices: Device[];
  setDevices: Dispatch<SetStateAction<Device[]>>;
  selected: number | undefined;
  setSelected: Dispatch<SetStateAction<number | undefined>>;
};

const DeviceStateContext = createContext<DeviceStateContextValue | undefined>(
  null,
);

export const useDeviceState = () => {
  const context = useContext(DeviceStateContext);
  if (!context) {
    throw new Error('useDeviceState must be used within a DeviceStateProvider');
  }

  return context;
};

export function DeviceStateProvider({
  children,
}: {
  readonly children: ReactNode;
}) {
  const [device, setDevice] = useState<State | undefined>(undefined);
  const [devices, setDevices] = useState<Device[]>([]);
  const [selected, setSelected] = useState<number | undefined>(undefined);

  const value = {
    device,
    setDevice,
    devices,
    setDevices,
    selected,
    setSelected,
  };

  return (
    <DeviceStateContext.Provider value={value}>
      {children}
    </DeviceStateContext.Provider>
  );
}

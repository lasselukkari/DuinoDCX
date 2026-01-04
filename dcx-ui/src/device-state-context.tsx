import {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
  type ReactNode,
  type Dispatch,
  type SetStateAction,
} from 'react';
import type { type State, type Device } from 'dcx-parser';

type DeviceStateContextValue = {
  device: State | undefined;
  setDevice: Dispatch<SetStateAction<State | undefined>>;
  devices: Device[];
  setDevices: Dispatch<SetStateAction<Device[]>>;
  selected: number | undefined;
  setSelected: Dispatch<SetStateAction<number | undefined>>;
  presets: Record<number, {name: string; isEmpty: boolean}>;
  updatePreset: (slot: number, data: {name: string; isEmpty: boolean}) => void;
  rawPresetPages: Record<number, Uint8Array>;
  setRawPresetPage: (pageIndex: number, data: Uint8Array) => void;
  clearPresetPages: () => void;
};

const DeviceStateContext = createContext<DeviceStateContextValue | undefined>(
  undefined,
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
  const [presets, setPresets] = useState<
    Record<number, {name: string; isEmpty: boolean}>
  >({});
  const [rawPresetPages, setRawPresetPages] = useState<
    Record<number, Uint8Array>
  >({});

  const updatePreset = useCallback(
    (slot: number, data: {name: string; isEmpty: boolean}) => {
      setPresets((previous) => ({
        ...previous,
        [slot]: data,
      }));
    },
    [],
  );

  const setRawPresetPage = useCallback(
    (pageIndex: number, data: Uint8Array) => {
      setRawPresetPages((previous) => ({
        ...previous,
        [pageIndex]: data,
      }));
    },
    [],
  );

  const clearPresetPages = useCallback(() => {
    setRawPresetPages({});
  }, []);

  const value = useMemo(
    () => ({
      device,
      setDevice,
      devices,
      setDevices,
      selected,
      setSelected,
      presets,
      updatePreset,
      rawPresetPages,
      setRawPresetPage,
      clearPresetPages,
    }),
    [
      device,
      devices,
      selected,
      presets,
      updatePreset,
      rawPresetPages,
      setRawPresetPage,
      clearPresetPages,
    ],
  );

  return (
    <DeviceStateContext.Provider value={value}>
      {children}
    </DeviceStateContext.Provider>
  );
}

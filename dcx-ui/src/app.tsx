/* eslint-disable no-void */
import React, { useState, useCallback, useRef } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import cloneDeep from 'lodash.clonedeep';
import 'bootswatch/dist/slate/bootstrap.css';
import 'react-toastify/dist/ReactToastify.css';
import ConfigNavigation from './config-navigation.tsx';
import Device from './device.tsx';
import DeviceNavigation from './device-navigation.tsx';
import Parser, {
  type State,
  type Device as DeviceType,
} from './dcx2496/parser.ts';
import './app.css';
import { useDeviceEvents } from './hooks/use-device-events.ts';
import constants from './dcx2496/constants.ts';

function App() {
  const [page, setPage] = useState('inputs');
  const [isBlocking, setIsBlocking] = useState(true);
  const [device, setDevice] = useState<State | undefined>(undefined);
  const [devices, setDevices] = useState<DeviceType[]>([]);
  const [selected, setSelected] = useState<number | undefined>(undefined);
  const [free, setFree] = useState<number | undefined>(undefined);

  const [inputs, setInputs] = useState<any[] | undefined>(undefined);
  const [outputs, setOutputs] = useState<any[] | undefined>(undefined);

  // Store partial dump parts
  const dumpPartsRef = useRef<Record<number, Uint8Array>>({});

  const onSearchResponse = useCallback((data: Uint8Array) => {
    // Parser.parseDevices expects concatenated messages or single message
    // It returns an array of devices
    const foundDevices = Parser.parseDevices(data);
    setDevices((prev) => {
      // Merge found devices with existing list (avoid duplicates)
      const newDevices = [...prev];
      for (const d of foundDevices) {
        const index = newDevices.findIndex((existing) => existing.id === d.id);
        if (index >= 0) {
          newDevices[index] = d;
        } else {
          newDevices.push(d);
        }
      }
      return newDevices;
    });
  }, []);

  const onPingResponse = useCallback((data: Uint8Array) => {
    // Parse status (inputs/outputs metering)
    const slicedData = data.slice();
    const parsedStatus = Parser.parseStatus(slicedData.buffer);

    if (parsedStatus.free !== undefined) setFree(parsedStatus.free);
    if (parsedStatus.inputs !== undefined) setInputs(parsedStatus.inputs);
    if (parsedStatus.outputs !== undefined) setOutputs(parsedStatus.outputs);

    // Also use ping to verify selected device connection
    const idByte = data[constants.ID_BYTE];
    if (selected !== undefined && idByte === selected) {
      toast.dismiss('no-connection');
    }
  }, [selected]);


  const onDumpResponse = useCallback((data: Uint8Array) => {
    // Manually extract part number from index 12 (verified via logs)
    const PART_INDEX = 12;
    const part = data[PART_INDEX];

    // Store a COPY of the data to avoid buffer overwrites
    dumpPartsRef.current[part] = data.slice();

    if (dumpPartsRef.current[0] && dumpPartsRef.current[1]) {
      const newState = Parser.parseDevice([dumpPartsRef.current[0], dumpPartsRef.current[1]]);
      // Parser.parseDevice doesn't set isReady (parseState does). 
      // Since we just received a full dump from the selected device, it IS ready.
      newState.isReady = true;
      setDevice(newState);

      // Also update selected ID from the message
      const id = data[constants.ID_BYTE];
      setSelected(id);
    }
  }, []);

  const onDirectCommand = useCallback((data: Uint8Array) => {
    const deltas = Parser.parseDirectCommand(data);

    setDevice((currentDevice) => {
      if (!currentDevice) return currentDevice;
      const newDevice = cloneDeep(currentDevice);

      for (const delta of deltas) {
        const { group, channelId, eq, property, value } = delta;

        if (group === 'setup') {
          (newDevice.setup as any)[property] = value;
        } else if (channelId) {
          // inputs or outputs
          if (eq) {
            // EQ parameter
            (newDevice[group] as any)[channelId].eqs[eq][property] = value;
          } else {
            // Channel parameter
            (newDevice[group] as any)[channelId][property] = value;
          }
        }
      }
      return newDevice;
    });
  }, []);

  // Hook handles connection and events
  useDeviceEvents({
    onSearchResponse,
    onPingResponse,
    onDumpResponse,
    onDirectCommand
  });

  const handleBlockingChange = () => {
    setIsBlocking((previous) => !previous);
  };

  const handleDeviceUpdate = (commands: unknown) => {
    void (async () => {
      const oldDevice = cloneDeep(device);
      const newDevice = cloneDeep(device);

      // Applying updates locally first
      setDevice(newDevice);

      if (selected === undefined) return;
      if (!newDevice) return;

      const data = Parser.serializeCommands(selected, newDevice, commands);

      // Re-set device effectively (ensuring new object reference)
      setDevice({ ...newDevice });

      try {
        const blob = new Blob([data as any]);

        await fetch(`/api/commands`, {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/binary' },
          body: blob,
        });
      } catch {
        setDevice(oldDevice);
        toast.error(`Failed to update settings.`, {
          position: 'bottom-left',
          toastId: 'failed-command',
          autoClose: 5000,
        });
      }
    })();
  };

  const handleDeviceSelect = (newSelected: number) => {
    void (async () => {
      const oldSelected = selected;
      setSelected(newSelected);
      // Clear current device state while switching
      setDevice(undefined);
      dumpPartsRef.current = {};

      try {
        await fetch(`/api/selected`, {
          method: 'PUT',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'text/plain' },
          body: newSelected.toString(),
        });
      } catch {
        setSelected(oldSelected);
        toast.error(`Failed set selected device.`, {
          position: 'bottom-left',
          toastId: 'failed-select',
          autoClose: 5000,
        });
      }
    })();
  };

  const handlePageChange = (newPage: string | undefined) => {
    if (newPage) {
      setPage(newPage);
      window.scrollTo(0, 0);
    }
  };

  // Initial fetch for state to get quick start (optional, but good for UX)
  // Actually, SSE should send initial state if backend implementation supports it?
  // Our backend sends "getState" logic which includes full dump.
  // But wait, SSE only broadcasts *changes* or *updates* from serial port.
  // Docs say: "Modify the backend to send received MIDI messages ... to all connected SSE clients."
  // When a user connects, do they get the current state?
  // The SSE connection just streams what comes from serial.
  // If the device isn't talking, we get nothing.
  // We should trigger a state fetch or "Get State" on mount so the backend requests it from device, 
  // and then the response is broadcast to SSE.

  // Initial state is handled by SSE connection trigger on backend
  React.useEffect(() => {
    // No explicit fetch needed
  }, []);

  return (
    <div>
      {device && inputs && outputs ? (
        <DeviceNavigation
          device={device}
          isBlocking={isBlocking}
          page={page}
          inputs={inputs}
          outputs={outputs}
          onChange={handleDeviceUpdate}
          onPageChange={handlePageChange}
          onBlockingChange={handleBlockingChange}
        />
      ) : null}
      {device ? (
        <Device
          isBlocking={isBlocking}
          device={device}
          page={page}
          onChange={handleDeviceUpdate}
        />
      ) : null}
      <ConfigNavigation
        device={device ?? undefined}
        devices={devices}
        selected={selected ?? undefined}
        free={free ?? undefined}
        onChange={handleDeviceUpdate}
        onSelectDevice={handleDeviceSelect}
      />
      <ToastContainer />
    </div>
  );
}

export default App;

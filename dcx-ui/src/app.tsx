/* eslint-disable no-void */
import React, { useState, useEffect, useCallback, useRef } from 'react';
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

function App() {
  const [page, setPage] = useState('inputs');
  const [isBlocking, setIsBlocking] = useState(true);
  const [device, setDevice] = useState<State | undefined>(undefined);
  const [devices, setDevices] = useState<DeviceType[]>([]);
  const [selected, setSelected] = useState<number | undefined>(undefined);
  const [free, setFree] = useState<number | undefined>(undefined);

  const [inputs, setInputs] = useState<any[] | undefined>(undefined);

  const [outputs, setOutputs] = useState<any[] | undefined>(undefined);

  const pollingStateRef = useRef(false);
  const pollingStatusRef = useRef(false);
  const invalidateUntilRef = useRef<Date | undefined>(undefined);

  const pollState = useCallback(async () => {
    if (pollingStateRef.current) return;

    pollingStateRef.current = true;

    try {
      const response = await fetch(`api/state`, { credentials: 'same-origin' });
      if (!response.ok) {
        throw new Error(response.statusText);
      }

      if (
        invalidateUntilRef.current &&
        invalidateUntilRef.current > new Date()
      ) {
        return;
      }

      const buffer = await response.arrayBuffer();
      const parsedState = Parser.parseState(buffer);

      // Update state based on parsed data
      // note: Parser.parseState likely returns an object with keys matching state variables
      if (parsedState.device !== undefined) setDevice(parsedState.device);
      if (parsedState.devices !== undefined) setDevices(parsedState.devices);
      if (parsedState.selected !== undefined) setSelected(parsedState.selected);

      // Inputs/outputs in State are settings (Record<string, Channel>).
      // inputs/outputs in Status are levels (Array<ChannelLevel>).
      // DeviceNavigation expects levels.
      // We should NOT set 'inputs' from parsedState (settings).

      toast.dismiss('no-connection');
    } catch {
      if (!toast.isActive('no-connection')) {
        toast.error(`Check network connection.`, {
          position: 'bottom-left',
          toastId: 'no-connection',
          autoClose: false,
        });
      }
    } finally {
      pollingStateRef.current = false;
    }
  }, []);

  const pollStatus = useCallback(async () => {
    if (pollingStatusRef.current) return;

    pollingStatusRef.current = true;
    try {
      const response = await fetch(`api/status`, { credentials: 'same-origin' });
      if (!response.ok) {
        throw new Error(response.statusText);
      }

      const buffer = await response.arrayBuffer();
      const parsedStatus = Parser.parseStatus(buffer);

      // Update status related state
      if (parsedStatus.free !== undefined) setFree(parsedStatus.free);
      if (parsedStatus.inputs !== undefined) setInputs(parsedStatus.inputs);
      if (parsedStatus.outputs !== undefined) setOutputs(parsedStatus.outputs);
      // ParsedStatus only contains inputs, outputs (levels), and free.
      // It does not contain device settings.
      // if (parsedStatus.device)
      //   setDevice(
      //     (previous: State | undefined) =>
      //       ({...previous, ...parsedStatus.device}) as State,
      //   );

      toast.dismiss('no-connection');
    } catch {
      if (!toast.isActive('no-connection')) {
        toast.error(`Check network connection.`, {
          position: 'bottom-left',
          toastId: 'no-connection',
          autoClose: false,
        });
      }
    } finally {
      pollingStatusRef.current = false;
    }
  }, []);

  useEffect(() => {
    void pollState();
    void pollStatus();
    const stateTimer = setInterval(() => void pollState(), 1000);
    const statusTimer = setInterval(() => void pollStatus(), 500);

    return () => {
      clearInterval(stateTimer);
      clearInterval(statusTimer);
    };
  }, [pollState, pollStatus]);

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

      const invalidateUntil = new Date();
      invalidateUntil.setSeconds(invalidateUntil.getSeconds() + 2);
      invalidateUntilRef.current = invalidateUntil;

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

import React, {useState, useEffect, useCallback, useRef} from 'react';
import {ToastContainer, toast} from 'react-toastify';
import cloneDeep from 'lodash.clonedeep';
import ConfigNavigation from './config-navigation.tsx';
import Device from './device.tsx';
import DeviceNavigation from './device-navigation.tsx';
import Parser, {type State, type Device as DeviceType} from './dcx2496/parser';
import 'bootswatch/dist/slate/bootstrap.css';
import 'react-toastify/dist/ReactToastify.css';
import './app.css';

const App: React.FC = () => {
  const [page, setPage] = useState('inputs');
  const [isBlocking, setIsBlocking] = useState(true);
  const [device, setDevice] = useState<State | undefined>(null);
  const [devices, setDevices] = useState<DeviceType[]>([]);
  const [selected, setSelected] = useState<number | undefined>(null);
  const [free, setFree] = useState<number | undefined>(null);
  const [inputs, setInputs] = useState<unknown>(null);
  const [outputs, setOutputs] = useState<unknown>(null);

  const pollingStateRef = useRef(false);
  const pollingStatusRef = useRef(false);
  const invalidateUntilRef = useRef<Date | undefined>(null);

  const pollState = useCallback(async () => {
    if (pollingStateRef.current) return;

    pollingStateRef.current = true;

    try {
      const response = await fetch(`api/state`, {credentials: 'same-origin'});
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
      if (parsedState.device) setDevice(parsedState.device);
      if (parsedState.devices) setDevices(parsedState.devices);
      if (parsedState.selected) setSelected(parsedState.selected);
      if (parsedState.free) setFree(parsedState.free);
      if (parsedState.inputs) setInputs(parsedState.inputs);
      if (parsedState.outputs) setOutputs(parsedState.outputs);

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
      const response = await fetch(`api/status`, {credentials: 'same-origin'});
      if (!response.ok) {
        throw new Error(response.statusText);
      }

      const buffer = await response.arrayBuffer();
      const parsedStatus = Parser.parseStatus(buffer);

      // Update status related state
      if (parsedStatus.device)
        setDevice(
          (previous: State | undefined) =>
            ({...previous, ...parsedStatus.device}) as State,
        );

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
    pollState();
    pollStatus();
    const stateTimer = setInterval(pollState, 1000);
    const statusTimer = setInterval(pollStatus, 500);

    return () => {
      clearInterval(stateTimer);
      clearInterval(statusTimer);
    };
  }, [pollState, pollStatus]);

  const handleBlockingChange = () => {
    setIsBlocking((previous) => !previous);
  };

  const handleDeviceUpdate = async (commands: unknown) => {
    const oldDevice = cloneDeep(device);
    const newDevice = cloneDeep(device);

    // Applying updates locally first
    setDevice(newDevice);

    const data = Parser.serializeCommands(selected, newDevice, commands);

    // Re-set device effectively (no-op if identical, but keeps flow)
    setDevice(newDevice);

    const invalidateUntil = new Date();
    invalidateUntil.setSeconds(invalidateUntil.getSeconds() + 2);
    invalidateUntilRef.current = invalidateUntil;

    try {
      await fetch(`/api/commands`, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {'Content-Type': 'application/binary'},
        body: data,
      });
    } catch {
      setDevice(oldDevice);
      toast.error(`Failed to update settings.`, {
        position: 'bottom-left',
        toastId: 'failed-command',
        autoClose: 5000,
      });
    }
  };

  const handleDeviceSelect = async (newSelected: number) => {
    const oldSelected = selected;
    setSelected(newSelected);

    try {
      await fetch(`/api/selected`, {
        method: 'PUT',
        credentials: 'same-origin',
        headers: {'Content-Type': 'text/plain'},
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
      <Device
        isBlocking={isBlocking}
        device={device}
        page={page}
        onChange={handleDeviceUpdate}
      />
      <ConfigNavigation
        device={device}
        devices={devices}
        selected={selected}
        free={free}
        onChange={handleDeviceUpdate}
        onSelectDevice={handleDeviceSelect}
      />
      <ToastContainer />
    </div>
  );
};

export default App;

import { useState, useCallback, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'bootswatch/dist/slate/bootstrap.css';
import 'react-toastify/dist/ReactToastify.css';
import ConfigNavigation from './config-navigation.js';
import Device from './device.js';
import DeviceNavigation from './device-navigation.js';
import Parser from 'dcx-parser';
import './app.css';
import constants from './dcx2496/constants.js';
import { useDcxConnection } from './connection/connection-context.js';
import type {  useDcxState  } from 'dcx-parser';
import { parseMessage } from 'dcx-parser';

function App() {
  const [page, setPage] = useState('inputs');
  const [isBlocking, setIsBlocking] = useState(true);
  const { connection } = useDcxConnection();

  // Use the new dcx-parser state hook
  const { state: device, isLoading, error } = useDcxState(connection);

  // Device discovery state (still using old Parser for device list)
  const [devices, setDevices] = useState<Array<{ id: number; version: number; name: string }>>([]);
  const [selected, setSelected] = useState<number | undefined>(undefined);
  const [free, setFree] = useState<number | undefined>(undefined);
  const [inputs, setInputs] = useState<any[] | undefined>(undefined);
  const [outputs, setOutputs] = useState<any[] | undefined>(undefined);

  // Handle incoming messages for device discovery and metering
  useEffect(() => {
    const unsubscribe = connection.onMessage((data: Uint8Array) => {
      const parsed = parseMessage(data);
      if (!parsed) return;

      // Handle search response (device discovery)
      if (parsed.command === 0x00) {
        const foundDevices = Parser.parseDevices(data);
        setDevices((previous) => {
          const newDevices = [...previous];
          for (const d of foundDevices) {
            const index = newDevices.findIndex((existing) => existing.id === d.id);
            if (index === -1) {
              newDevices.push(d);
            } else {
              newDevices[index] = d;
            }
          }
          return newDevices;
        });
      }

      // Handle ping response (metering)
      if (parsed.command === 0x04) {
        const parsedStatus = Parser.parseStatus(data.buffer as ArrayBuffer);
        if (parsedStatus.free !== undefined) setFree(parsedStatus.free);
        if (parsedStatus.inputs !== undefined) setInputs(parsedStatus.inputs);
        if (parsedStatus.outputs !== undefined) setOutputs(parsedStatus.outputs);

        const idByte = data[constants.ID_BYTE];
        if (selected !== undefined && idByte === selected) {
          toast.dismiss('no-connection');
        }
      }
    });

    return unsubscribe;
  }, [connection, selected]);

  const handleBlockingChange = () => {
    setIsBlocking((previous) => !previous);
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
          isBlocking={isBlocking}
          page={page}
          inputs={inputs}
          outputs={outputs}
          onPageChange={handlePageChange}
          onBlockingChange={handleBlockingChange}
        />
      ) : null}
      {device ? <Device isBlocking={isBlocking} page={page} /> : null}
      <ConfigNavigation
        free={free ?? undefined}
        onSelectDevice={handleDeviceSelect}
      />
      <ToastContainer />
    </div>
  );
}

export default App;

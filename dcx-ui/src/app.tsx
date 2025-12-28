import {useState, useCallback, useRef} from 'react';
import {ToastContainer, toast} from 'react-toastify';
import cloneDeep from 'lodash.clonedeep';
import 'bootswatch/dist/slate/bootstrap.css';
import 'react-toastify/dist/ReactToastify.css';
import ConfigNavigation from './config-navigation.tsx';
import Device from './device.tsx';
import DeviceNavigation from './device-navigation.tsx';
import Parser from './dcx2496/parser.ts';
import './app.css';
import {useDeviceEvents} from './hooks/use-device-events.ts';
import constants from './dcx2496/constants.ts';
import {useDeviceState} from './device-state-context.tsx';

function App() {
  const [page, setPage] = useState('inputs');
  const [isBlocking, setIsBlocking] = useState(true);
  const {device, setDevice, setDevices, selected, setSelected} =
    useDeviceState();
  const [free, setFree] = useState<number | undefined>(undefined);

  const [inputs, setInputs] = useState<any[] | undefined>(undefined);
  const [outputs, setOutputs] = useState<any[] | undefined>(undefined);

  // Store partial dump parts
  const dumpPartsRef = useRef<Record<number, Uint8Array>>({});

  const onSearchResponse = useCallback(
    (data: Uint8Array) => {
      // Parser.parseDevices expects concatenated messages or single message
      // It returns an array of devices
      const foundDevices = Parser.parseDevices(data);
      setDevices((previous) => {
        // Merge found devices with existing list (avoid duplicates)
        const newDevices = [...previous];
        for (const d of foundDevices) {
          const index = newDevices.findIndex(
            (existing) => existing.id === d.id,
          );
          if (index === -1) {
            newDevices.push(d);
          } else {
            newDevices[index] = d;
          }
        }

        return newDevices;
      });
    },
    [setDevices],
  );

  const onPingResponse = useCallback(
    (data: Uint8Array) => {
      // Parse status (inputs/outputs metering)
      const slicedData = [...data];
      const parsedStatus = Parser.parseStatus(slicedData.buffer);

      if (parsedStatus.free !== undefined) setFree(parsedStatus.free);
      if (parsedStatus.inputs !== undefined) setInputs(parsedStatus.inputs);
      if (parsedStatus.outputs !== undefined) setOutputs(parsedStatus.outputs);

      // Also use ping to verify selected device connection
      const idByte = data[constants.ID_BYTE];
      if (selected !== undefined && idByte === selected) {
        toast.dismiss('no-connection');
      }
    },
    [selected],
  );

  const onDumpResponse = useCallback(
    (data: Uint8Array) => {
      // Manually extract part number from index 12 (verified via logs)
      const PART_INDEX = 12;
      const part = data[PART_INDEX];

      // Store a COPY of the data to avoid buffer overwrites
      dumpPartsRef.current[part] = [...data];

      if (dumpPartsRef.current[0] && dumpPartsRef.current[1]) {
        const newState = Parser.parseDevice([
          dumpPartsRef.current[0],
          dumpPartsRef.current[1],
        ]);
        // Parser.parseDevice doesn't set isReady (parseState does).
        // Since we just received a full dump from the selected device, it IS ready.
        newState.isReady = true;
        setDevice(newState);

        // Also update selected ID from the message
        const id = data[constants.ID_BYTE];
        setSelected(id);
      }
    },
    [setDevice, setSelected],
  );

  const onDirectCommand = useCallback(
    (data: Uint8Array) => {
      const deltas = Parser.parseDirectCommand(data);

      setDevice((currentDevice) => {
        if (!currentDevice) return currentDevice;
        const newDevice = cloneDeep(currentDevice);

        for (const delta of deltas) {
          const {group, channelId, eq, property, value} = delta;

          if (group === 'setup') {
            (newDevice.setup as any)[property] = value;
          } else if (channelId) {
            // Inputs or outputs
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
    },
    [setDevice],
  );

  // Hook handles connection and events
  useDeviceEvents({
    onSearchResponse,
    onPingResponse,
    onDumpResponse,
    onDirectCommand,
  });

  const handleBlockingChange = () => {
    setIsBlocking((previous) => !previous);
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

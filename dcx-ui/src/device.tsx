import React, {useRef} from 'react';
import Spinner from 'react-bootstrap/Spinner';
import {toast} from 'react-toastify';
import Outputs from './outputs.tsx';
import Inputs from './inputs.tsx';
import Presets from './presets/index.tsx';
import {useDeviceState} from './device-state-context.tsx';
import {useDeviceEvents} from './hooks/use-device-events.ts';
import {RestoreProcess} from './dcx2496/restore-process.ts';

type Props = {
  readonly isBlocking: boolean;
  readonly page: string;
};

function Device({isBlocking, page}: Props) {
  const {device} = useDeviceState();
  const [showWarning, setShowWarning] = React.useState(false);
  const restoreProcessRef = useRef<RestoreProcess | undefined>(undefined);

  const clientId = useDeviceEvents({
    onAckResponse(data) {
      restoreProcessRef.current?.handleIncomingSysex(data);
    },
    onOtherResponse(data) {
      restoreProcessRef.current?.handleIncomingSysex(data);
    },
    onSearchResponse(data) {
      restoreProcessRef.current?.handleIncomingSysex(data);
    },
    onPageDumpResponse(_data) {
      // Page dumps are now handled globally in App.tsx -> DeviceStateContext
      // We ignore them here to avoid conflicts or redundant processing
    },
    onPingResponse: undefined,
    onDirectCommand: undefined,
  });

  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    if (device?.isReady) {
      setShowWarning(false);
    } else {
      timer = setTimeout(() => {
        setShowWarning(true);
      }, 5000);
    }

    return () => {
      clearTimeout(timer);
    };
  }, [device?.isReady]);

  const displayIfPage = (name: string, exected: string) => ({
    display: name === exected ? 'block' : 'none',
  });

  const sendSysex = async (data: Uint8Array) => {
    try {
      await fetch('/api/sysex', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
          'X-Client-Id': clientId,
        },
        body: data as unknown as BodyInit,
      });
    } catch (error: unknown) {
      console.error('Failed to send SysEx', error);
      toast.error('Failed to send data to device');
      restoreProcessRef.current?.cancel();
    }
  };

  const handleBulkRestore = async (
    backup: Uint8Array,
    onProgress: (slot: number) => void,
  ): Promise<void> => {
    try {
      if (restoreProcessRef.current) return;

      const buffer = backup.buffer.slice(
        backup.byteOffset,
        backup.byteOffset + backup.byteLength,
      ) as ArrayBuffer;
      const process = new RestoreProcess(buffer);
      restoreProcessRef.current = process;

      await process.start(sendSysex, (curr, total) => {
        // Restore process gives 0-100 progress directly
        // Presets UI for restore expects percentage 0-100
        onProgress(Math.round((curr / total) * 100));
      });

      toast.success('Restore Completed Successfully!');
    } catch (error: unknown) {
      console.error(error);
      const message = error instanceof Error ? error.message : String(error);
      toast.error(`Restore Failed: ${message}`);
    } finally {
      restoreProcessRef.current = undefined;
    }
  };

  if (!device?.isReady) {
    return (
      <div
        className="text-center content-loader"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
        }}
      >
        <Spinner animation="border" variant="primary" />
        <h5 className="text-center mt-3">Synchronizing…</h5>
        {showWarning ? (
          <p className="text-muted mt-2" style={{maxWidth: '300px'}}>
            Still searching? Check RS232 cabling and Device ID.
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="container">
      <div style={displayIfPage(page, 'inputs')}>
        <Inputs isBlocking={isBlocking} />
      </div>
      <div style={displayIfPage(page, 'outputs')}>
        <Outputs isBlocking={isBlocking} />
      </div>
      <div style={displayIfPage(page, 'presets')}>
        <Presets onBulkRestore={handleBulkRestore} />
      </div>
    </div>
  );
}

export default React.memo(Device);

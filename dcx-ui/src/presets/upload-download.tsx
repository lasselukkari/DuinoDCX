import React, {useState, useRef} from 'react';
import Button from 'react-bootstrap/Button';
import ProgressBar from 'react-bootstrap/ProgressBar';
import {toast} from 'react-toastify';
import {RestoreProcess} from '../dcx2496/restore-process';
import {BackupProcess} from '../dcx2496/backup-process';
import {useDeviceEvents} from '../hooks/use-device-events';

type Props = {
  readonly deviceId?: number;
};

export function UploadDownload({deviceId = 0}: Props) {
  const [isRestoring, setIsRestoring] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const restoreProcessRef = useRef<RestoreProcess | undefined>(null);
  const backupProcessRef = useRef<BackupProcess | undefined>(null);

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
    onPageDumpResponse(data) {
      // Route page dump responses to backup process
      backupProcessRef.current?.handleIncomingSysex(data);
    },
    onPingResponse: undefined,
    onDirectCommand: undefined,
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
    } catch (error) {
      console.error('Failed to send SysEx', error);
      toast.error('Failed to send data to device');
      restoreProcessRef.current?.cancel();
      backupProcessRef.current?.cancel();
    }
  };

  const handleBackup = async () => {
    if (isBackingUp || isRestoring) return;

    try {
      const process = new BackupProcess(deviceId);
      backupProcessRef.current = process;

      setIsBackingUp(true);
      setProgress(0);
      setStatus('Starting backup...');

      const dcxFile = await process.start(sendSysex, (curr, total, stat) => {
        setProgress(Math.round((curr / total) * 100));
        setStatus(stat);
      });

      // Trigger download
      const blob = new Blob([dcxFile], {type: 'application/octet-stream'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-${new Date().toISOString().slice(0, 10)}.dcx`;
      document.body.append(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      toast.success('Backup downloaded successfully!');
    } catch (error: unknown) {
      console.error('Backup failed', error);
      const message = error instanceof Error ? error.message : String(error);
      toast.error(`Backup Failed: ${message}`);
    } finally {
      setIsBackingUp(false);
      setProgress(0);
      setStatus('');
      backupProcessRef.current = null;
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset UI
    e.target.value = ''; // Allow re-selecting same file

    if (
      !globalThis.confirm(
        `Restore ${file.name} to device? This will overwrite ALL settings.`,
      )
    ) {
      return;
    }

    try {
      const buffer = await file.arrayBuffer();
      const process = new RestoreProcess(buffer);
      restoreProcessRef.current = process;

      setIsRestoring(true);
      setProgress(0);
      setStatus('Starting...');

      await process.start(sendSysex, (curr, total, stat) => {
        setProgress(Math.round((curr / total) * 100));
        setStatus(stat);
      });

      toast.success('Restore Completed Successfully!');
    } catch (error: any) {
      console.error(error);
      toast.error(`Restore Failed: ${error.message}`);
    } finally {
      setIsRestoring(false);
      setProgress(0);
      setStatus('');
      restoreProcessRef.current = null;
    }
  };

  return (
    <div className="d-flex flex-column gap-3">
      <div className="d-flex justify-content-between align-items-center">
        <div>
          <h5>Device Backup / Restore</h5>
          <p className="small text-muted mb-0">
            Download full device backup or restore from .dcx file.
          </p>
        </div>
        <div className="d-flex gap-2">
          <Button
            variant="secondary"
            disabled={isRestoring || isBackingUp}
            onClick={handleBackup}
          >
            {isBackingUp ? 'Backing up...' : 'Download Backup'}
          </Button>
          <Button
            variant="danger"
            disabled={isRestoring || isBackingUp}
            onClick={() => document.querySelector('#dcx-upload')?.click()}
          >
            {isRestoring ? 'Restoring...' : 'Restore .dcx File'}
          </Button>
          <input
            id="dcx-upload"
            type="file"
            accept=".dcx"
            style={{display: 'none'}}
            onChange={handleFileSelect}
          />
        </div>
      </div>

      {isRestoring || isBackingUp ? (
        <div className="mt-2">
          <div className="d-flex justify-content-between mb-1">
            <span className="small text-muted">{status}</span>
            <span className="small text-muted">{progress}%</span>
          </div>
          <ProgressBar
            animated={progress < 100}
            now={progress}
            variant={
              progress === 100 ? 'success' : isBackingUp ? 'info' : 'danger'
            }
            style={{height: '10px'}}
          />
        </div>
      ) : null}
    </div>
  );
}

import React from 'react';
import Button from 'react-bootstrap/Button';
import ProgressBar from 'react-bootstrap/ProgressBar';
import {toast} from 'react-toastify';
import {useDcxBackup} from '@/hooks/useDcxBackup.js';
import {useDcxRestore} from '@/hooks/useDcxRestore.js';
import {useDcxConnection} from '@/connection/connectionContext.js';

type Props = {
  readonly deviceId?: number;
};

export function UploadDownload(_props: Props) {
  const {connection} = useDcxConnection();

  // Use new dcx-parser hooks
  const backup = useDcxBackup(connection);
  const restore = useDcxRestore(connection);

  const handleBackup = async () => {
    if (backup.status !== 'idle' || restore.status !== 'idle') return;

    try {
      void backup.start();

      // Wait for completion (hook manages the download process)
      // The hook will update status and progress automatically
    } catch (error: unknown) {
      console.error('Backup failed', error);
      const message = error instanceof Error ? error.message : String(error);
      toast.error(`Backup Failed: ${message}`);
    }
  };

  // Download the backup when it's ready
  React.useEffect(() => {
    if (backup.status === 'completed' && backup.dcxData) {
      const blob = new Blob([backup.dcxData as BlobPart], {
        type: 'application/octet-stream',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-${new Date().toISOString().slice(0, 10)}.dcx`;
      document.body.append(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      toast.success('Backup downloaded successfully!');
      backup.reset();
    }
  }, [backup.status, backup.dcxData, backup]);

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset UI
    event.target.value = ''; // Allow re-selecting same file

    if (
      !globalThis.confirm(
        `Restore ${file.name} to device? This will overwrite ALL settings.`,
      )
    ) {
      return;
    }

    try {
      const buffer = await file.arrayBuffer();
      const dcxData = new Uint8Array(buffer);

      void restore.start(dcxData);
    } catch (error: unknown) {
      console.error(error);
      const message = error instanceof Error ? error.message : String(error);
      toast.error(`Restore Failed: ${message}`);
    }
  };

  // Show success toast when restore completes
  React.useEffect(() => {
    if (restore.status === 'completed') {
      toast.success('Restore Completed Successfully!');
      restore.reset();
    } else if (restore.status === 'error' && restore.error) {
      toast.error(`Restore Failed: ${restore.error}`);
    }
  }, [restore.status, restore.error, restore]);

  const isBackingUp = backup.status === 'downloading';
  const isRestoring =
    restore.status === 'initializing' || restore.status === 'transferring';
  const progress = isBackingUp
    ? backup.progress * 100
    : isRestoring
      ? restore.progress * 100
      : 0;
  const status = isBackingUp
    ? `Downloading page ${Math.floor(backup.progress * 12)}/12...`
    : isRestoring
      ? `Uploading... ${Math.floor(restore.progress * 100)}%`
      : '';

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
            onClick={() => {
              document.querySelector<HTMLInputElement>('#dcx-upload')?.click();
            }}
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
            <span className="small text-muted">{Math.round(progress)}%</span>
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
      ) : undefined}
    </div>
  );
}

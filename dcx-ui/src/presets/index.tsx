import React, {useState} from 'react';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import {toast} from 'react-toastify';
import {type State} from '../dcx2496/parser.ts';

type Props = {
  readonly device: State;
  readonly onBulkBackup: (
    onProgress: (slot: number) => void,
  ) => Promise<any[] | undefined>;
  readonly onBulkRestore: (
    backup: any[],
    onProgress: (slot: number) => void,
  ) => Promise<void>;
};

function Presets({device, onBulkBackup, onBulkRestore}: Props) {
  const [selectedSlot, setSelectedSlot] = useState<number>(1);
  const [presetName, setPresetName] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [bulkProgress, setBulkProgress] = useState<
    {current: number; total: number} | undefined
  >(undefined);

  const handleRecall = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/presets/recall', {
        method: 'POST',
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        body: `slot=${selectedSlot}`,
      });

      if (response.ok) {
        toast.success(`Recalled preset ${selectedSlot}`);
      } else {
        toast.error('Failed to recall preset');
      }
    } catch (error) {
      console.error(error);
      toast.error('Network error during recall');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStore = async () => {
    if (
      !globalThis.confirm(
        `Are you sure you want to OVERWRITE internal preset slot ${selectedSlot}${presetName ? ` with name "${presetName}"` : ''}?`,
      )
    ) {
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch('/api/presets/store', {
        method: 'POST',
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        body: `slot=${selectedSlot}&name=${encodeURIComponent(presetName)}`,
      });

      if (response.ok) {
        toast.success(`Stored to preset ${selectedSlot}`);
      } else {
        toast.error('Failed to store preset');
      }
    } catch (error) {
      console.error(error);
      toast.error('Network error during store');
    } finally {
      setIsProcessing(false);
    }
  };

  const startBackup = async () => {
    setIsProcessing(true);
    setBulkProgress({current: 0, total: 60});
    try {
      const data = await onBulkBackup((slot) => {
        setBulkProgress({current: slot, total: 60});
      });
      if (data) {
        const blob = new Blob([JSON.stringify(data, null, 2)], {
          type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dcx2496_backup_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Backup downloaded');
      }
    } finally {
      setIsProcessing(false);
      setBulkProgress(undefined);
    }
  };

  const startRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.addEventListener('load', async (event) => {
      const content = event.target?.result;
      if (typeof content !== 'string') return;
      try {
        const backup = JSON.parse(content);
        if (!Array.isArray(backup)) throw new Error('Invalid backup format');

        if (
          !globalThis.confirm(
            `Are you sure you want to RESTORE ${backup.length} presets? This will overwrite existing internal memory.`,
          )
        ) {
          return;
        }

        setIsProcessing(true);
        setBulkProgress({current: 0, total: backup.length});
        await onBulkRestore(backup, (slot) => {
          setBulkProgress({current: slot, total: backup.length});
        });
      } catch (error) {
        console.error(error);
        toast.error('Failed to parse backup file');
      } finally {
        setIsProcessing(false);
        setBulkProgress(undefined);
      }
    });

    reader.readAsText(file);
  };

  const handleDump = async () => {
    try {
      await fetch('/api/presets/dump');
      toast.info('Requesting device state sync...');
    } catch (error) {
      console.error(error);
    }
  };

  // Generate 60 slots
  const slots = Array.from({length: 60}, (_, i) => i + 1);

  return (
    <Card className="device-setup">
      <Card.Header>Internal Presets</Card.Header>
      <Card.Body>
        <p className="text-muted">
          Manage the 60 internal memory slots of the DCX2496. Stored presets are
          kept in the device's non-volatile memory.
        </p>
        <Form className="mt-4">
          <Row className="align-items-end">
            <Col xs={12} md={4} className="mb-3">
              <Form.Group controlId="presetSlotSelect">
                <Form.Label>Select Memory Slot</Form.Label>
                <Form.Select
                  value={selectedSlot}
                  disabled={isProcessing}
                  onChange={(e) => {
                    setSelectedSlot(Number.parseInt(e.target.value, 10));
                  }}
                >
                  {slots.map((slot) => (
                    <option key={slot} value={slot}>
                      Slot {slot}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col xs={12} md={4} className="mb-3">
              <Form.Group controlId="presetName">
                <Form.Label>Preset Name (8 chars)</Form.Label>
                <Form.Control
                  type="text"
                  maxLength={8}
                  value={presetName}
                  placeholder="PRESET"
                  disabled={isProcessing}
                  onChange={(e) => {
                    setPresetName(e.target.value.toUpperCase());
                  }}
                />
              </Form.Group>
            </Col>
            <Col xs={12} md={4} className="mb-3">
              <div className="d-flex gap-2">
                <Button
                  variant="primary"
                  className="flex-grow-1"
                  disabled={isProcessing}
                  onClick={handleRecall}
                >
                  Recall
                </Button>
                <Button
                  variant="warning"
                  className="flex-grow-1"
                  disabled={isProcessing}
                  onClick={handleStore}
                >
                  Store
                </Button>
              </div>
            </Col>
          </Row>
        </Form>
        <hr className="my-4" />
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h5>Synchronization</h5>
            <p className="small text-muted mb-0">
              Force a full state dump from the device (Command 0x53).
            </p>
          </div>
          <Button
            variant="outline-secondary"
            disabled={isProcessing}
            onClick={handleDump}
          >
            Dump State
          </Button>
        </div>
        <hr className="my-4" />
        // ... imports // ... inside Presets component render ..
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h5>Bulk Operations</h5>
            <p className="small text-muted mb-0">
              Backup all 60 presets to a file or restore from a backup (JSON
              format).
            </p>
          </div>
          <div className="d-flex gap-2">
            <Button
              variant="outline-primary"
              disabled={isProcessing}
              onClick={startBackup}
            >
              Backup All
            </Button>
            <Button
              variant="outline-warning"
              disabled={isProcessing}
              onClick={() => {
                document.querySelector('#restore-upload')?.click();
              }}
            >
              Restore All
            </Button>
            <input
              id="restore-upload"
              type="file"
              accept=".json"
              style={{display: 'none'}}
              onChange={startRestore}
            />
          </div>
        </div>
        {bulkProgress ? (
          <div className="mt-3">
            <div className="d-flex justify-content-between mb-1">
              <span className="small text-muted">
                Processing Slot {bulkProgress.current} / {bulkProgress.total}
              </span>
              <span className="small text-muted">
                {Math.round((bulkProgress.current / bulkProgress.total) * 100)}%
              </span>
            </div>
            <div className="progress" style={{height: '8px'}}>
              <div
                className="progress-bar progress-bar-striped progress-bar-animated bg-info"
                role="progressbar"
                style={{
                  width: `${(bulkProgress.current / bulkProgress.total) * 100}%`,
                }}
              />
            </div>
          </div>
        ) : null}
        <hr className="my-4" />
        <UploadDownload />
      </Card.Body>
    </Card>
  );
}

export default Presets;

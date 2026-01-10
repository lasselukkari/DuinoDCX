import React, { useState, useEffect, useCallback } from 'react';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import ListGroup from 'react-bootstrap/ListGroup';
import Modal from 'react-bootstrap/Modal';
import ProgressBar from 'react-bootstrap/ProgressBar';
import Badge from 'react-bootstrap/Badge';
import { toast } from 'react-toastify';
import {
  isValidDcxFile,
  type PresetEntry,
} from 'dcx-parser';
import { useDcxBackup } from '../hooks/use-dcx-backup.js';
import { useDcxFile } from '../hooks/use-dcx-file.js';
import { useDcxConnection } from '../connection/connection-context.js';

function Presets() {
  const { connection } = useDcxConnection();

  // Use the backup hook for fetching from device
  const backup = useDcxBackup(connection);

  // Use the file hook for parsing .dcx data
  const dcxFile = useDcxFile();

  // Modal state
  const [selectedPreset, setSelectedPreset] = useState<PresetEntry | null>(null);
  const [showModal, setShowModal] = useState(false);

  // When backup completes, load the data into the file hook
  // When backup completes, load the data into the file hook
  useEffect(() => {
    if (backup.status === 'completed' && backup.dcxData) {
      dcxFile.loadFromBuffer(backup.dcxData);
      toast.success('Presets loaded from device!');
    }
  }, [backup.status, backup.dcxData, dcxFile.loadFromBuffer]);

  // Auto-fetch on mount when connected and no data
  // Auto-fetch on mount when connected and no data
  useEffect(() => {
    if (connection && !dcxFile.dcxData && backup.status === 'idle') {
      backup.start();
    }
  }, [connection, dcxFile.dcxData, backup.status, backup.start]);

  // Handle preset click - show in modal
  const handlePresetClick = useCallback(
    (slot: number) => {
      const preset = dcxFile.getPreset(slot);
      if (!preset || preset.isEmpty) {
        toast.info(`Preset ${slot} is empty`);
        return;
      }

      setSelectedPreset(preset);
      setShowModal(true);
    },
    [dcxFile]
  );

  // Handle download
  const handleDownload = useCallback(() => {
    if (!dcxFile.dcxData) {
      toast.error('No preset data available');
      return;
    }

    const blob = new Blob([dcxFile.dcxData as BlobPart], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    // ISO date format: YYYY-MM-DD
    a.download = `${new Date().toISOString().slice(0, 10)}.dcx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Preset file downloaded!');
  }, [dcxFile.dcxData]);

  // Handle upload
  const handleUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      // Reset input for re-selection
      event.target.value = '';

      if (!file.name.toLowerCase().endsWith('.dcx')) {
        toast.error('Please select a .dcx file');
        return;
      }

      try {
        const buffer = await file.arrayBuffer();
        const data = new Uint8Array(buffer);

        if (!isValidDcxFile(data)) {
          toast.error('Invalid .dcx file: Missing XSNP signature');
          return;
        }

        dcxFile.loadFromBuffer(data);
        toast.success(`Loaded ${file.name}`);
      } catch (error) {
        console.error('Failed to read file:', error);
        toast.error('Failed to read file');
      }
    },
    [dcxFile]
  );

  // Handle refresh from device
  const handleRefresh = useCallback(() => {
    if (backup.status === 'downloading') {
      toast.info('Already syncing...');
      return;
    }

    dcxFile.clear();
    backup.reset();
    backup.start();
  }, [backup, dcxFile]);

  const isLoading = backup.status === 'downloading';
  const hasData = dcxFile.dcxData !== undefined;
  const nonEmptyCount = dcxFile.presets.filter((p) => !p.isEmpty).length;

  return (
    <>
      <Card className="device-setup">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <span>Presets</span>
          <div className="d-flex gap-2">
            <Button
              variant="outline-info"
              size="sm"
              disabled={isLoading}
              onClick={handleRefresh}
            >
              {isLoading ? 'Syncing...' : 'Refresh from Device'}
            </Button>
          </div>
        </Card.Header>

        <Card.Body>
          {/* Progress bar during sync */}
          {isLoading && (
            <div className="mb-3">
              <div className="d-flex justify-content-between mb-1">
                <span className="small text-muted">
                  Downloading page {Math.floor(backup.progress * 12)}/12...
                </span>
                <span className="small text-muted">
                  {Math.round(backup.progress * 100)}%
                </span>
              </div>
              <ProgressBar
                animated
                now={backup.progress * 100}
                variant="info"
                style={{ height: '8px' }}
              />
            </div>
          )}

          {/* Error state */}
          {backup.status === 'error' && (
            <div className="alert alert-danger">
              <strong>Error:</strong> {backup.error || 'Failed to load presets'}
            </div>
          )}

          {/* Download/Upload buttons */}
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h5 className="mb-0">Backup / Restore</h5>
              <p className="small text-muted mb-0">
                Download current presets or load from file.
              </p>
            </div>
            <div className="d-flex gap-2">
              <Button
                variant="outline-primary"
                disabled={!hasData || isLoading}
                onClick={handleDownload}
              >
                Download .dcx
              </Button>
              <Button
                variant="outline-warning"
                disabled={isLoading}
                onClick={() => {
                  document.getElementById('dcx-upload-input')?.click();
                }}
              >
                Upload .dcx
              </Button>
              <input
                id="dcx-upload-input"
                type="file"
                accept=".dcx"
                style={{ display: 'none' }}
                onChange={(e) => {
                  void handleUpload(e);
                }}
              />
            </div>
          </div>

          <hr className="my-4" />

          {/* Preset list */}
          <h5>Preset Library ({nonEmptyCount} / 60)</h5>

          {!hasData && !isLoading && (
            <p className="text-muted">
              No preset data loaded. Click "Refresh from Device" or upload a .dcx file.
            </p>
          )}

          {hasData && (
            <ListGroup
              style={{ maxHeight: '400px', overflowY: 'auto' }}
              className="mt-3"
            >
              {dcxFile.presets.map((preset) => (
                <ListGroup.Item
                  key={preset.slot}
                  action={!preset.isEmpty}
                  onClick={() => !preset.isEmpty && handlePresetClick(preset.slot)}
                  className="d-flex justify-content-between align-items-center"
                  variant={preset.isEmpty ? 'dark' : undefined}
                  style={{ cursor: preset.isEmpty ? 'default' : 'pointer' }}
                >
                  <div>
                    <span className="text-muted me-2">#{preset.slot.toString().padStart(2, '0')}</span>
                    <span className={preset.isEmpty ? 'text-muted' : ''}>
                      {preset.name}
                    </span>
                  </div>
                  <div>
                    {preset.isLocked && (
                      <Badge bg="secondary" className="me-1">
                        🔒
                      </Badge>
                    )}
                    {!preset.isEmpty && (
                      <Badge bg="info">View JSON</Badge>
                    )}
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </Card.Body>
      </Card>

      {/* Preset JSON Modal */}
      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        size="xl"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            Preset #{selectedPreset?.slot ?? ''}{' '}
            {selectedPreset?.name && `- ${selectedPreset.name}`}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <pre
            className="bg-dark text-light p-3 rounded"
            style={{
              maxHeight: '60vh',
              overflow: 'auto',
              fontSize: '0.85em',
            }}
          >
            {selectedPreset ? JSON.stringify(selectedPreset.state, null, 2) : 'No data'}
          </pre>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default Presets;

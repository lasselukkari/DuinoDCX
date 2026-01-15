import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import ListGroup from 'react-bootstrap/ListGroup';
import Modal from 'react-bootstrap/Modal';
import ProgressBar from 'react-bootstrap/ProgressBar';
import Badge from 'react-bootstrap/Badge';
import { toast } from 'react-toastify';
import { isValidDcxFile, type ParsedPreset, CoordinatorPhase } from 'dcx-parser';
import { useDcxFile } from '@/hooks/useDcxFile.js';
import { useDeviceContext } from '@/router.js';

function Presets() {
  // Get presets from context (device download) and request function
  const { phase, presets: devicePresets, presetProgress, isDownloadingPresets, requestPresets } =
    useDeviceContext();

  // File hook for user-uploaded .dcx files (separate from device download)
  const dcxFile = useDcxFile();

  // Modal state
  const [selectedPreset, setSelectedPreset] = useState<ParsedPreset | undefined>(
    undefined,
  );
  const [showModal, setShowModal] = useState(false);

  // Auto-fetch when session becomes IDLE and we don't have presets
  useEffect(() => {
    if (phase === CoordinatorPhase.IDLE && devicePresets.length === 0 && !isDownloadingPresets) {
      console.log('[Presets] Phase is IDLE, requesting presets');
      void requestPresets();
    }
  }, [phase, devicePresets.length, isDownloadingPresets, requestPresets]);

  // Debug: log when devicePresets changes
  useEffect(() => {
    console.log('[Presets] devicePresets changed, length:', devicePresets.length);
  }, [devicePresets]);

  // Merged presets: use file presets if loaded, otherwise device presets
  const presets = useMemo(() => {
    return dcxFile.presets.length > 0 ? dcxFile.presets : devicePresets;
  }, [dcxFile.presets, devicePresets]);

  // Handle preset click - show in modal
  const handlePresetClick = useCallback(
    (slot: number) => {
      const preset = presets[slot];
      if (!preset || preset.isEmpty) {
        toast.info(`Preset ${slot} is empty`);
        return;
      }

      setSelectedPreset(preset);
      setShowModal(true);
    },
    [presets],
  );

  // Handle download
  const handleDownload = useCallback(() => {
    if (!dcxFile.dcxData) {
      toast.error('No preset data available');
      return;
    }

    const blob = new Blob([dcxFile.dcxData as BlobPart], {
      type: 'application/octet-stream',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    // ISO date format: YYYY-MM-DD
    a.download = `${new Date().toISOString().slice(0, 10)}.dcx`;
    document.body.append(a);
    a.click();
    a.remove();
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
    [dcxFile],
  );

  // Handle refresh from device
  const handleRefresh = useCallback(() => {
    if (isDownloadingPresets) {
      toast.info('Already syncing...');
      return;
    }

    dcxFile.clear();
    void requestPresets();
  }, [isDownloadingPresets, dcxFile, requestPresets]);

  const isLoading = isDownloadingPresets;
  const hasData = presets.length > 0;
  const nonEmptyCount = presets.filter((p) => !p.isEmpty).length;

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
          {isLoading ? (
            <div className="mb-3">
              <div className="d-flex justify-content-between mb-1">
                <span className="small text-muted">
                  Downloading page {Math.floor(presetProgress * 12)}/12...
                </span>
                <span className="small text-muted">
                  {Math.round(presetProgress * 100)}%
                </span>
              </div>
              <ProgressBar
                animated
                now={presetProgress * 100}
                variant="info"
                style={{ height: '8px' }}
              />
            </div>
          ) : null}

          {/* Error state - removed since DeviceSession handles errors internally */}

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
                  document
                    .querySelector<HTMLInputElement>('#dcx-upload-input')
                    ?.click();
                }}
              >
                Upload .dcx
              </Button>
              <input
                id="dcx-upload-input"
                type="file"
                accept=".dcx"
                style={{ display: 'none' }}
                onChange={(event) => {
                  void handleUpload(event);
                }}
              />
            </div>
          </div>

          <hr className="my-4" />

          {/* Preset list */}
          <h5>Preset Library ({nonEmptyCount} / 60)</h5>

          {!hasData && !isLoading && (
            <p className="text-muted">
              No preset data loaded. Click &quot;Refresh from Device&quot; or
              upload a .dcx file.
            </p>
          )}

          {hasData ? (
            <ListGroup
              style={{ maxHeight: '400px', overflowY: 'auto' }}
              className="mt-3"
            >
              {presets.map((preset) => (
                <ListGroup.Item
                  key={preset.slot}
                  action={!preset.isEmpty}
                  className="d-flex justify-content-between align-items-center"
                  variant={preset.isEmpty ? 'dark' : undefined}
                  style={{ cursor: preset.isEmpty ? 'default' : 'pointer' }}
                  onClick={() => {
                    if (!preset.isEmpty) {
                      handlePresetClick(preset.slot);
                    }
                  }}
                >
                  <div>
                    <span className="text-muted me-2">
                      #{preset.slot.toString().padStart(2, '0')}
                    </span>
                    <span className={preset.isEmpty ? 'text-muted' : ''}>
                      {preset.name}
                    </span>
                  </div>
                  <div>
                    {preset.isLocked ? (
                      <Badge bg="secondary" className="me-1">
                        🔒
                      </Badge>
                    ) : null}
                    {!preset.isEmpty && <Badge bg="info">View JSON</Badge>}
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          ) : null}
        </Card.Body>
      </Card>

      {/* Preset JSON Modal */}
      <Modal
        centered
        show={showModal}
        size="xl"
        onHide={() => {
          setShowModal(false);
        }}
      >
        <Modal.Header closeButton>
          <Modal.Title>
            Preset #{selectedPreset?.slot ?? ''}{' '}
            {selectedPreset?.name ? `- ${selectedPreset.name}` : null}
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
            {selectedPreset
              ? JSON.stringify(selectedPreset.state, undefined, 2)
              : 'No data'}
          </pre>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              setShowModal(false);
            }}
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default Presets;

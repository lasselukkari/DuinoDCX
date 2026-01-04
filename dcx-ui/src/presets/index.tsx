import React, {useState, useEffect, useRef, useMemo} from 'react';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Modal from 'react-bootstrap/Modal';
import {toast} from 'react-toastify';
import * as SysexBuilder from '../dcx2496/sysex-builder.js';
import {useDeviceState} from '../device-state-context.js';
import {stitchPagesToFile} from '../dcx2496/backup-process.js';
import {
  parseDcxFile,
  extractPresetsFromPages,
  getPresetSettingsSummary,
  type PresetSlot,
} from '../dcx2496/dcx-file-parser.js';

type Props = {
  readonly onBulkRestore: (
    backup: Uint8Array,
    onProgress: (slot: number) => void,
  ) => Promise<void>;
};

function Presets({onBulkRestore}: Props) {
  const [selectedSlot, setSelectedSlot] = useState<number>(1);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [bulkProgress, setBulkProgress] = useState<
    {current: number; total: number} | undefined
  >(undefined);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const {rawPresetPages, clearPresetPages} = useDeviceState();

  const hasSyncedOnce = useRef(false);

  // Sync logic: Iterate pages 0-11
  const syncPresetsFromDevice = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    clearPresetPages();

    try {
      // Fetch pages 0-11 (the device has 12 memory pages)
      for (let page = 0; page < 12; page++) {
        // eslint-disable-next-line no-await-in-loop
        await fetch('/api/sysex', {
          method: 'POST',
          headers: {'Content-Type': 'application/octet-stream'},
          body: SysexBuilder.buildPageDumpRequest(
            0,
            page,
          ) as unknown as BodyInit,
        });
        // Throttle to prevent buffer overflow
        // eslint-disable-next-line no-await-in-loop
        await new Promise((resolve) => {
          setTimeout(resolve, 250);
        });
      }

      toast.success('Synced from device');
    } catch (error) {
      console.error(error);
      toast.error('Sync failed');
    } finally {
      setIsSyncing(false);
    }
  };

  // Sync on mount
  useEffect(() => {
    if (!hasSyncedOnce.current && Object.keys(rawPresetPages).length === 0) {
      hasSyncedOnce.current = true;
      void syncPresetsFromDevice();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Stitch pages and parse DCX file data
  const dcxFileData = useMemo(() => {
    if (Object.keys(rawPresetPages).length === 0) return null;

    const pages = Object.keys(rawPresetPages)
      .map(Number)
      .sort((a, b) => a - b)
      .map((idx) => rawPresetPages[idx]);

    if (pages.length === 0) return null;

    return stitchPagesToFile(pages);
  }, [rawPresetPages]);

  // Compute preset list using parseDcxFile for consistent offsets
  const presetList: PresetSlot[] = useMemo(() => {
    if (!dcxFileData || dcxFileData.length < 100) {
      // Return empty 60 slots
      return Array.from({length: 60}, (_, i) => ({
        slot: i + 1,
        name: '',
        offset: -1,
        isEmpty: true,
      }));
    }

    try {
      const parsed = parseDcxFile(dcxFileData);
      return parsed.presets;
    } catch {
      // Fallback to extractPresetsFromPages if parsing fails
      return extractPresetsFromPages(rawPresetPages);
    }
  }, [dcxFileData, rawPresetPages]);

  // Get current preset
  const currentPreset = presetList.find((p) => p.slot === selectedSlot);
  const presetName = currentPreset?.name ?? '';

  const sendSysex = async (data: Uint8Array) => {
    await fetch('/api/sysex', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
      },
      body: data as unknown as BodyInit,
    });
  };

  const handleRecall = async () => {
    setIsProcessing(true);
    try {
      const data = SysexBuilder.recallPreset(selectedSlot);
      await sendSysex(data);
      toast.success(`Recalled preset ${selectedSlot}`);
    } catch (error: unknown) {
      console.error(error);
      toast.error('Network error during recall');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStore = async () => {
    if (
      !globalThis.confirm(
        `Are you sure you want to OVERWRITE internal preset slot ${selectedSlot}${
          presetName ? ` with name "${presetName}"` : ''
        }?`,
      )
    ) {
      return;
    }

    setIsProcessing(true);
    try {
      const data = SysexBuilder.storePreset(selectedSlot);
      await sendSysex(data);
      toast.success(`Stored to preset ${selectedSlot}`);

      // Re-sync after store to update list if name changed
      setTimeout(() => {
        void syncPresetsFromDevice();
      }, 1000);
    } catch (error: unknown) {
      console.error(error);
      toast.error('Network error during store');
    } finally {
      setIsProcessing(false);
    }
  };

  const startBackup = () => {
    setIsProcessing(true);
    try {
      if (!dcxFileData || dcxFileData.length === 0) {
        toast.warn('No preset data to backup. Please sync first.');
        return;
      }

      const blob = new Blob([dcxFileData], {type: 'application/octet-stream'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dcx2496_backup_${new Date().toISOString().slice(0, 10)}.dcx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Backup downloaded');
    } catch (error) {
      console.error(error);
      toast.error('Backup generation failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const startRestore = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    void (async () => {
      try {
        const buffer = await file.arrayBuffer();
        const backup = new Uint8Array(buffer);

        if (
          !globalThis.confirm(
            `Are you sure you want to RESTORE from ${file.name}? This will overwrite existing internal memory.`,
          )
        ) {
          return;
        }

        setIsProcessing(true);
        setBulkProgress({current: 0, total: 100});
        await onBulkRestore(backup, (progress) => {
          setBulkProgress({current: progress, total: 100});
        });

        // After restore, re-sync to show new names
        setTimeout(() => {
          void syncPresetsFromDevice();
        }, 1500);
      } catch (error: unknown) {
        console.error(error);
        toast.error('Failed to parse backup file');
      } finally {
        setIsProcessing(false);
        setBulkProgress(undefined);
      }
    })();
  };

  // Get settings summary for modal
  const settingsSummary = useMemo(() => {
    if (!dcxFileData || !currentPreset || currentPreset.isEmpty) {
      return 'No settings data available for this preset.';
    }

    return getPresetSettingsSummary(
      dcxFileData,
      currentPreset.offset,
      currentPreset.slot - 1,
    );
  }, [dcxFileData, currentPreset]);

  return (
    <>
      <Card className="device-setup">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <span>Internal Presets</span>
          <Button
            variant="outline-info"
            size="sm"
            disabled={isSyncing || isProcessing}
            onClick={() => {
              void syncPresetsFromDevice();
            }}
          >
            {isSyncing ? 'Syncing...' : 'Refresh from Device'}
          </Button>
        </Card.Header>
        <Card.Body>
          <Form className="mt-2">
            <Row className="align-items-end">
              <Col xs={12} md={4} className="mb-3">
                <Form.Group controlId="presetSlotSelect">
                  <Form.Label>Select Preset Slot</Form.Label>
                  <Form.Select
                    value={selectedSlot}
                    disabled={isProcessing}
                    onChange={(event) => {
                      setSelectedSlot(Number.parseInt(event.target.value, 10));
                    }}
                  >
                    {presetList.map((preset) => {
                      const label = preset.isEmpty
                        ? `Slot ${preset.slot} <Empty>`
                        : `${preset.slot}: ${preset.name}`;
                      return (
                        <option key={preset.slot} value={preset.slot}>
                          {label}
                        </option>
                      );
                    })}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col xs={12} md={4} className="mb-3">
                <Form.Group controlId="presetName">
                  <Form.Label>Preset Name</Form.Label>
                  <Form.Control
                    readOnly
                    disabled
                    type="text"
                    value={presetName}
                    placeholder={currentPreset?.isEmpty ? '<Empty>' : '-'}
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
                  <Button
                    variant="outline-secondary"
                    disabled={isProcessing || !dcxFileData}
                    onClick={() => {
                      setShowSettingsModal(true);
                    }}
                  >
                    Settings
                  </Button>
                </div>
              </Col>
            </Row>
          </Form>
          <hr className="my-4" />
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h5>Backup / Restore</h5>
              <p className="small text-muted mb-0">
                Download or restore all 60 presets as a .dcx file.
              </p>
            </div>
            <div className="d-flex gap-2">
              <Button
                variant="outline-primary"
                disabled={isProcessing || !dcxFileData}
                onClick={startBackup}
              >
                Download .dcx
              </Button>
              <Button
                variant="outline-warning"
                disabled={isProcessing}
                onClick={() => {
                  document
                    .querySelector<HTMLInputElement>('#restore-upload')
                    ?.click();
                }}
              >
                Restore .dcx
              </Button>
              <input
                id="restore-upload"
                type="file"
                accept=".dcx"
                style={{display: 'none'}}
                onChange={(event) => {
                  startRestore(event);
                  event.target.value = '';
                }}
              />
            </div>
          </div>
          {bulkProgress ? (
            <div className="mt-3">
              <div className="d-flex justify-content-between mb-1">
                <span className="small text-muted">
                  Progress: {bulkProgress.current}%
                </span>
              </div>
              <div className="progress" style={{height: '8px'}}>
                <div
                  className="progress-bar progress-bar-striped progress-bar-animated bg-info"
                  role="progressbar"
                  style={{
                    width: `${bulkProgress.current}%`,
                  }}
                />
              </div>
            </div>
          ) : null}
        </Card.Body>
      </Card>

      {/* Settings Modal */}
      <Modal
        show={showSettingsModal}
        size="lg"
        onHide={() => {
          setShowSettingsModal(false);
        }}
      >
        <Modal.Header closeButton>
          <Modal.Title>
            Preset {selectedSlot}: {presetName || '<Empty>'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <pre
            style={{
              fontFamily: 'monospace',
              fontSize: '0.85rem',
              whiteSpace: 'pre-wrap',
              backgroundColor: '#f8f9fa',
              padding: '1rem',
              borderRadius: '4px',
              maxHeight: '400px',
              overflow: 'auto',
            }}
          >
            {settingsSummary}
          </pre>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              setShowSettingsModal(false);
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

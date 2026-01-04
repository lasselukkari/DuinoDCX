# DCX Preset Upload Plan

## Goal
Create a script (`upload-device.ts`) that takes a `.dcx` file and uploads the presets to a connected DCX2496 device via the async SysEx protocol.

---

## Key Protocol Aspects (from `protocol_findings.md`)

1.  **Async Handshake**: The protocol is *device-paced*. After an initial unsolicited header, the device requests subsequent pages one at a time.
2.  **Initiation**: Send `CMD_INIT_SYNC (0x12)` with ASCII "PRESETS".
3.  **Acknowledgement**: Wait for `ACK (0x52)` from device.
4.  **Unsolicited Packets**: Immediately send:
    *   Header Packet (Type `0x01`, Page 0)
    *   Page 0 Data Packet (Type `0x0C`, Page 0)
5.  **Solicited Packets**: Wait for device's `PAGE_DUMP_REQUEST (0x50)` for pages 1 through N, then send each page.
6.  **Checksum**: Use the non-standard DCX checksum: `(~(sum of (byte+1))) & 0x7F`.

---

## Existing Infrastructure

> [!CAUTION]
> **Do NOT assume existing implementations work.** Functions like `splitDcxFileIntoPages`, `buildSyncInit`, and others need to be verified against captured SysEx logs before use. They may contain encoding, padding, or framing bugs similar to those fixed in the backup flow.

| Component | Location | Status |
|-----------|----------|--------|
| DCX File Splitter | `dcx-file.ts` → `splitDcxFileIntoPages` | ⚠️ Needs Verification |
| Init Sync Builder | `sysex.ts` → `buildSyncInit` | ⚠️ Needs Verification |
| Checksum | `checksum.ts` → `calculateChecksum` | ⚠️ Needs Verification |
| 8-to-7 Encoding | `encoding.ts` → `encode8to7` | ⚠️ Needs Verification (use Raw mode) |
| Data Packet Builder | `sysex.ts` | ❌ **Needs Implementation** |

---

## Implementation Steps

## Reusable Implementation Strategy

The implementation must be **transport-agnostic** to allow reuse in both CLI (Serial) and the Web UI (HTTP/WebSocket). 

### 1. `src/restore.ts`: Protocol State Machine
Create a `RestoreSession` class that manages the sequence of DCX Sysex messages without being tied to a specific I/O library.

**Responsibilities:**
- Track the current step in the restore sequence.
- Generate the next message to be sent (`getNextMessage()`).
- Handle incoming device responses (`processResponse(msg)`).
- Provide status (e.g., progress, completion, errors).

### 2. Transport Layers
- **CLI (`upload-device.ts`)**: Uses `serialport` to pump the `RestoreSession`.
- **UI (`dcx-ui`)**: Will use the backend API to pump the `RestoreSession` via WebSocket/HTTP.

---

## Implementation Steps

### 1. Robust `RestoreSession` in `src/restore.ts`
- **State Machine**:
  - `IDLE`: Initial state.
  - `INIT_SENT`: `CMD_INIT_SYNC` sent, waiting for `ACK`.
  - `HEADER_SENT`: `Header Packet` sent.
  - `PAGE_0_SENT`: `Page 0 Data` sent (unsolicited).
  - `PAGE_N_WAITING`: Waiting for `PAGE_DUMP_REQUEST` for page N.
  - `PAGE_N_SENT`: `Page N Data` sent.
  - `COMPLETED`: All pages sent and acknowledged.
  - `ERROR`: Protocol failure.

### 2. Refactor `sysex.ts` & `dcx-file.ts`
- Ensure `parseMessage` correctly identifies `PAGE_DUMP_REQUEST`.
- Verify `buildDataPacket` handles all packet types.

### 3. CLI Script (`upload-device.ts`)
- Use the `RestoreSession` to drive the upload.
- Implement robust buffer flushing and retry logic at the transport level.

---

## Verification Steps (Refined)

### Phase 1: Virtual Round-Trip
Verify that `RestoreSession` generates the exact same byte sequence as a known-good manual upload.

### Phase 2: Live Hardware Test
1. Upload `current.dcx` to device.
2. Verify progress via logs.
3. Download back from device and assert bit-perfect match.


---

## Key Files to Modify/Create

| File | Action |
|------|--------|
| `src/sysex.ts` | Add `buildPageUploadPacket` |
| `src/dcx-file.ts` | (No changes expected, splitter already exists) |
| `upload-device.ts` | **Create** |

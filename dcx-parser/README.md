# DCX2496 Parser Library

A TypeScript library for building and parsing Behringer DCX2496 SysEx messages and `.dcx` files.

## Features
- **Protocol Layer**: MIDI-safe 7-bit encoding/decoding, non-standard checksum calculation.
- **Message Building**: Support for Ping, Recall, Store, Page Requests, and Direct Parameter changes.
- **Parsing**: Full support for real-time state sync responses and dump messages.
- **File Format**: Parse and build `.dcx` files (12-page memory dumps).
- **Metadata Driven**: O(1) parameter lookups using auto-generated mappings.

## Usage

### Parsing a SysEx Message
```typescript
import { parseMessage } from './src/index.js';

const rawMessage = new Uint8Array([...]); // Received from device
const parsed = parseMessage(rawMessage);

if (parsed?.type === 'pageDump') {
  console.log(`Received page ${parsed.page} with ${parsed.data.length} bytes`);
}
```

### Building a Command
```typescript
import { buildRecallCommand } from './src/index.js';

const cmd = buildRecallCommand(1); // Recall Preset 1
// Send cmd to device via MIDI/RS-232
```

### Parameter Lookup
```typescript
import { getParameterByDirect, convertValue } from './src/index.js';

const def = getParameterByDirect(1, 2); // Input A, Gain
if (def) {
  const realValue = convertValue(def, 150); // 150 -> 0dB
  console.log(`${def.key}: ${realValue} ${def.unit || ''}`);
}
```

## Project Structure
- `src/protocol/`: Framing, checksums, and 7-bit encoding.
- `src/model/`: Parameter mappings, state parsers, and commands.
- `src/file/`: `.dcx` file parsing and memory dump processing.
- `src/types/`: TypeScript definitions for device state.
- `src/constants/`: Enums and unit conversion tables.

---

# DCX2496 Protocol Verification Findings

## Connection Details
- **Baud Rate**: 38400
- **Data Bits**: 8
- **Parity**: None
- **Stop Bits**: 1

## Command Structure
The base Sysex header for Behringer DCX2496 is:
`F0 00 20 32 <DeviceID> <ModelID> <CommandID>`

- **Vendor ID**: `00 20 32` (Behringer)
- **Device ID**: `00` (Verified on your hardware)
  - *Note: The PC software uses `20` (Global/All Call), but the device replies with `00`.*
- **Model ID**: `0E` (DCX2496)

## Verified Commands

### 1. Ping / Search Device (`0x40`)
Used to detect presence and get the device name.
- **Request**: `F0 00 20 32 00 0E 40 F7`
- **Response**: `F0 00 20 32 00 0E 00 01 11 44 43 ... F7`
  - The response contains "DCX2496" in ASCII.

### 2. Set Device Name (`0x25`)
Used to rename the device to a custom name.
- **Format**: `F0 00 20 32 <DevID> 0E 25 [16-byte ASCII name, space-padded] F7`
- **Example**: `F0 00 20 32 00 0E 25 58 58 58 58 58 58 58 58 58 58 58 58 58 58 58 58 F7` renames the device to "XXXXXXXXXXXXXXXX".
- **Usage**: Sent by DCX-Remote during initialization (with model name like "DCX2496") and can be used to set a custom device name.

### 2b. Set Device ID (`0x22`)
Used to change the device's MIDI device ID (for multi-unit setups).
- **Format**: `F0 00 20 32 <CurrentDevID> 0E 22 <NewDevID> F7`
- **Range**: Device ID 0-15 (0x00-0x0F). Max 16 devices.
- **Example**: 
  - `F0 00 20 32 00 0E 22 01 F7` changes device ID from 0 to 1.
  - `F0 00 20 32 01 0E 22 00 F7` changes device ID from 1 back to 0.
- **Note**: After changing the ID, subsequent commands must use the new device ID in the header.


### 3a. Remote Control Enable (`0x3F`)
Enables direct parameter changes. Must be sent before `CMD_DIRECT`.
- **Format**: `F0 00 20 32 <DevID> 0E 3F <Mode> <State> F7`
- **Modes**:
  - `04 00`: Receive Enable
  - `08 00`: Transmit Enable
  - `0C 00`: Receive & Transmit Enable
- **Example**: `F0 00 20 32 00 0E 3F 0C 00 F7` (Enable Rx/Tx)

### 3b. Direct Parameter Change (`0x20`)
Sets a single parameter value.
- **Format**: `F0 00 20 32 <DevID> 0E 20 <Count> [<Ch> <Param> <ValHi> <ValLo>] ... F7`
- **Key Features**:
  - **NO CHECKSUM**: Unlike other commands, this has no checksum byte.
  - **Count**: Number of parameter sets following (usually 1).
  - **Value**: 14-bit value split into Hi (bits 7-13) and Lo (bits 0-6).
- **Example** (Set Ch 1 Param 2 to +6dB):
  `F0 00 20 32 00 0E 20 01 01 02 01 52 F7`

### Total State Push (DCX-Remote Recall Behavior)

Traffic analysis of `DCX-Remote.exe` reveals that clicking "Recall" in the Windows application does **NOT** send `CMD_RECALL (0x52)`. Instead, it uploads the preset as a full Edit Buffer using `CMD_WRITE_DATA (0x10)`.

**Observed Initialization Sequence:**
1. **CMD_DEVICE_NAME (0x25)**: `F0 00 20 32 00 0E 25 "DCX2496         " F7` (16-byte name, space-padded)
2. **CMD_LISTEN_MODE (0x3F)**: `F0 00 20 32 00 0E 3F 04 00 F7` (Enable transmit mode)
3. **Edit Buffer Page 0 (0x10)**: `F0 00 20 32 00 0E 10 01 01 00 02 00 00 ...` (~1015 bytes)
4. **Device requests Page 1 (0x50)**: `F0 00 20 32 00 0E 50 01 00 01 F7`
5. **Edit Buffer Page 1 (0x10)**: `F0 00 20 32 00 0E 10 01 01 00 02 00 01 ...` (~911 bytes)

**Implication**: DCX-Remote treats "Recall" as a synchronization of the local UI state to the device's volatile edit buffer. This ensures that any software-side modifications are preserved even if the hardware preset has changed.

### 4. Request Preset Dump (`0x50`)

There are TWO formats for this command:

#### 4a. Request Specific Memory Page (Bank 0, Pages 0-11)
**Format**: `F0 00 20 32 <DevID> 0E 50 00 00 <Page> F7`
  - `Page`: `00` to `0B` (0-11). **Crucially:** These are Memory Pages, not individual Preset Slots.
  - **Memory Structure**:
      - The device has 12 Memory Pages total.
      - Presets are **packed** into these pages. A single page can contain multiple preset entries.
      - The number of presets per page is **variable**, depending on the data size of the presets stored.
      - **Error Boundary**: Requesting `Page > 11` (e.g., 0x0C) results in a **CARD ERROR** or TIMEOUT because the physical memory page does not exist.
  - **Preset Identification**:
      - Each preset entry begins with a 14-byte directory record:
        `[ptr_lo, ptr_hi, SLOT_INDEX, 0x00] [NAME (8 bytes)] [0x00 0x00]`
      - `ptr` is a **signed 16-bit relative offset** from the start of the record to the preset data block.
      - The slot index allows correct alignment even with variable-length preset data.
- **Response**: `F0 00 20 32 <DevID> 0E 10 00 01 00 0C 00 <Page> ... data ... F7`
  - **Length**: 1015 wire bytes per page (875 decoded bytes after 7-to-8 bit conversion).
  - **Content**: The payload contains packed preset data structures with embedded slot indices.

#### 4b. Request Current Edit Buffer (Two Parts)
**Format**: `F0 00 20 32 <DevID> 0E 50 01 00 <Part> F7`
  - `Part`: `00` (Part 0) or `01` (Part 1)
- **Response**: `F0 00 20 32 <DevID> 0E 10 <Part> ... data ... F7`
  - **Part 0 Length**: typically 1015 wire bytes (875 decoded bytes)
  - **Part 1 Length**: typically 911 wire bytes (784 decoded bytes)
- **Notes**: This is used by `Ultradrive.cpp` for real-time state sync.

### 5. Bulk Preset Sync Protocol
To sync all 60 internal presets, you must request **Pages 0-11**.
```
For page = 0 to 11:
    Send: F0 00 20 32 00 0E 50 00 00 <page> F7
    Receive: Page Data (7-bit encoded, ~1015 bytes)
    Decode: Convert 7-to-8 bit encoding (~875 bytes decoded)
    Extract: Scan for 8-char names, read slot index at (name_offset - 2)
```
**Extraction Algorithm**:
1. Find 8-character printable ASCII strings (preset names are space-padded)
2. Read the byte at `name_offset - 2` to get the slot index (0-59)
3. Map to UI slot number: `slot_index + 1`

**Note**: Empty slots have no data in the page dump; only named presets appear.
**New observation**: After clearing all presets, the device may respond only to page 0 and then **timeout** on page 1.
Treat a missing page response as the **stop condition** when dumping presets (rather than assuming all 12 pages exist).

### 6. Full Memory Restore (Computer -> Device) Protocol (Verified 2026-01-04)

The "Restore" function (uploading a full `.dcx` file from **Computer TO Device**) uses a **Pull-Based Protocol**. The device actively requests data pages from the computer.

**Direction Terminology:**
*   **Computer -> Device (Upload/Restore)**: Writing data to the DCX2496.
*   **Device -> Computer (Download/Backup)**: Reading data from the DCX2496.

**Protocol Overview:**
1.  **Initialization**: Computer sends Identify (`0x40`) and Listen Mode (`0x3F`) commands.
2.  **Phase 1 - Main Memory Sync**: Syncs the 12 memory pages (Presets).
    *   Computer sends Page 0 unsolicited.
    *   Device requests subsequent Pages 1-11 sequentially.
3.  **Phase 2 - Current State Sync**: Syncs the active Edit Buffer settings.
    *   Computer sends Page 0 (Type 01) unsolicited.
    *   Device requests Page 1 (Type 01).

## Unified Parser V2 (New Architecture)

The parser uses `src/structure.ts` as the single source of truth for parameter ordering.

### Key Findings (Verified 2026-01-09)

**Edit Buffer Layout:**
- XPCR signature at absolute offset 7
- Preset name at absolute offset 79 (8 bytes)
- Setup parameters follow the pattern in `EDIT_BUFFER_SETUP_PARAMETERS`
- Cursor starts at offset 1 for sequential parsing

**Preset (.dcx) Layout:**
- XSNP signature at absolute offset 7 (decoded data)
- Preset name at absolute offset 83 (skip 76 bytes from XSNP)
- Setup parameters follow immediately after name
- 4-byte offset difference vs edit buffer (83 - 79 = 4)


### Parsers
- `preset-parser.ts`: Parses `.dcx` files and SysEx Memory Dumps.
- `edit-buffer-parser.ts`: Parses the real-time Edit Buffer (Msg Type 0x01).
- `dcx-file.ts`: Parses full `.dcx` files with all 60 preset slots.

### Integration Tests
- `src/fixtures/integration.test.ts`: Verifies parser output matches captured device state
- Edit buffer parsing verified against browser-captured JSON
- Preset 0 vs Preset 36 comparison confirms factory preset duplication

## Installation Key Sequence
```
APP->DEV: F0 00 20 32 20 0E 40 F7  (Identify - Note ID 20?)
### 6. Full Memory Restore (Computer -> Device) Protocol

**Direction:** Computer -> Device (Restore / Upload)
**Status:** **VERIFIED (Pull-Based)**

> [!IMPORTANT]
> The "Store Preset" function in the official `DCX-Remote` software works by updating the computer's internal memory model and then performing this **Full Memory Restore**. There is NO distinct single-preset "Store" command used by the PC software for this operation. It always syncs the entire memory (Pages 0-11) and the current edit buffer (Type 01).

This protocol was previously hypothesized to be Push-based (INIT_SYNC), but trace analysis confirms it is **Pull-based** driven by the device.

#### Phase 1: Main Memory Sync (Pages 0-11)
1.  **Computer** sends `CMD_40` (Identify) and `CMD_3F` (Listen Mode).
2.  **Computer** sends **Page 0** (Type 00, Bank 00) *unsolicited*.
3.  **Device** parses Page 0. If successful, it requests **Page 1**.
    *   Command: `CMD_50` (DUMP_REQ)
    *   Format: `F0 00 20 32 00 0E 50 00 00 01 F7` (Request Type 00, Page 01)
4.  **Computer** sends **Page 1** (Type 00).
5.  Process repeats for Pages 2 through 11.

#### Phase 2: Current State Sync (Edit Buffer)
1.  After Page 11 is acknowledged/processed, the **Computer** sends **Page 0 of Type 01** (Current State) *unsolicited*.
    *   Note: The `DUMP_RESP` header for Type 01 uses `01` in the Bank field: `F0 00 20 32 00 0E 10 01 01 00 ...`
2.  **Device** requests **Page 1 of Type 01**.
    *   Command: `CMD_50` (DUMP_REQ)
    *   Format: `F0 00 20 32 00 0E 50 01 00 01 F7` (Request Type 01, Page 01)
3.  **Computer** sends **Page 1 of Type 01**.
4.  Transaction complete.

#### Command Reference
*   **CMD_50 (DUMP_REQ):** `F0 00 20 32 00 0E 50 <Type> <Bank> <Page> F7`
    *   `Type`: 00 (Memory), 01 (Current State)
    *   `Bank`: 00 (Always 00 for requests seen so far)
    *   `Page`: The page number requested (0x00 - 0x0B)

### 7. Device Status Notifications (Unsolicited)

**Direction:** Device -> Computer
**Status:** **OBSERVED**

Observed specifically when storing a preset via the device's front panel.

*   **Flash Erase Notification:** `F0 65 72 61 73 65 20 <ASCII_Digit> F7`
    *   **Examples Uncovered:**
        *   `"erase 6"` (Hex `36`) observed when storing to **Slot 24**.
        *   `"erase 7"` (Hex `37`) observed when storing to **Slot 60** (Last Preset).
    *   **Meaning:** Unknown. The digit varies, seemingly related to the internal memory address or operation type, but the exact mapping is unconfirmed.
    *   **Reliability:** Not always observed. Storing to Slot 1 ("First Preset") did not generate a captured message in one test instance. This message should be treated as an opaque status indication.


### 6b. Legacy/Alternative "Write Preset" (Push Protocol)
*Note: This protocol was observed in documentation but is NOT used for the main "Restore" function.*

The `INIT_SYNC` (`0x12`) command followed by an ACK (`0x52`) suggests a handshake-based Push protocol, possibly used for:
*   Saving a single preset to the device?
*   Firmware updates?
*   Different hardware revisions?

**Do not use this for Full Memory Restore.** The device does not respond to `INIT_SYNC` in the context of a full backup restore.

### 7. Checksum Calculation (Verified)

The checksum for data packets (CMD `0x10`) uses a **non-standard algorithm** unique to the DCX2496.

#### Packet Structure
```
Index:  0   1-3       4      5      6     7-12    13+        -2       -1
Data:  F0  Vendor   DevID  Model   CMD   Header  DATA...  Checksum   F7
```

#### Checksum Formula
```python
def calculate_checksum(data_bytes):
    """
    Calculate DCX2496 SysEx data checksum.
    
    Args:
        data_bytes: packet[13:-2] - the DATA portion only
    """
    total = sum(b + 1 for b in data_bytes)
    return (~total) & 0x7F
```

**Key Points:**
- **Sum (byte + 1)**: Each byte is incremented by 1 BEFORE adding to the sum
- **Bitwise NOT**: Apply `~` (NOT) to the sum, then mask with `0x7F`
- **Data Only**: Checksum covers `packet[13:-2]` (excludes 13-byte header and checksum+F7)

> ⚠️ This is NOT the standard Roland/Behringer checksum `(128 - sum%128) & 0x7F`

#### Verification
Tested against 13 captured packets from DCX-Remote.exe - all match.
See `test_checksum.py` for automated verification.

---

### 8. DCX File Format (`.dcx`)

The `.dcx` file format stores preset data in a binary structure. This is the same data format used for backup/restore via SysEx.

**Important**: The file size is **variable** - it depends on how many presets are stored. An empty device produces a minimal file (~167 bytes), while a device with many presets can produce up to ~10,576 bytes (12 pages).

#### File Structure Overview

| Offset | Size | Description |
|--------|------|-------------|
| 0x0000 | 4 | `XSNP` signature |
| 0x0004 | 4 | Version (typically `01 00 00 00`) |
| 0x0008 | 4 | Data length (little-endian, **variable**) |
| 0x000C | 0x40 | Lock flags (60 bytes, one per slot - 0=unlocked, 1=locked) |
| 0x004C | 1440 | Preset 1 - Full format (720 words × 2 bytes) |
| 0x05EC+ | variable | Presets 2-60 - Compact delta format |

**Preset Slot Layout:**
- **Slots 1-24**: User-editable presets (unlocked by default)
- **Slots 25-36**: Additional user slots (empty on factory reset)
- **Slots 37-60**: Factory preset copies (locked, indices 36-59)

**Observed file sizes**:
- Empty device (no presets): 167 bytes (0 pages)
- Factory presets: ~9,698 bytes
- Full presets: up to ~10,576 bytes (12 pages)


#### Full vs. Compact Storage (Crucial Finding)

There are **two distinct formats** used within the same file:

1.  **Slot 1 / Full Preset (Pages 0-1)**:
    *   **Location**: Starts at offset `0x004C` (page 0), continues into page 1.
    *   **Structure**: Page 0 contains a 7-byte preamble + XSNP header, then preset data.
    
    **Page 0 Layout (verified from device)**:
    ```
    Offset 0-6:    Preamble [LenLo LenHi 00 00 00 00 00]
    Offset 7-82:   XSNP header (76 bytes)
    Offset 83+:    Full preset data starts here
    ```
    
    **Full Preset Data Format** (16-bit words, little-endian, verified from device):

    ```
    GLOBAL SECTION (Words 0-20):
    ├── Words 0-3:    Preset name (8 bytes ASCII, space-padded)
    ├── Word 4:       Output Config copy (always identical to word 5, purpose unknown)
    ├── Word 5:       Output Config (0=Mono, 1=LMH-LMH, 2=LL-MM-HH, 3=LH-LH-LH)
    ├── Word 6:       Delay On A (0=off, 1=on)
    ├── Word 7:       Delay On B (0=off, 1=on)
    ├── Word 8:       Delay On C (0=off, 1=on)
    ├── Word 9:       Delay On Sum (0=off, 1=on)
    ├── Word 10:      Air Temperature (40 = 20°C, divide by 2)
    ├── Words 11-14:  Input Gains [A, B, C, Sum] (150 = 0dB)
    └── Words 15-18:  Input Mutes [A, B, C, Sum] (0=unmuted, 1=muted)
    └── Words 19-20:  Reserved (always 0)

    INPUT A BLOCK (Words 21-82, 62 words):
    ├── Words 21-30:  Dynamic EQ (10 words):
    │   ├── Word +0:  attack (index into attackTimes)
    │   ├── Word +1:  release (index into logZeroTo4000Ms)
    │   ├── Word +2:  ratio (index into eqRatios)
    │   ├── Word +3:  threshold (0-600, 600=0dB)
    │   ├── Word +4:  switch (0=off, 1=on)
    │   ├── Word +5:  freq (0-320 index)
    │   ├── Word +6:  Q (0-40 index)
    │   ├── Word +7:  gain (0-300, 150=0dB)
    │   ├── Word +8:  filter type (0=low shelf, 1=bandpass, 2=high shelf)
    │   └── Word +9:  shelving slope
    ├── Words 31-75:  Regular EQ bands 1-9 (9 × 5 words, starting at section+10)
    │   └── Each: [freq_idx, Q_idx, gain, filter_type, slope]
    └── Words 76-82:  Trailing data [Gain, Mute, DelayOn, etc.]

    INPUT B BLOCK (Words 83-144, same 62-word structure)
    INPUT C BLOCK (Words 145-206, same 62-word structure)
    SUM BLOCK (Words 207-268, same 62-word structure)

    OUTPUT 1 BLOCK (Words 269-342, 74 words):
    ├── Words 269-272: 4-word prefix/header
    ├── Words 272-278: Dynamic EQ (7 words, same structure as inputs)
    ├── Words 279-323: Regular EQ bands 1-9 (9 × 5 words, starting at section+10)
    └── Words 324-342: Crossover & settings block

    OUTPUT 2-6 BLOCKS: Same 74-word structure at +74 words each
    ```

    **Verified Channel Start Offsets** (word index from preset data start):
    | Channel   | Word Offset | Description |
    |-----------|-------------|-------------|
    | Input A   | 21          | First input |
    | Input B   | 83          | +62 words   |
    | Input C   | 145         | +62 words   |
    | Sum       | 207         | +62 words   |
    | Output 1  | 269         | First output |
    | Output 2  | 343         | +74 words   |
    | Output 3  | 417         | +74 words   |
    | Output 4  | 491         | +74 words   |
    | Output 5  | 565         | +74 words   |
    | Output 6  | 639         | +74 words   |

    **EQ Section Structure** (verified 2026-01-03):
    - 4-word prefix at section start
    - 6-word Dynamic EQ block (always present, even when disabled)
    - Regular EQ bands start at section_start + 10
    - 9 bands × 5 words = 45 words for regular EQ
    
    **Output Crossover/Settings Block** (17 words at channel_offset + 55):
    ```
    Offset  Example   Parameter
    ------  -------   ---------
    +0      9         Channel Name index (into outputNames)
    +1      0         Source (0=A, 1=B, 2=C, 3=Sum)
    +2      6         HP Filter Type (0=Off, 6=But24, etc.)
    +3      0         HP Frequency index (0=20Hz, 124=296Hz)
    +4      6         LP Filter Type
    +5      124       LP Frequency index
    +6      0         Reserved (always 0)
    +7      240       Long Delay
    +8      141       Short Delay
    +9      0         Polarity (0=Normal, 1=Inverted)
    +10     0         Phase (0-359°)
    +11     0         Reserved (always 0)
    +12     150       Gain (150=0dB)
    +13     0         Mute (0=unmuted, 1=muted)
    +14     0         Limiter On (0=Off, 1=On)
    +15     0         Limiter Threshold
    +16     0         Limiter Release (index into logZeroTo4000Ms)
    ```
    
    **EQ Band Format** (5 words per band, 9 bands per channel):
    ```
    [freq_idx, Q_idx, gain, filter_type, slope]
    ```
    - **freq_idx**: Index into `logFrequencyScale` (0-322 → 20Hz-20kHz)
    - **Q_idx**: Index into `EQ_Q_VALUES` (0-40 → 0.1-10)
    - **gain**: Raw value (150 = 0dB, range 0-300 = -15dB to +15dB)
    - **filter_type**: 0=Off, 1=Parametric, 2=Low Shelf, 3=High Shelf, 4=Low Pass, 5=High Pass
    - **slope**: 0 or 1
    
    **Default EQ Band**: `[180, 20, 150, 1, 1]` = 1kHz, Q=1.0, 0dB, Parametric
    
    **Crossover Filter Encoding** (verified):
    ```
    0=Off, 1=But6, 2=But12, 3=Bes12, 4=LR12, 5=But18, 
    6=But24, 7=Bes24, 8=LR24, 9=But48, 10=LR48
    ```

2.  **Compact Preset Directory + Data (Pages 2-11)**:
    *   **Directory Record**: 14 bytes
        `[ptr_lo ptr_hi slotIndex 0x00][name 8 bytes][0x00 0x00]`
    *   **Pointer**: signed 16-bit relative offset from record start to data block.
    *   **Preset Data**: 16-bit word arrays (little-endian).
      Confirmed segments (slot 25 block):
        - Input A gain/mute/delay are stored before the pointer target (negative indices).
        - Output 1 basic params `[gain, mute, delayOn, delayValue]`.
        - Output 1 EQ bands `[freq, Q, gain, filter, slope]` × 9.
        - Output 1 xover/limiter group `[source, hpFilter, hpFreq, lpFilter, lpFreq, limiterOn, limiterThresh, limiterRelease, polarity, phase, shortDelay]`.

#### Preset Slot Index Location

Each compact preset has its **slot index (0-59)** stored at **byte offset -2** before the 8-character name:

```
Pattern: [ptr_lo, ptr_hi, SLOT_INDEX, 0x00] [NAME (8 bytes)] [00 00]
```

#### Presets 2-60 (Compact Format Details)

Variable size: 80-430 bytes each. Contains differential/key settings.
The decoder must iterate through `[ID, Value]` pairs until a termination condition is met.

#### Channel Names (UTF-16LE)

Located at offset ~0x05F0 within Preset 1 data:
- Input A: `LEFT IN`
- Input B: `RIGHT IN`
- Input C: `INPUT C`
- Sum: `SUM`

#### Slot Summary (60 slots)

From factory-presets.dcx analysis (verified 2026-01-09):
- **Slots 1-24**: User-editable presets (copies of factory, unlocked)
- **Slots 25-36**: Additional user slots (may be empty)
- **Slots 37-60**: Factory presets (locked, read-only via device)

---


#### Directory Entry Structure (14 bytes)

```
Offset 0-1:   Total Entry Size (ptr) - 16-bit little-endian
Offset 2:     Slot Index (1-59, maps to Preset 2-60)
Offset 3:     0x00
Offset 4-11:  Name (8 bytes ASCII, space-padded)
Offset 12-13: 0x00 0x00 (entry terminator)
```

**Key Fields:**
- **ptr**: Total size of directory entry + delta data. If ptr ≤ 14, no delta data exists (preset uses Preset 1 defaults).
- **Delta data length**: `ptr - 14` bytes
- **Delta data location**: Immediately after the 14-byte directory entry (at entry offset + 14)

#### Delta Data Format (Skip/Count RLE)

The delta data uses run-length encoding with skip/count pairs:

```
[skip_lo, skip_hi, count_lo, count_hi, value_1_lo, value_1_hi, ..., value_N_lo, value_N_hi]
```

**Fields:**
- **skip**: Number of words to skip (16-bit little-endian)
- **count**: Number of consecutive words to write (16-bit little-endian)
- **values**: `count` × 16-bit word values to write

**Terminator:** skip=0, count=0 ends the delta block.

#### Critical: Word Index Offset (+10 bytes)

Delta word indices are relative to **byte 10** of the preset (after 8-byte name + 2-byte padding), NOT byte 0.

```
Preset 1 Structure:
├── Bytes 0-7:   Preset Name (8 bytes ASCII)
├── Bytes 8-9:   Padding (0x00 0x00)
├── Byte 10:     outputConfig starts here ← Delta word 0
├── Byte 12:     inputSumType ← Delta word 1
└── ...etc
```

**Correct byte offset formula:**
```
byteOffset = PRESET_1_OFFSET + 10 + (wordIndex × 2)
```

#### Delta Application Algorithm

```typescript
// 1. Start with Preset 1 data as template
const buffer = preset1Data.slice();

// 2. Apply each delta block
let wordIndex = 0;
while (deltaPtr < deltaEnd) {
  const skip = readU16LE(data, deltaPtr);
  const count = readU16LE(data, deltaPtr + 2);
  deltaPtr += 4;
  
  if (skip === 0 && count === 0) break; // Terminator
  
  wordIndex += skip;
  
  for (let i = 0; i < count; i++) {
    const value = readU16LE(data, deltaPtr);
    deltaPtr += 2;
    
    // Apply at byte offset +10 (after name + padding)
    const byteOffset = 10 + wordIndex * 2;
    buffer[byteOffset] = value & 0xFF;
    buffer[byteOffset + 1] = (value >> 8) & 0xFF;
    wordIndex++;
  }
}
```

#### Example: MONO Preset Delta

The MONO preset (Slot 21) changes outputConfig from 1 (lmhlmh) to 0 (mono):

```
Delta data: 00 00 01 00 00 00 03 00 03 00 00 00 ...
Parsed:
  skip=0, count=1, value=0  → word 0 = 0 (outputConfig = mono)
  skip=3, count=3, values=[0,0,0] → words 4-6 updated
  ...
```

**Verified Results:**
- Preset 0 (2*3WAY): outputConfig = lmhlmh ✓
- Preset 20 (MONO): outputConfig = mono ✓  
- Preset 36 (2*3WAY locked): outputConfig = lmhlmh ✓
- Preset 56 (MONO locked): outputConfig = mono ✓

---




## Implementation Recommendations
1.  **Device ID**: Use `00` for unicast or `20` for broadcast if you want to reach any connected unit.
2.  **Timing**: Since `Recall` provides no feedback, implement a small delay (e.g., 200ms) after sending the command before sending subsequent parameter updates.
3.  **Verification**: 
    - You can verify a `Store` or `Recall` by performing a `Dump` (`0x50`) before and after to compare the checksum or content.
    - Our verification script successfully used this method: `Dump -> Store(P5) -> Recall(P1) -> Dump -> Recall(P5) -> Dump`. The final state matched the initial state.

---

## Parser Implementation

A complete Python parser is available at `dcx-parser/dcx_parser.py`:

```bash
python3 dcx_parser.py your_file.dcx
```

**Features:**
- Parses Slot 1 (Full Preset) with fixed offsets
- Parses Slots 2-60 (Compact Presets) using delta format
- Decodes crossover filter types and frequencies
- Detects factory default presets
- Outputs formatted preset summary

### Compact Preset Structure (Verified Nibble-Packed RLE)
Verified through hex dump analysis of `0x4210b0` logic on `eq.dcx`:

**RLE Format**:
- **Decoding**: RLE Commands are 16-bit Words (Little Endian).
- **Nibble Packing**: The Command Word encodes `Skip` and `Count` in its low byte.
  - `Skip = (CmdByte & 0xF0) >> 4`
  - `Count = (CmdByte & 0x0F)`
  - *Example*: `0xB0` (0x000B Little Endian) -> `Skip 0`, `Count 11` (0xB).
  - *Example*: `0x97` (0x0097 Little Endian) -> `Skip 9`, `Count 7`.
- **Extended Count**:
  - If `Count == 0` (e.g., `Cmd = 0x0000`), the `Count` is read from the **next distinct 16-bit word**.
  - This handle cases where count exceeds 15 or fitting issues.

**Template**:
- The parser must start with a **Zero-Initialized Buffer**.
- Using `Preset 1` as a template is **INCORRECT** and causes phantom values.

**Filter Types**:
- `0`: Off (Correctly handled by zero-init)
- `1`: Low Shelf
- `2`: Bandpass
- `3`: High Shelf


#### EQ Band Data Structure (Verified 2026-01-03)
- **Stride**: 10 Bytes (5 Words)
- **Field Order**: `[Freq, Q, Gain, Type, Slope]` (Verified)
- **Word Size**: 16-bit Little Endian

| Word Offset | Parameter | Encoding | Notes |
|-------------|-----------|----------|-------|
| 0 | Frequency | Index into `LOG_FREQUENCY_SCALE` | `180` = 1000 Hz |
| 1 | Q-Factor | Index (0-40) | Index into `EQ_Q_VALUES`. `20` = Q 1.0 |
| 2 | Gain | Raw Value | `150` = 0.0 dB, `151` = +0.1 dB (0.1dB steps) |
| 3 | Filter Type | Index | `0`=Off, `1`=Parametric, `2`=Low Shelf, `3`=High Shelf |
| 4 | Slope | Index | `0`=6dB, `1`=12dB |

#### Channel EQ Structure (Verified 2026-01-07)
**Unified Structure Finding**: 
Both Input and Output channels share an idential **124-byte** stride structure.
- **Prefix**: 34 bytes (Contains Basic Params + Dynamic EQ)
- **EQ Bands**: 9 Bands × 10 bytes = 90 bytes.
- **Total**: 34 + 90 = 124 bytes.

**Dynamic EQ Mapping (Verified)**:
Located within the 34-byte prefix (Offsets relative to channel start):
- **+14**: Attack
- **+16**: Release
- **+18**: Ratio
- **+20**: Threshold
- **+22**: On/Off Flag (boolean)
- **+24**: Q-Factor (Inferred)
- **+26**: Frequency (Index)
- **+28**: Gain (Raw, 150=0dB)
- **+30**: Type
- **+32**: Shelving

**Input Channels**:
- Input A: Offset 121
- Input B: Offset 245
- Input C: Offset 369
- Sum: Offset 493

**Output Channels**:
- Same 124-byte structure + Extra Params block follows.


---

### 10. Unmapped Byte Analysis (2026-01-03)

Analysis of all 720 preset data words to identify bytes not mapped by commands.ts syncResponse indices.

#### Global Header (Words 0-20) - Detailed Analysis

| Word | Value Range | Mapped? | Description |
|------|-------------|---------|-------------|
| 0-3  | ASCII       | No      | Preset name (8 bytes, space-padded) |
| 4    | 0-3         | No      | OUTPUT_CONFIG copy (always identical to word 5) |
| 5    | 0-3         | Yes     | OUTPUT_CONFIG (0=Mono, 1=LMH-LMH, 2=LL-MM-HH, 3=LH-LH-LH) |
| 6    | 0-1         | Yes     | DELAY_ON_A |
| 7    | 0-1         | Yes     | DELAY_ON_B |
| 8    | 0-1         | Yes     | DELAY_ON_C |
| 9    | 0-1         | Yes     | DELAY_ON_SUM |
| 10   | 40          | Yes     | Temperature (constant 40 = 20°C) |
| 11   | 150         | Yes     | GAIN_A (constant 150 = 0dB in factory presets) |
| 12   | 150         | Yes     | GAIN_B |
| 13   | 150         | Yes     | GAIN_C |
| 14   | 150         | Yes     | GAIN_SUM |
| 15   | 0-1         | Yes     | MUTE_A |
| 16   | 0           | Yes     | MUTE_B (always 0 in factory presets) |
| 17   | 0-1         | Yes     | MUTE_C |
| 18   | 0-1         | Yes     | MUTE_SUM |
| 19   | 0           | No      | Reserved (always 0) |
| 20   | 0           | No      | Reserved (always 0) |

#### Observations

1. **Word 4 (OUTPUT_CONFIG copy)**: Always identical to word 5. Purpose unknown - possibly legacy compatibility or redundant storage for integrity checking.

2. **Words 10-12 (Default values)**: Temperature (40) and gains (150) are constant in factory presets. These appear to be default/fallback values.

3. **Words 19-20**: Always 0 - reserved/padding bytes.

4. **Channel Section Prefixes**: Each input/output section has a 4-word prefix before Dynamic EQ data. The first 2 words in these prefixes are unmapped but appear to contain metadata (possibly EQ enable flags or section markers).

#### Remaining Unmapped Positions

Within channel sections, the following word offsets relative to section start are not mapped:

- **Input sections (62 words each)**: Words 0, 1 of 4-word prefix
- **Output sections (74 words each)**: Words 0, 1 of 4-word prefix; word 6 in settings block; words 11, 17, 18 in trailing data

These unmapped positions contain values that vary by preset type but their exact function is not confirmed. The parser treats them as opaque data preserved during delta encoding.


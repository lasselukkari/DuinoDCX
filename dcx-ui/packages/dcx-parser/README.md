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

### 2. Recall Preset (`0x52`)
Used to load a preset from the device's internal memory into the active edit buffer.
- **Format**: `F0 00 20 32 <DevID> <ModelID> 52 <PresetNumber> F7`
- **Example**: `F0 00 20 32 00 0E 52 01 F7` (Recall Preset 1)
- **Behavior**: This appears to be a "fire-and-forget" command. The device does not send an Acknowledge (ACK) response.
  - **Note**: In the DCX-Remote capture (`capture.log`), the app did not send `0x52` for recall.
    It used `0x10` write blocks after setting transmit mode.

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

### 4. Store Preset (`0x53`)
Used to save the current settings to a preset slot.
- **Format**: `F0 00 20 32 <DevID> <ModelID> 53 <PresetNumber> F7`
- **Example**: `F0 00 20 32 00 0E 53 01 F7` (Store to Preset 1)
- **Behavior**: Likely "fire-and-forget". *Caution: This overwrites data.*
  - **Note**: In the DCX-Remote capture (`capture.log`), the app did not send `0x53` for store.
    It used `0x10` write blocks to update memory pages.

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

#### Step 1: Initialization Key Sequence
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
| 0x000C | 0x40 | Reserved (observed zeros in dumps) |
| 0x004C | variable | Memory pages, each 875 decoded bytes (0-12 pages) |

**Observed file sizes**:
- Empty device (no presets): 167 bytes (0 pages)
- Partial presets: 8,126 bytes (9 pages)  
- Full presets: 10,576 bytes (12 pages)


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

From TEST.dcx analysis:
- **Slots 1-24**: Named presets
- **Slots 25-36**: Empty (no data)
- **Slots 37-60**: Named presets

---

### 9. Compact Preset Delta Format (Verified 2026-01-03)

The "Mono" preset (Slot 21) uses a **Compact Preset** format with delta encoding, which differs from the fixed-offset Full Preset format (Slot 1).

#### Compact Preset Header
Each compact preset entry begins with a 14-byte directory record:
```
Offset 0-1:  Pointer (signed 16-bit) to data block relative to start of record
Offset 2:    Slot Index (0-59, e.g., 20 for Slot 21)
Offset 3:    0x00
Offset 4-11: Name (8 bytes ASCII, space-padded)
Offset 12-13: 0x00 0x00
```
- A `Pointer` value <= 14 indicates no data block; the preset uses factory defaults.
- A `Pointer` > 14 indicates a variable-length data block follows.

#### Delta Data Block
The data block contains a sequence of modified parameters.
- **Values are 16-bit words.**
- **Crossover Parameters**: For Config 1 (Stereo 3-way), Crossover settings (HP/LP Type/Freq) appear as a sequence in the delta block.
    - Example Verified: `06 00 08 01` -> `0006` (HP Type 6/But24), `0108` (HP Freq Index 264)
- **Misalignment Risk**: Treating this variable-length block as a fixed-offset structure leads to reading garbage values (e.g., interpreting `0006` as "Source" instead of "HP Type").

#### Configuration Defaults
- **Output Config 1 (Stereo 3-way)**:
    - Outputs 1, 2, 3: "Low", "Mid", "High" (Left)
    - Outputs 4, 5, 6: "Low", "Mid", "High" (Right)
    - **Correction**: Previous assumption of "Full-range" default was incorrect for this mode. Parser must use these defaults when explicit names are not present in the delta block.

---


### 9. Compact Preset Delta Format (Verified 2026-01-01)

Live device testing with Slot 25 confirmed the compact preset delta format uses **variable-length encoding**.

#### Test Methodology

1. **Store MONO preset to Slot 25** via device front panel
2. **Dump baseline** - full memory pages to `slot25_baseline.dcx`
3. **Make single parameter change** on device (e.g., HP freq 21Hz → 22Hz)
4. **Dump changed state** to `slot25_changed.dcx`
5. **Binary diff** to find exact byte offset

#### Key Finding: Variable-Length Delta Encoding

The compact format stores **only modified parameters** relative to factory defaults.

**Storage Behavior:**
| Scenario | Storage | Explanation |
|----------|---------|-------------|
| Store factory preset (no changes) | 14-byte entry only | `ptr` is small (≤14), meaning "use factory" |
| First modification | Entry + delta block | Delta block created with changed values |
| Additional modifications | Delta block grows | Each param adds ~4-14 bytes |

**Why payload barely changes when storing factory preset:**
- Factory presets are stored in **ROM at 0x70000+**
- When ptr ≤ ENTRY_SIZE (14), the device uses ROM defaults
- No delta data needs to be stored

#### Delta Block Structure (Confirmed via Slot 25)

```
Offset  Value   Meaning
------  -----   -------
+0      255     Block marker (0xFF)
+2        1     Output number (Output 1)
+4      160     Gain value (+1dB, where 150=0dB)
+6       61     Param offset in factory preset data
+8        6     Delay param ID?
+10       1     Delay value (1ms)
+12       0     Padding
+14       8     HP filter (lr24)
+16       4     HP freq index (22Hz)
+18       6     LP filter (but24)
+20      64     LP freq index (~700Hz)
```

#### Factory Preset Location (Discovered in ROM)

Factory presets are at **0x70000+** in the 512KB ROM dump:
- MONO at 0x7184a
- 3WAY at 0x71f3a
- LH LH LH at 0x71a96
- 5.1FRONT at 0x71164

They use the **same 14-byte entry format** (ptr, slot, name, terminator).

#### Crossover Parameters (First in Block)

When crossovers are the **first modified parameters**, they appear at word offset 0 from the data block start:

| Word Offset | Parameter | Example Values |
|-------------|-----------|----------------|
| +0 | HP Filter Type | 8 = lr24 |
| +1 | HP Frequency Index | 4 = 22Hz (index into FREQ_TABLE) |
| +2 | LP Filter Type | 6 = but24 |
| +3 | LP Frequency Index | 64 = ~700Hz |

**Test Results:**
- Changing HP filter type (but24 → lr24): **1 word changed** at offset 0
- Changing HP frequency (21Hz → 22Hz): **1 word changed** at offset 1

> ⚠️ These offsets are only valid when crossover is the FIRST modification. Adding other parameters (Gain, Delay) inserts data before crossover, shifting the offsets.

#### Entry Size Pattern

Each parameter modification adds ~14 bytes to the data block. This matches the **directory entry size** (14 bytes), suggesting parameters may use a similar `[id, value, metadata]` structure.

#### Filter Type Encoding (Verified)

| Value | Filter |
|-------|--------|
| 0 | off |
| 1 | but6 |
| 2 | but12 |
| 3 | bes12 |
| 4 | lr12 |
| 5 | but18 |
| 6 | but24 |
| 7 | bes24 |
| 8 | lr24 |
| 9 | but48 |
| 10 | lr48 |

#### Frequency Index Table (Partial)

| Index | Frequency |
|-------|-----------|
| 0 | 20 Hz |
| 1 | 21 Hz |
| 2 | 22 Hz |
| 3 | 23 Hz |
| 4 | 24 Hz |
| ... | ... |
| 64 | ~700 Hz |
| 124 | 20000 Hz |

See `dcx-parser/dcx_parser.py` for the complete frequency table (125 entries).

#### Parser Strategy for Variable-Length Format

To parse compact presets correctly:

1. **Find preset entry** using the 14-byte directory structure
2. **Follow ptr** to get data block start
3. **Parse entries** until end of block (entry count may be stored in header)
4. **Apply deltas** to factory preset defaults

The current parser (`dcx_parser.py`) handles the simple case where crossovers are first. Full parsing of all parameters requires decoding the entry format.

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
- **Field Order**: `[Freq, Q, Gain, Type, Slope]`
- **Word Size**: 16-bit Little Endian

| Word Offset | Parameter | Encoding | Notes |
|-------------|-----------|----------|-------|
| 0 | Frequency | Index into `LOG_FREQUENCY_SCALE` | `180` = 1000 Hz |
| 1 | Q-Factor | Index (0-40) | Index into `EQ_Q_VALUES`. `20` = Q 1.0 |
| 2 | Gain | Raw Value | `150` = 0.0 dB, `151` = +0.1 dB (0.1dB steps) |
| 3 | Filter Type | Index | `0`=Off, `1`=Parametric, `2`=Low Shelf, `3`=High Shelf |
| 4 | Slope | Index | `0`=6dB, `1`=12dB |

#### Channel EQ Structure (Verified 2026-01-03)
Both Input and Output channels share the same internal structure:
- **4-word prefix** at section start
- **6-word Dynamic EQ** (threshold, switch, freq, Q, gain, filter, slope) - always stored regardless of enabled/disabled
- **45-word Regular EQ** (9 bands × 5 words) starting at section offset +10
- **Trailing data** (gain, mute, delay, etc.)

**Input Channels**: 62 words total, starting at word 21
**Output Channels**: 74 words total (extra crossover data), starting at word 269

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

These unmapped positions contain values that vary by preset type but their exact function is not confirmed. The parser treats them as opaque data preserved during delta encoding


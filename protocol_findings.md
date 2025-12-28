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

### 3. Store Preset (`0x53`)
Used to save the current settings to a preset slot.
- **Format**: `F0 00 20 32 <DevID> <ModelID> 53 <PresetNumber> F7`
- **Example**: `F0 00 20 32 00 0E 53 01 F7` (Store to Preset 1)
- **Behavior**: Likely "fire-and-forget". *Caution: This overwrites data.*

### 4. Request Preset Dump (`0x50`)

There are TWO formats for this command:

#### 4a. Request Specific Preset Slot (Captured from DCX-Remote)
**Format**: `F0 00 20 32 <DevID> 0E 50 00 00 <Slot> F7`
  - `Slot`: `00` to `3B` (0-59, for presets 1-60)
- **Response**: `F0 00 20 32 <DevID> 0E 10 00 01 00 0C 00 <Slot> ... data ... F7`
  - **Length**: 1015 bytes per slot
  - **Preset Name**: Located in decoded payload (8 chars, space-padded)
- **Example**: `F0 00 20 32 00 0E 50 00 00 00 F7` → Get preset slot 1
- **Example**: `F0 00 20 32 00 0E 50 00 00 3B F7` → Get preset slot 60

#### 4b. Request Current Edit Buffer (Two Parts)
**Format**: `F0 00 20 32 <DevID> 0E 50 01 00 <Part> F7`
  - `Part`: `00` (Part 0) or `01` (Part 1)
- **Response**: `F0 00 20 32 <DevID> 0E 10 <Part> ... data ... F7`
  - **Part 0 Length**: ~1015 bytes
  - **Part 1 Length**: ~911 bytes
- **Notes**: This is used by `Ultradrive.cpp` for real-time state sync.

### 5. Bulk Preset Sync Protocol
To sync all 60 internal presets (as DCX-Remote does):
```
For slot = 0 to 59:
    Send: F0 00 20 32 00 0E 50 00 00 <slot> F7
    Receive: 1015 bytes response containing preset data + name
```
**Captured Traffic Verification**: DCX-Remote sends 34 sequential `50 00 00 XX` requests during "Sync Internal Presets" operation.

### 6. Write Preset TO Device Protocol (`0x12` + `0x10`)

To write a `.dcx` file to the device (Restore/Sync TO Device), the protocol involves a handshake followed by a multi-page transfer.

#### Step 1: Initiate Transfer
Send the "Init Sync" command with the ASCII string "PRESETS".
```
APP->DEV: F0 00 20 32 00 0E 12 00 50 52 45 53 45 54 53 00 00 F7
                               ^^
                               CMD_INIT_SYNC (0x12)
```

#### Step 2: Device Acknowledges
The device responds with an Acknowledge message containing "PRESETS".
```
DEV->APP: F0 00 20 32 00 0E 52 00 50 52 45 53 45 54 53 00 F7
                               ^^
                               ACK (0x52)
```

#### Step 3: Send Header Packet (Type 0x01)
Immediately after receiving the ACK, the app sends the first chunk of data. This "Header Packet" contains the file preamble and signature.
*   **Packet Type**: `0x01` (indicated in the 10th byte of the SysEx body).
*   **Page Number**: `00`
*   **Data Content**: The first ~104 bytes of the *encoded* `.dcx` file.
*   **Preamble Requirement**: The raw data being encoded MUST start with a 7-byte preamble: `50 00 00 00 00 00 00` followed by `XSNP...`.

```
APP->DEV: F0 00 20 32 00 0E 10 00 01 00 01 00 00 ... <Encoded Data> ... F7
                            ^^          ^^    ^^
                           CMD (0x10)  Type  Page
```

#### Step 4: Send Page 0 Packet (Type 0x0C)
Immediately follows the Header Packet. This contains the bulk of the initial data.
*   **Packet Type**: `0x0C`
*   **Page Number**: `00`
*   **Data Content**: The next 1000 bytes of encoded data.

```
APP->DEV: F0 00 20 32 00 0E 10 00 01 00 0C 00 00 ... <1000 bytes Encoded Data> ... F7
                                        ^^    ^^
                                       Type  Page
```

#### Step 5: Loop - Wait for Requests & Send Pages
The device will now request subsequent pages one by one.
*   **Request Format**: `F0 00 20 32 00 0E 50 00 00 <PageNum> F7`
*   **Response Format**: `F0 00 20 32 00 0E 10 00 01 00 0C 00 <PageNum> ... <Data> ... F7`

**Protocol Flow:**
1.  **Device Requests Page 1**: `... 50 00 00 01 F7`
2.  **App Sends Page 1**: `... 10 ... 0C 00 01 ...`
3.  **Device Requests Page 2**: `... 50 00 00 02 F7`
4.  **App Sends Page 2**: `... 10 ... 0C 00 02 ...`
...Repeat until all data is sent.

**Note**: The "Header Packet" and "Page 0" are sent *unsolicited* after the ACK. Subsequent pages are *solicited* by the device.

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

## Implementation Recommendations
1.  **Device ID**: Use `00` for unicast or `20` for broadcast if you want to reach any connected unit.
2.  **Timing**: Since `Recall` provides no feedback, implement a small delay (e.g., 200ms) after sending the command before sending subsequent parameter updates.
3.  **Verification**: 
    - You can verify a `Store` or `Recall` by performing a `Dump` (`0x50`) before and after to compare the checksum or content.
    - Our verification script successfully used this method: `Dump -> Store(P5) -> Recall(P1) -> Dump -> Recall(P5) -> Dump`. The final state matched the initial state.


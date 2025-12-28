# DuinoDCX Developer Guide

This document explains the project structure and how preset/protocol operations work.

## Running DCX-Remote.exe on macOS (Wine + Serial Proxy)

To capture protocol traffic from the original Windows DCX-Remote software:

### Prerequisites

1. Install Wine:
   ```bash
   brew install --cask wine-stable
   ```

2. Install Python dependencies:
   ```bash
   pip install pyserial
   ```

### Step 1: Start the Serial Proxy

The proxy creates a virtual serial port that logs all traffic:

```bash
./venv/bin/python3 serial_proxy.py /dev/cu.usbserial-1430 --log capture.log
```

Output will show:
```
Virtual port created: /dev/ttys006
*** Configure your application to use: /dev/ttys006 ***

To create a symlink for Wine:
    ln -sf /dev/ttys006 ~/.wine/dosdevices/com1
```

### Step 2: Create Wine COM Port Symlink

In a **new terminal** (keep proxy running):

```bash
mkdir -p ~/.wine/dosdevices
ln -sf /dev/ttys006 ~/.wine/dosdevices/com1
```

> ⚠️ The virtual port path (`/dev/ttys006`) varies each time. Check the proxy output.

### Step 3: Launch DCX-Remote in Wine

```bash
wine ./DCX2496_V1_16/DCX2496_V1_16/DCX-Remote.exe
```

In DCX-Remote:
1. Go to **Settings → COM Port** and select **COM1**
2. The device should connect automatically
3. All traffic is now logged to `capture.log`

### Example Session

```bash
# Terminal 1: Start proxy
./venv/bin/python3 serial_proxy.py /dev/cu.usbserial-1430 --log capture.log

# Terminal 2: Create symlink (use the path from proxy output)
ln -sf /dev/ttys006 ~/.wine/dosdevices/com1
wine ./DCX2496_V1_16/DCX2496_V1_16/DCX-Remote.exe

# Perform operations in DCX-Remote (sync, restore, etc.)
# Press Ctrl+C in Terminal 1 when done
```

---

## Useful Files

| File | Purpose |
|------|---------|
| `serial_proxy.py` | Virtual serial port proxy with logging |
| `new_restore.log` | Reference capture of successful restore operation |
| `test_checksum.py` | Validates checksum algorithm against captured packets |
| `protocol_findings.md` | Complete protocol documentation |
| `checksum.md` | Detailed checksum reverse engineering notes |
| `preset_manager.py` | Python interface for preset operations |

---

## SysEx Protocol Summary

See `protocol_findings.md` for complete documentation including:
- Command structure and IDs
- Checksum calculation (non-standard algorithm)
- Write protocol for restoring .dcx files

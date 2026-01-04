# DCX2496 Checksum Algorithm

> **Status**: ✅ SOLVED  
> **Created**: 2025-12-28  

---

## Final Solution

```python
def calculate_checksum(data_bytes):
    """Calculate DCX2496 SysEx data checksum."""
    total = sum(b + 1 for b in data_bytes)
    return (~total) & 0x7F
```

Where `data_bytes` = `packet[13:-2]` (data portion only, excluding 13-byte header and checksum+F7)

### Packet Structure
```
Index:  0   1-3       4      5      6     7-12    13+        -2       -1
Data:  F0  Vendor   DevID  Model   CMD   Header  DATA...  Checksum   F7
```

### Key Points
- **Sum (byte + 1)**: Each byte is incremented by 1 BEFORE adding to sum
- **Bitwise NOT**: Apply `~` to the sum, then mask with `0x7F`
- **Data Only**: Checksum covers only data bytes, not header

> ⚠️ This is NOT the standard Roland/Behringer checksum `(128 - sum%128) & 0x7F`

### Verification
- Tested against 13 captured packets from DCX-Remote.exe - **ALL MATCH**
- Tested restore on real DCX2496 device with 3 different .dcx files - **ALL WORK**
- See `test_checksum.py` for automated regression test

---

## Reverse Engineering Details

### Disassembly Analysis (0x414788)

Found the checksum calculation in DCX-Remote.exe:

```asm
; Sum accumulation during encoding loop
  414ab6: movb %al, (%ecx)         ; store byte
  414ab8: incl %edx                ; edx = byte + 1 
  414aba: addl %edx, -0x48(%ebp)   ; SUM += (byte + 1)

; Final checksum calculation  
  414b39: movb -0x48(%ebp), %al    ; al = sum (low byte)
  414b3c: notb %al                 ; al = ~sum
  414b3e: andb $0x7f, %al          ; al = (~sum) & 0x7F
```

### Encoded Length Formula
```python
encoded_length = ((raw_file_size + 7) // 7 + 1) * 8
```

For a 9698-byte file: `encoded_length = 11096` → 12 pages

---

## What Didn't Work

1. **Simple byte sum**: `sum(packet[X:-2])` - wrong formula
2. **Roland checksum**: `(128 - sum%128) & 0x7F` - wrong formula  
3. **Hardcoded WINDOWS array**: `[416, 96, 107...]` - misunderstood the protocol

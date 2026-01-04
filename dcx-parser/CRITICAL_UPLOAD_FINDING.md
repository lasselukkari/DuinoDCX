# CRITICAL FINDING: Upload vs Download Packet Format

## Problem
Our upload implementation doesn't work because we're using the **DOWNLOAD** packet format for uploading!

## Discovery
By analyzing `wine_upload_test.log`, we found that DCX-Remote.exe uses **completely different packet formats** for upload vs download:

### DOWNLOAD Format (Device → App)
```
F0 00 20 32 00 0E 10 00 01 00 0C 00 [page] [encoded_data] [checksum] F7
                      ^^          ^^
                      00          0C = packet type
```

### UPLOAD Format (App → Device) - **THE CORRECT ONE**
```
F0 00 20 32 00 0E 10 01 01 00 02 00 [page] [encoded_data] [checksum] F7
                      ^^          ^^
                      01          02 = different packet type!
```

## Key Differences

| Aspect | Download (0x50 request) | Upload (Restore) |
|--------|------------------------|------------------|
| Byte 7 (after 0x10) | `00` | `01` |
| Byte 10 | `0C` | `02` |
| Command | Same (0x10) | Same (0x10) |

## Evidence from Log

**Upload packets** (lines 68, 72 in wine_upload_test.log):
```
[17:04:00.765] APP->DEV [1015] F0 00 20 32 00 0E 10 01 01 00 02 00 00 ...
[17:04:01.083] APP->DEV [ 911] F0 00 20 32 00 0E 10 01 01 00 02 00 01 ...
```

**Download packets** (lines 22-35 in wine_upload_test.log):
```
[17:03:56.790] APP->DEV [1015] F0 00 20 32 00 0E 10 00 01 00 0C 00 00 ...
[17:03:57.107] APP->DEV [1015] F0 00 20 32 00 0E 10 00 01 00 0C 00 01 ...
```

## What We Need to Fix

1. **`buildDataPacket` in `sysex.ts`**: Currently hardcoded to use `00 01 00 0C` format
2. **Need new function**: `buildUploadPacket` that uses `01 01 00 02` format
3. **Update `RestoreSession`**: Use the correct upload packet format

## Next Steps

1. Analyze the exact structure of the upload packet format
2. Create `buildUploadDataPacket` function
3. Update `RestoreSession` to use upload packets instead of download packets
4. Test with device

# Running DCX-Remote.exe on macOS (Wine + Serial Proxy)

To capture protocol traffic from the original Windows DCX-Remote software:

## Prerequisites

1. Install Wine:
   ```bash
   brew install --cask wine-stable
   ```

2. Install Python dependencies:
   ```bash
   pip install pyserial
   ```

## Step 1: Start the Serial Proxy (Unbuffered)

The proxy creates a virtual serial port that logs all traffic:

```bash
./venv/bin/python3 -u serial_proxy.py /dev/cu.usbserial-1430 --log capture.log > proxy_output.txt 2>&1 &
```

Output will show:
```
Virtual port created: /dev/ttys006
*** Configure your application to use: /dev/ttys006 ***

To create a symlink for Wine:
    ln -sf /dev/ttys006 ~/.wine/dosdevices/com1
```

## Step 2: Read the Virtual Port from the Log

```bash
cat proxy_output.txt
```

Look for:
```
Virtual port created: /dev/ttysXXX
```

## Step 3: Create Wine COM Port Symlink

In a **new terminal** (keep proxy running):

```bash
mkdir -p ~/.wine/dosdevices
ln -sf /dev/ttys006 ~/.wine/dosdevices/com1
```

> ⚠️ The virtual port path (`/dev/ttys006`) varies each time. Check the proxy output.

## Step 4: Launch DCX-Remote in Wine

```bash
wine ./DCX2496_V1_16/DCX2496_V1_16/DCX-Remote.exe > wine.out 2>&1 &
```

In DCX-Remote:
1. Go to **Settings → COM Port** and select **COM1**
2. The device should connect automatically
3. All traffic is now logged to `capture.log`

## Example Session

```bash
# Terminal 1: Start proxy (unbuffered, keep running)
./venv/bin/python3 -u serial_proxy.py /dev/cu.usbserial-1430 --log capture.log > proxy_output.txt 2>&1 &

# Terminal 2: Create symlink (use the path from proxy output)
cat proxy_output.txt
ln -sf /dev/ttys006 ~/.wine/dosdevices/com1
wine ./DCX2496_V1_16/DCX2496_V1_16/DCX-Remote.exe > wine.out 2>&1 &

# Perform operations in DCX-Remote (sync, restore, etc.)
# Press Ctrl+C in Terminal 1 when done
```


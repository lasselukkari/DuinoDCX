import sys
import time
import os
from datetime import datetime

try:
    import serial
except ImportError as e:
    print(f"ERROR: Failed to import serial: {e}", flush=True)
    sys.exit(1)

# Protocol definitions
HEADER = bytes([0xF0, 0x00, 0x20, 0x32])
CMD_DIRECT_PARAM = 0x20
SETUP_CHANNEL = 0x00

# Known Setup Parameters (from protocol/code)
KNOWN_PARAMS = {
    0x02: "Input Sum Type",
    0x03: "Input AB Source (or On/Off)",
    0x04: "Input C Gain",
    0x05: "Output Config",
    0x06: "Stereolink",
    0x07: "Stereolink Mode",
    0x08: "Delay Link",
    0x09: "Xover Link",
    0x0A: "Delay Correction",
    0x0B: "Air Temperature",
    0x14: "Delay Units",
    0x15: "Mute Outs",
    0x16: "Input A Sum Gain",
    0x17: "Input B Sum Gain",
    0x18: "Input C Sum Gain"
}

def format_hex(data):
    return ' '.join(f'{b:02X}' for b in data)

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 sniff_setup_commands.py <serial_port>", flush=True)
        sys.exit(1)

    port = sys.argv[1]
    print(f"Listening on {port} for DCX2496 Setup Commands...", flush=True)

    try:
        ser = serial.Serial(port, 38400, timeout=0.1)
        
        # Send Remote control enable command (Receive & Transmit) for Device ID 0
        # F0 00 20 32 [deviceID] 0E 3F 0C 00 F7
        enable_cmd = bytes([0xF0, 0x00, 0x20, 0x32, 0x00, 0x0E, 0x3F, 0x0C, 0x00, 0xF7])
        ser.write(enable_cmd)
        print(f"Sent Enable Command: {format_hex(enable_cmd)}", flush=True)
        
    except Exception as e:
        print(f"ERROR: Could not open serial port: {e}", flush=True)
        sys.exit(1)

    buffer = bytearray()

    while True:
        try:
            # Read whatever is available
            if ser.in_waiting > 0:
                data = ser.read(ser.in_waiting)
                if data:
                    buffer.extend(data)
            else:
                time.sleep(0.01) # Prevent CPU spin
                # No verify parsing if no new data, but we can try parsing buffer if we have data
                if not buffer:
                    continue

            # Process buffer
            while True:
                # Look for potential header start
                try:
                    start_idx = buffer.index(0xF0)
                except ValueError:
                    # No start byte, discard garbage (but maybe print it if it's long?)
                    if len(buffer) > 100:
                         print(f"Garbage: {format_hex(buffer)}", flush=True)
                         buffer = bytearray()
                    break

                # Discard data before start byte
                if start_idx > 0:
                    garbage = buffer[:start_idx]
                    print(f"Discarded: {format_hex(garbage)}", flush=True)
                    buffer = buffer[start_idx:]

                # Look for end byte
                try:
                    end_idx = buffer.index(0xF7)
                except ValueError:
                    # Message incomplete
                    break

                # Extract message
                msg = buffer[:end_idx+1]
                buffer = buffer[end_idx+1:]
                
                # Print full message
                hex_str = ' '.join(f'{b:02X}' for b in msg)
                ascii_str = ''.join(chr(b) if 32 <= b < 127 else '.' for b in msg)
                print(f"MSG: {hex_str}  |  {ascii_str}", flush=True)
                
                # Check Header: F0 00 20 32 [deviceID] 0E [function]
                if len(msg) >= 8 and msg[1:4] == bytes([0x00, 0x20, 0x32]):
                    function = msg[6]
                    
                    if function == CMD_DIRECT_PARAM: # 0x20
                        num_params = msg[7]
                        payload = msg[8:-1]
                        
                        # Process 4-byte chunks
                        for i in range(num_params):
                            offset = i * 4
                            if offset + 4 > len(payload):
                                break
                                
                            chunk = payload[offset:offset+4]
                            channel = chunk[0]
                            param_num = chunk[1]
                            
                            # Setup Channel (0x00)
                            if channel == SETUP_CHANNEL:
                                param_hex = f"0x{param_num:02X}"
                                if param_num in KNOWN_PARAMS:
                                    print(f"Known Setup Command: {KNOWN_PARAMS[param_num]} ({param_hex})", flush=True)
                                else:
                                    print(f"UNKNOWN Setup Command: {param_hex}", flush=True)
                                    # Write to file (keep this logic for Setup only for now, or all?)
                                    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
                                    filename = f"unknown_setup_cmd_{param_hex}_{timestamp}.txt"
                                    # ... (rest of file writing logic)

                            # Input/Output Channels (0x01 - 0x0A)
                            elif 0x01 <= channel <= 0x0A:
                                # Just print them so we know they are seen
                                chan_names = {1:'A', 2:'B', 3:'C', 4:'SUM', 5:'1', 6:'2', 7:'3', 8:'4', 9:'5', 10:'6'}
                                c_name = chan_names.get(channel, f"0x{channel:02X}")
                                print(f"Channel {c_name} Command: Param 0x{param_num:02X}", flush=True)

        except KeyboardInterrupt:
            print("\nExiting...", flush=True)
            break
        except Exception as e:
            print(f"Error in loop: {e}", flush=True)
            # Don't break, try to recover
            time.sleep(1)

if __name__ == '__main__':
    main()

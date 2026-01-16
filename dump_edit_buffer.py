#!/usr/bin/env python3
"""
Dump Edit Buffer from DCX2496 for byte mapping verification.

Usage:
  python3 dump_edit_buffer.py /dev/cu.usbserial-XXXX [output_file.bin]
  
This script:
1. Sends Edit Buffer request (parts 0 and 1)
2. Receives and decodes the 7-bit MIDI data
3. Saves raw 8-bit bytes to file
4. Prints hex dump of setup section (bytes 0-120)
"""

import argparse
import serial
import sys
import time


def decode_7bit_to_8bit(data: bytes) -> bytes:
    """Decode 7-bit MIDI data to 8-bit bytes."""
    result = bytearray()
    i = 0
    while i < len(data):
        # Every 8 bytes of 7-bit data = 7 bytes of 8-bit data
        # First byte contains MSBs for next 7 bytes
        if i + 8 <= len(data):
            msb_byte = data[i]
            for j in range(1, 8):
                if i + j < len(data):
                    val = data[i + j]
                    if msb_byte & (1 << (7 - j)):
                        val |= 0x80
                    result.append(val)
            i += 8
        else:
            # Handle remaining bytes
            msb_byte = data[i]
            for j in range(1, len(data) - i):
                val = data[i + j]
                if msb_byte & (1 << (7 - j)):
                    val |= 0x80
                result.append(val)
            break
    return bytes(result)


def build_edit_buffer_request(part: int) -> bytes:
    """Build Edit Buffer request SysEx message.
    
    From builders.ts buildEditBufferRequest:
    CMD_DUMP_REQUEST = 0x50
    Bank 0x01 (edit buffer), part 0 or 1
    """
    return bytes([
        0xF0,                      # SysEx start
        0x00, 0x20, 0x32,          # Behringer manufacturer ID (VENDOR_ID)
        0x00,                      # Device ID (DEFAULT_DEVICE_ID)
        0x0E,                      # Model ID (DCX2496)
        0x50,                      # CMD_DUMP_REQUEST
        0x01,                      # Bank 1 (edit buffer)
        0x00,                      # Reserved
        part,                      # Part number (0 or 1)
        0xF7                       # SysEx end
    ])


def read_sysex_response(ser: serial.Serial, timeout: float = 2.0) -> bytes:
    """Read a complete SysEx message from serial port."""
    buffer = bytearray()
    start_time = time.time()
    
    while time.time() - start_time < timeout:
        if ser.in_waiting:
            data = ser.read(ser.in_waiting)
            buffer.extend(data)
            
            # Check for complete SysEx
            if 0xF7 in buffer:
                # Find start and end
                start = buffer.find(0xF0)
                if start >= 0:
                    end = buffer.find(0xF7, start)
                    if end >= 0:
                        return bytes(buffer[start:end+1])
        else:
            time.sleep(0.01)
    
    return bytes()


def parse_dump_response(msg: bytes) -> tuple:
    """Parse a DUMP_RESP message, return (part, decoded_data).
    
    From sysex.ts parseDumpResponse:
    - bank at byte 7 (0x01 for edit buffer)
    - part at byte 12
    - encoded data starts at HEADER_SIZE (13), ends before checksum and F7
    """
    if len(msg) < 15:
        return None, None
    
    # Verify it's a DUMP_RESP
    if msg[0] != 0xF0 or msg[-1] != 0xF7:
        return None, None
    if msg[1:4] != bytes([0x00, 0x20, 0x32]):
        return None, None
    if msg[6] != 0x10:  # DUMP_RESP
        return None, None
    
    bank = msg[7]
    if bank != 0x01:  # Bank 1 = edit buffer
        print(f"  Unexpected bank: {bank}")
        return None, None
    
    part = msg[12]  # Part number at byte 12
    # Data starts at byte 13 (HEADER_SIZE), ends before checksum and F7 (last 2 bytes)
    encoded_data = msg[13:-2]
    decoded_data = decode_7bit_to_8bit(encoded_data)
    
    return part, decoded_data


def hex_dump(data: bytes, start_offset: int = 0, bytes_per_line: int = 16) -> str:
    """Create a hex dump of data."""
    lines = []
    for i in range(0, len(data), bytes_per_line):
        chunk = data[i:i+bytes_per_line]
        hex_part = ' '.join(f'{b:02X}' for b in chunk)
        ascii_part = ''.join(chr(b) if 32 <= b < 127 else '.' for b in chunk)
        lines.append(f'{start_offset + i:04X}  {hex_part:<48}  {ascii_part}')
    return '\n'.join(lines)


def main():
    parser = argparse.ArgumentParser(description='Dump Edit Buffer from DCX2496')
    parser.add_argument('device', help='Serial device (e.g., /dev/cu.usbserial-1430)')
    parser.add_argument('output', nargs='?', default='edit_buffer.bin', help='Output file')
    parser.add_argument('--baud', type=int, default=38400, help='Baud rate')
    args = parser.parse_args()
    
    print(f"Connecting to {args.device}...")
    
    try:
        ser = serial.Serial(
            port=args.device,
            baudrate=args.baud,
            bytesize=serial.EIGHTBITS,
            parity=serial.PARITY_NONE,
            stopbits=serial.STOPBITS_ONE,
            timeout=0,
            rtscts=False,
            dsrdtr=False,
        )
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)
    
    time.sleep(0.5)  # Let port settle
    
    # Send Remote Control Enable command first
    print("Enabling remote control mode...")
    enable_cmd = bytes([
        0xF0,                      # SysEx start
        0x00, 0x20, 0x32,          # Behringer manufacturer ID
        0x00,                      # Device ID
        0x0E,                      # Model ID (DCX2496)
        0x3F,                      # CMD_LISTEN_MODE
        0x0C,                      # Mode (0x0c = enable)
        0x00,                      # State
        0xF7                       # SysEx end
    ])
    ser.write(enable_cmd)
    time.sleep(0.2)  # Give device time to process
    
    # Clear any pending responses
    if ser.in_waiting:
        ser.read(ser.in_waiting)
    
    # Collect both parts
    parts = {}
    
    for part_num in [0, 1]:
        print(f"Requesting part {part_num}...")
        
        # Send request
        request = build_edit_buffer_request(part_num)
        print(f"  Sending: {request.hex()}")
        ser.write(request)
        
        # Read response
        response = read_sysex_response(ser, timeout=3.0)
        
        if not response:
            print(f"  No response for part {part_num}")
            continue
        
        part, data = parse_dump_response(response)
        if part is not None:
            parts[part] = data
            print(f"  Received part {part}: {len(data)} bytes")
        else:
            print(f"  Invalid response")
    
    ser.close()
    
    if len(parts) != 2:
        print("Failed to get both parts")
        sys.exit(1)
    
    # Combine parts
    combined = parts[0] + parts[1]
    print(f"\nTotal: {len(combined)} bytes")
    
    # Save to file
    with open(args.output, 'wb') as f:
        f.write(combined)
    print(f"Saved to: {args.output}")
    
    # Print hex dump of setup section (first ~120 bytes)
    print("\n=== SETUP SECTION (first 120 bytes) ===")
    print(hex_dump(combined[:120]))
    
    print("\n=== KEY OFFSETS (Edit Buffer) ===")
    # These are the offsets we want to verify
    offsets = [
        (36, 'delayUnits?'),
        (38, 'muteOutsWhenPowered?'),
        (88, 'outputConfig?'),
        (90, 'inputSumType?'),
        (92, 'inputABSource?'),
        (94, 'inputCGain?'),
        (98, 'stereolink?'),
        (100, 'stereolinkMode?'),
        (102, 'delayLink?'),
        (104, 'crossoverLink?'),
        (106, 'isDelayCorrectionOn?'),
        (108, 'airTemperature?'),
    ]
    
    for offset, name in offsets:
        if offset + 1 < len(combined):
            val = combined[offset] | (combined[offset + 1] << 8)
            print(f"  Offset {offset:3d} (0x{offset:02X}): {val:5d} (0x{val:04X})  {name}")


if __name__ == '__main__':
    main()

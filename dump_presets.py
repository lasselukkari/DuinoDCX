#!/usr/bin/env python3
"""
Dump Presets from DCX2496 for byte mapping verification.

Usage:
  python3 dump_presets.py /dev/cu.usbserial-XXXX [output_file.bin]
  
This script:
1. Sends Page dump requests (pages 0-11, Bank 0)
2. Receives and decodes the 7-bit MIDI data
3. Saves decoded bytes to file (DCX-compatible format)
"""

import argparse
import serial
import sys
import time


def decode_7bit_to_8bit(data: bytes) -> bytes:
    """Decode 7-bit MIDI data to 8-bit bytes.
    
    DCX2496 format: [data0, data1, data2, data3, data4, data5, data6, msbByte]
    MSB byte is at the END of each 8-byte block (position 7).
    """
    result = bytearray()
    i = 0
    while i + 8 <= len(data):
        # MSB byte is at position 7 (end of block)
        msb_byte = data[i + 7]
        for j in range(7):
            byte = data[i + j]
            if msb_byte & (1 << j):
                byte |= 0x80
            result.append(byte)
        i += 8
    return bytes(result)


def build_page_dump_request(page: int, device_id: int = 0x00) -> bytes:
    """Build Page dump request SysEx message.
    
    From builders.ts buildPageDumpRequest:
    CMD_DUMP_REQUEST = 0x50
    Bank 0x00 (memory pages), page 0-11
    """
    return bytes([
        0xF0,                      # SysEx start
        0x00, 0x20, 0x32,          # Behringer manufacturer ID (VENDOR_ID)
        device_id,                 # Device ID
        0x0E,                      # Model ID (DCX2496)
        0x50,                      # CMD_DUMP_REQUEST
        0x00,                      # Bank 0 (memory pages / presets)
        0x00,                      # Reserved
        page & 0x7F,               # Page number (0-11)
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
    """Parse a DUMP_RESP message, return (page, decoded_data).
    
    - bank at byte 7 (0x00 for presets)
    - page at byte 12
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
    if bank != 0x00:  # Bank 0 = presets
        print(f"  Unexpected bank: {bank}")
        return None, None
    
    page = msg[12]  # Page number at byte 12
    # Data starts at byte 13 (HEADER_SIZE), ends before checksum and F7 (last 2 bytes)
    encoded_data = msg[13:-2]
    decoded_data = decode_7bit_to_8bit(encoded_data)
    
    return page, decoded_data


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
    parser = argparse.ArgumentParser(description='Dump Presets from DCX2496')
    parser.add_argument('device', help='Serial device (e.g., /dev/cu.usbserial-1430)')
    parser.add_argument('output', nargs='?', default='presets.bin', help='Output file')
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
            timeout=1
        )
        
        # Clear any pending data
        time.sleep(0.2)
        ser.reset_input_buffer()
        
        pages_data = {}
        
        # Request all 12 pages
        for page in range(12):
            print(f"Requesting page {page}...")
            
            request = build_page_dump_request(page)
            ser.write(request)
            
            response = read_sysex_response(ser, timeout=3.0)
            
            if not response:
                print(f"  No response for page {page}")
                continue
            
            page_num, decoded = parse_dump_response(response)
            
            if decoded is None:
                print(f"  Failed to parse page {page} response")
                continue
            
            pages_data[page_num] = decoded
            print(f"  Received page {page_num}: {len(decoded)} bytes decoded")
        
        ser.close()
        
        if not pages_data:
            print("No pages received!")
            sys.exit(1)
        
        # Concatenate all pages in order
        all_data = bytearray()
        for page in sorted(pages_data.keys()):
            all_data.extend(pages_data[page])
        
        # Save combined data
        with open(args.output, 'wb') as f:
            f.write(all_data)
        
        print(f"\nSaved {len(all_data)} bytes to {args.output}")
        
        # Show first 120 bytes (setup area of first preset)
        print("\nFirst preset setup area (bytes 0-120):")
        print(hex_dump(all_data[:120]))
        
        # Show some key offsets
        if len(all_data) > 110:
            print(f"\nKey offsets:")
            print(f"  Offset 76-83 (presetName): {all_data[76:84]}")
            print(f"  Offset 84-85: {all_data[84]:02X} {all_data[85]:02X}")
            print(f"  Offset 86-87: {all_data[86]:02X} {all_data[87]:02X} (value={all_data[86] + all_data[87]*256})")
            print(f"  Offset 88-89: {all_data[88]:02X} {all_data[89]:02X}")
            print(f"  Offset 106-107 (airTemp): {all_data[106]:02X} {all_data[107]:02X} (value={all_data[106] + all_data[107]*256})")
        
    except serial.SerialException as e:
        print(f"Serial error: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()

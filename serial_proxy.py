#!/usr/bin/env python3
"""
Serial Port Proxy for DCX2496 Protocol Analysis

This script creates a proxy between an application (like DCX-Remote via Wine)
and the actual serial device, logging all traffic for protocol analysis.

Usage:
  1. Run this script: python3 serial_proxy.py /dev/cu.usbserial-1430
  2. Note the virtual port path printed (e.g., /dev/ttys003)
  3. In Wine, configure DCX-Remote to use that port
  4. Use DCX-Remote normally - all traffic is logged to serial_capture.log

Requirements:
  - pyserial: pip install pyserial
  - macOS (uses pty for virtual serial port)
"""

import argparse
import os
import pty
import select
import serial
import sys
import time
from datetime import datetime


def format_hex(data: bytes, direction: str) -> str:
    """Format bytes as hex with direction indicator."""
    hex_str = data.hex().upper()
    # Add spaces every 2 chars
    hex_spaced = ' '.join(hex_str[i:i+2] for i in range(0, len(hex_str), 2))
    return f"{direction} [{len(data):4d}] {hex_spaced}"


def format_sysex(data: bytes) -> str:
    """Try to interpret SysEx message."""
    if len(data) < 7 or data[0] != 0xF0 or data[-1] != 0xF7:
        return ""
    
    # Check for Behringer header
    if data[1:4] == bytes([0x00, 0x20, 0x32]):
        device_id = data[4]
        model_id = data[5]
        cmd = data[6]
        
        cmd_names = {
            0x00: "SEARCH_RESP",
            0x04: "PING_RESP", 
            0x10: "DUMP_RESP",
            0x11: "PRESET_COUNT_RESP",
            0x20: "DIRECT_CMD",
            0x3F: "TRANSMIT_MODE",
            0x40: "SEARCH",
            0x44: "PING",
            0x50: "DUMP_REQ",
            0x51: "PRESET_COUNT",
            0x52: "RECALL",
            0x53: "STORE",
            0x60: "PRESET_DUMP?",
        }
        
        cmd_name = cmd_names.get(cmd, f"CMD_0x{cmd:02X}")
        params = data[7:-1]
        
        return f"  >> {cmd_name} dev={device_id} model=0x{model_id:02X} params={params.hex().upper() if params else 'none'}"
    
    return ""


def main():
    parser = argparse.ArgumentParser(description='Serial Port Proxy with Logging')
    parser.add_argument('device', help='Real serial device (e.g., /dev/cu.usbserial-1430)')
    parser.add_argument('--baud', type=int, default=38400, help='Baud rate (default: 38400)')
    parser.add_argument('--log', default='serial_capture.log', help='Log file path')
    args = parser.parse_args()
    
    # Open log file
    log_file = open(args.log, 'a')
    log_file.write(f"\n{'='*60}\n")
    log_file.write(f"Session started: {datetime.now().isoformat()}\n")
    log_file.write(f"Device: {args.device} @ {args.baud} baud\n")
    log_file.write(f"{'='*60}\n\n")
    log_file.flush()
    
    def log(msg):
        timestamp = datetime.now().strftime('%H:%M:%S.%f')[:-3]
        line = f"[{timestamp}] {msg}"
        print(line)
        log_file.write(line + '\n')
        log_file.flush()
    
    # Open real serial device
    try:
        real_serial = serial.Serial(
            port=args.device,
            baudrate=args.baud,
            bytesize=serial.EIGHTBITS,
            parity=serial.PARITY_NONE,
            stopbits=serial.STOPBITS_ONE,
            timeout=0,  # Non-blocking
            rtscts=False,
            dsrdtr=False,
        )
        log(f"Opened real device: {args.device}")
    except Exception as e:
        print(f"Error opening {args.device}: {e}")
        sys.exit(1)
    
    # Create virtual serial port using pty
    master_fd, slave_fd = pty.openpty()
    slave_name = os.ttyname(slave_fd)
    
    log(f"Virtual port created: {slave_name}")
    log(f"")
    log(f"*** Configure your application to use: {slave_name} ***")
    log(f"    (You may need to create a symlink for Wine)")
    log(f"")
    log(f"To create a symlink for Wine:")
    log(f"    ln -sf {slave_name} ~/.wine/dosdevices/com1")
    log(f"")
    log(f"Press Ctrl+C to stop")
    log(f"{'='*60}")
    
    # Buffer for accumulating SysEx messages
    app_buffer = bytearray()
    device_buffer = bytearray()
    
    try:
        while True:
            # Wait for data on either port
            readable, _, _ = select.select([master_fd, real_serial.fileno()], [], [], 0.1)
            
            # Data from application (via virtual port)
            if master_fd in readable:
                try:
                    data = os.read(master_fd, 1024)
                    if data:
                        # Forward to device
                        real_serial.write(data)
                        
                        # Log
                        app_buffer.extend(data)
                        # Check for complete SysEx messages
                        # Check for complete SysEx messages
                        while 0xF7 in app_buffer:
                            idx = app_buffer.index(0xF7) + 1
                            msg = bytes(app_buffer[:idx])
                            app_buffer = app_buffer[idx:]
                            
                            interpretation = format_sysex(msg)
                            # Suppress PINGs and other periodic noise for clean log
                            is_noise = any(x in interpretation for x in ["PING", "SEARCH"])
                            if not is_noise:
                                log(format_hex(msg, "APP->DEV"))
                                if interpretation:
                                    log(interpretation)
                except OSError:
                    pass
            
            # Data from device
            if real_serial.fileno() in readable:
                data = real_serial.read(real_serial.in_waiting or 1)
                if data:
                    # Forward to application
                    os.write(master_fd, data)
                    
                    # Log
                    device_buffer.extend(data)
                    # Check for complete SysEx messages
                    while 0xF7 in device_buffer:
                        idx = device_buffer.index(0xF7) + 1
                        msg = bytes(device_buffer[:idx])
                        device_buffer = device_buffer[idx:]
                        interpretation = format_sysex(msg)
                        # Suppress PINGs and other periodic noise for clean log
                        is_noise = any(x in interpretation for x in ["PING", "SEARCH"])
                        if not is_noise:
                            log(format_hex(msg, "DEV->APP"))
                            if interpretation:
                                log(interpretation)
    
    except KeyboardInterrupt:
        log("\nStopping proxy...")
    finally:
        real_serial.close()
        os.close(master_fd)
        os.close(slave_fd)
        log_file.close()
        print(f"\nLog saved to: {args.log}")


if __name__ == '__main__':
    main()

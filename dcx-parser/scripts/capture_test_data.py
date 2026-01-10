import serial
import time
import sys
import os

# Configuration
SERIAL_PORT = "/dev/cu.usbserial-1430"
BAUD_RATE = 38400
TIMEOUT = 10.0
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "../test-data")

def open_serial():
    try:
        ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=TIMEOUT)
        ser.reset_input_buffer()
        ser.reset_output_buffer()
        return ser
    except serial.SerialException as e:
        print(f"Error opening serial port {SERIAL_PORT}: {e}")
        sys.exit(1)

def send_command(ser, cmd):
    print(f"Sending: {cmd.hex()}")
    ser.reset_input_buffer()
    ser.write(cmd)
    ser.flush()

def read_response(ser):
    response = bytearray()
    start_time = time.time()
    
    while ser.in_waiting == 0:
        if (time.time() - start_time) > TIMEOUT:
            return response
        time.sleep(0.05)

    while (time.time() - start_time) < TIMEOUT:
        if ser.in_waiting > 0:
            bytes_read = ser.read(ser.in_waiting)
            if bytes_read:
                response.extend(bytes_read)
                if 0xF7 in bytes_read:
                    idx = response.rfind(0xF7)
                    if idx != -1:
                        return response[:idx+1]
                    return response
        time.sleep(0.05)
        
    return response

def initialize_session(ser):
    print("Initializing Session...")
    cmd_ping = bytes.fromhex("F0 00 20 32 00 0E 40 F7")
    send_command(ser, cmd_ping)
    resp = read_response(ser)
    if resp:
        print(f"Device Identified. Response: {len(resp)} bytes")
    time.sleep(0.5)
    
    cmd_listen = bytes.fromhex("F0 00 20 32 00 0E 3F 0C 00 F7")
    send_command(ser, cmd_listen)
    time.sleep(0.5)

def save_readable_hex_file(filename, data):
    path = os.path.join(OUTPUT_DIR, filename)
    # Format as space-separated hex bytes: F0 00 20 ...
    hex_str = " ".join(f"{b:02X}" for b in data)
    
    with open(path, "w") as f:
        f.write(hex_str)
        # Add a newline for good measure
        f.write("\n")
        
    print(f"Saved {filename} ({len(data)} bytes -> human readable hex)")

def dump_edit_buffer(ser):
    # Part 0
    cmd_part0 = bytes.fromhex("F0 00 20 32 00 0E 50 01 00 00 F7")
    send_command(ser, cmd_part0) 
    resp_part0 = read_response(ser)
    if resp_part0 and len(resp_part0) > 100:
        save_readable_hex_file("edit_buffer_part0.hex", resp_part0)
    else:
        print(f"Timeout or short data for Edit Buffer Part 0: {len(resp_part0)} bytes")
    
    time.sleep(1.0)
    
    # Part 1
    cmd_part1 = bytes.fromhex("F0 00 20 32 00 0E 50 01 00 01 F7")
    send_command(ser, cmd_part1) 
    resp_part1 = read_response(ser)
    if resp_part1 and len(resp_part1) > 100:
        save_readable_hex_file("edit_buffer_part1.hex", resp_part1)
    else:
        print(f"Timeout or short data for Edit Buffer Part 1: {len(resp_part1)} bytes")

def dump_memory_pages(ser):
    for page in range(12):
        print(f"Requesting Page {page}...")
        cmd = bytes([0xF0, 0x00, 0x20, 0x32, 0x00, 0x0E, 0x50, 0x00, 0x00, page, 0xF7])
        send_command(ser, cmd)
        resp = read_response(ser)
        if not resp or len(resp) < 100:
            print(f"Timeout or short data for Page {page}: {len(resp)} bytes, stopping.")
            break
        
        filename = f"page_{page:02d}.hex"
        save_readable_hex_file(filename, resp)
        time.sleep(1.0)

def main():
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)

    ser = open_serial()
    print(f"Opened {SERIAL_PORT}")
    
    initialize_session(ser)
    
    print("Dumping Edit Buffer...")
    dump_edit_buffer(ser)

    time.sleep(2.0)
    
    print("Dumping Memory Pages...")
    dump_memory_pages(ser)

    ser.close()

if __name__ == "__main__":
    main()

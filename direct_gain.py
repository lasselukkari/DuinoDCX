import serial
import time
import sys

# Constants
PORT = "/dev/tty.usbserial-1430"
BAUD = 38400
SYSEX_START = 0xF0
TARGET_OFFSET = 1353

def decode7to8(data):
    # data is list of ints or bytes
    length = len(data)
    num_blocks = length // 8
    result = bytearray()
    
    for block in range(num_blocks):
        src_start = block * 8
        msb_byte = data[src_start + 7]
        
        for i in range(7):
            byte = data[src_start + i]
            if msb_byte & (1 << i):
                byte |= 0x80
            result.append(byte)
    return result
def main():
    try:
        ser = serial.Serial(PORT, BAUD, timeout=2.0, rtscts=False, dsrdtr=False)
        # Toggle DTR/RTS to reset or wake up
        ser.dtr = True
        ser.rts = True
        time.sleep(0.1)
        ser.dtr = False
        ser.rts = False
        time.sleep(1.0)
    except Exception as e:
        print(f"Error opening serial: {e}")
        return

    # Clear input
    ser.reset_input_buffer()

    # Request Part 0
    # F0 00 20 32 00 50 01 00 00 F7
    req0 = bytes([0xF0, 0x00, 0x20, 0x32, 0x00, 0x50, 0x01, 0x00, 0x00, 0xF7])
    
    # Request Part 1
    # F0 00 20 32 00 50 01 00 01 F7
    req1 = bytes([0xF0, 0x00, 0x20, 0x32, 0x00, 0x50, 0x01, 0x00, 0x01, 0xF7])

    print("Sending Request Part 0...")
    ser.write(req0)
    time.sleep(2.0) 
    
    resp0 = ser.read(4000) 
    print(f"Read {len(resp0)} bytes for Part 0")
    
    print("Sending Request Part 1...")
    ser.write(req1)
    time.sleep(2.0)
    resp1 = ser.read(4000)
    print(f"Read {len(resp1)} bytes for Part 1")
    
    ser.close()

    # Extract payloads
    def extract_payload(data):
        start = -1
        # Scan for F0 00 20 32 ...
        for i in range(len(data) - 4):
            if (data[i] == 0xF0 and 
                data[i+1] == 0x00 and 
                data[i+2] == 0x20 and 
                data[i+3] == 0x32):
                
                # Look for F7
                for j in range(i, len(data)):
                    if data[j] == 0xF7:
                        # Found packet
                        pkt = data[i:j+1]
                        # Check header length and command/bank
                        # Header is F0(1) ID(3) Dev(1) Model(1) Cmd(1) Length(2?) ... 
                        # protocol.ts: HEADER_SIZE = 13
                        if len(pkt) > 15:
                            return pkt[13:-2] # Strip Header and Checksum+End
        return None

    payload0 = extract_payload(resp0)
    payload1 = extract_payload(resp1)

    if not payload0 or not payload1:
        print("Could not find valid Dump payloads.")
        print(f"Payload 0 found: {payload0 is not None}")
        print(f"Payload 1 found: {payload1 is not None}")
        return

    decoded0 = decode7to8(payload0)
    decoded1 = decode7to8(payload1)
    
    full = decoded0 + decoded1
    
    if len(full) > TARGET_OFFSET + 1:
        low = full[TARGET_OFFSET]
        high = full[TARGET_OFFSET+1]
        raw = low | (high << 8)
        db = -15 + (raw * 0.1)
        print(f"Output 6 Gain Raw: {raw} (0x{raw:04x})")
        print(f"Output 6 Gain dB: {db:.1f} dB")
    else:
        print(f"Buffer too short.")

if __name__ == "__main__":
    main()

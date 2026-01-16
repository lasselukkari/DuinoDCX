# Ghidra Python script to verify preset byte mappings
# @category DCX2496
# @author Analysis

from ghidra.program.model.mem import MemoryAccessException

def run():
    println("=== PRESET BYTE OFFSET VERIFICATION ===")
    println("")
    
    # Step 1: Read XSNP template bytes
    println("STEP 1: Reading XSNP template bytes")
    println("------------------------------------")
    read_template_bytes()
    
    # Step 2: Find UI control strings
    println("")
    println("STEP 2: Finding UI control strings")
    println("-----------------------------------")
    find_ui_strings()
    
    println("")
    println("Analysis complete!")

def read_template_bytes():
    # XSNP template at file offset 0x000F8DAC = virtual address 0x004F8DAC
    template_addr = toAddr(0x004F8DAC)
    mem = currentProgram.getMemory()
    
    println("XSNP template at: " + str(template_addr))
    
    # Read header
    header = getBytes(template_addr, 8)
    header_hex = " ".join(["%02X" % (b & 0xFF) for b in header])
    println("Header: " + header_hex)
    
    # Read setup fields (0x54-0x72 relative to XSNP start)
    println("")
    println("Setup fields (0x54-0x72):")
    offsets = [0x54, 0x56, 0x58, 0x5A, 0x5C, 0x5E, 0x60, 0x62, 0x64, 0x66, 0x68, 0x6A, 0x6C, 0x6E, 0x70, 0x72]
    
    for offset in offsets:
        field_addr = template_addr.add(offset)
        try:
            field_bytes = getBytes(field_addr, 2)
            value = (field_bytes[0] & 0xFF) | ((field_bytes[1] & 0xFF) << 8)
            println("  0x%02X: %3d (0x%04X)" % (offset, value, value))
        except:
            println("  0x%02X: ERROR reading" % offset)

def find_ui_strings():
    controls = [
        "DelayUnit", "MuteOuts", "StereoLink", 
        "cbXOLink", "cbDelLinkOn", "AirTemp",
        "SpinGain", "OutGain"
    ]
    
    mem = currentProgram.getMemory()
    
    for control in controls:
        addr = find(mem.getMinAddress(), control)
        if addr is not None:
            println("Found '%s' at %s" % (control, str(addr)))

# Run the script
run()

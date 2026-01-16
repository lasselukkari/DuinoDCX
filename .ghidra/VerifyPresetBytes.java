//Ghidra script to verify preset byte mappings
//@category DCX2496
//@author Analysis

import ghidra.app.script.GhidraScript;
import ghidra.program.model.address.*;
import ghidra.program.model.listing.*;
import ghidra.program.model.mem.*;

public class VerifyPresetBytes extends GhidraScript {
    
    @Override
    public void run() throws Exception {
        println("=== PRESET BYTE OFFSET VERIFICATION ===");
        println();
        
        // Step 1: Read XSNP template to show actual byte values
        println("STEP 1: Reading XSNP template bytes (known structure)");
        println("------------------------------------------------------");
        readTemplateBytes();
        
        // Step 2: Find and show references to known strings
        println();
        println("STEP 2: Finding UI control strings");
        println("-----------------------------------");
        findUIStrings();
        
        println();
        println("Analysis complete!");
    }
    
    private void readTemplateBytes() throws Exception {
        // XSNP template at file offset 0x000F8DAC = virtual address 0x004F8DAC
        Address templateBase = toAddr(0x004F8DAC);
        Memory mem = currentProgram.getMemory();
        
        println("XSNP template at: " + templateBase);
        
        // Read header
        byte[] header = new byte[8];
        mem.getBytes(templateBase, header);
        StringBuilder sb = new StringBuilder("Header: ");
        for (byte b : header) sb.append(String.format("%02X ", b & 0xFF));
        println(sb.toString());
        
        // Read setup fields (0x54-0x72 relative to XSNP start)
        println();
        println("Setup fields (0x54-0x72):");
        int[] offsets = {0x54, 0x56, 0x58, 0x5A, 0x5C, 0x5E, 0x60, 0x62, 0x64, 0x66, 0x68, 0x6A, 0x6C, 0x6E, 0x70, 0x72};
        
        for (int offset : offsets) {
            Address fieldAddr = templateBase.add(offset);
            byte[] fieldBytes = new byte[2];
            mem.getBytes(fieldAddr, fieldBytes);
            int value = (fieldBytes[0] & 0xFF) | ((fieldBytes[1] & 0xFF) << 8);
            println(String.format("  0x%02X: %3d (0x%04X)", offset, value, value));
        }
    }
    
    private void findUIStrings() throws Exception {
        String[] controls = {
            "DelayUnit", "MuteOuts", "StereoLink", 
            "cbXOLink", "cbDelLinkOn", "AirTemp",
            "SpinGain", "OutGain"
        };
        
        Memory mem = currentProgram.getMemory();
        
        for (String control : controls) {
            Address addr = find(mem.getMinAddress(), control.getBytes("UTF-8"));
            if (addr != null) {
                println("Found '" + control + "' at " + addr);
            }
        }
    }
}

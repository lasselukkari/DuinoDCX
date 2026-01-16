// Automated script to map all unknown bytes in DCX2496 protocol
// @category DCX2496
// @author Reverse Engineering Analysis

import ghidra.app.script.GhidraScript;
import ghidra.program.model.address.*;
import ghidra.program.model.listing.*;
import ghidra.program.model.symbol.*;
import ghidra.program.model.mem.*;
import java.util.*;

public class MapAllUnknownBytes extends GhidraScript {
    
    // Known field names to search for
    private static final String[] UI_CONTROLS = {
        "CbDelayUnit",
        "MuteOuts",
        "cbStereoLink",
        "rbStereoLink",
        "SpinAirTemp",
        "cbDelLink",
        "cbCrossLink",
        "cbDelayCorrect",
        // Add more as needed
    };
    
    // Template offset where preset data starts
    private static final long TEMPLATE_OFFSET = 0x000F8DAC;
    
    @Override
    public void run() throws Exception {
        println("=== DCX2496 Unknown Bytes Mapping Script ===");
        println();
        
        // Step 1: Find all UI control references
        println("Step 1: Finding UI controls...");
        Map<String, Address> controlAddresses = findUIControls();
        
        // Step 2: Find event handlers for each control
        println("\nStep 2: Finding event handlers...");
        Map<String, List<Function>> handlers = findEventHandlers(controlAddresses);
        
        // Step 3: Analyze handlers to find data write operations
        println("\nStep 3: Analyzing data writes...");
        Map<String, List<DataWrite>> dataWrites = analyzeDataWrites(handlers);
        
        // Step 4: Map writes to byte offsets
        println("\nStep 4: Mapping to byte offsets...");
        Map<Integer, String> byteMapping = mapToOffsets(dataWrites);
        
        // Step 5: Analyze template data
        println("\nStep 5: Analyzing embedded template...");
        analyzeTemplate();
        
        // Step 6: Generate report
        println("\n=== RESULTS ===");
        generateReport(byteMapping);
        
        println("\nAnalysis complete!");
    }
    
    private Map<String, Address> findUIControls() throws Exception {
        Map<String, Address> controls = new HashMap<>();
        
        for (String controlName : UI_CONTROLS) {
            // Search for string in binary
            Address addr = find(toAddr(0), controlName.getBytes());
            if (addr != null) {
                controls.put(controlName, addr);
                println("  Found: " + controlName + " at " + addr);
            }
        }
        
        return controls;
    }
    
    private Map<String, List<Function>> findEventHandlers(Map<String, Address> controls) {
        Map<String, List<Function>> handlers = new HashMap<>();
        
        for (Map.Entry<String, Address> entry : controls.entrySet()) {
            String controlName = entry.getKey();
            Address addr = entry.getValue();
            
            // Find cross-references to this address
            Reference[] refs = getReferencesTo(addr);
            List<Function> funcs = new ArrayList<>();
            
            for (Reference ref : refs) {
                Address refAddr = ref.getFromAddress();
                Function func = getFunctionContaining(refAddr);
                if (func != null && !funcs.contains(func)) {
                    funcs.add(func);
                    println("  " + controlName + " -> " + func.getName());
                }
            }
            
            handlers.put(controlName, funcs);
        }
        
        return handlers;
    }
    
    private Map<String, List<DataWrite>> analyzeDataWrites(Map<String, List<Function>> handlers) {
        Map<String, List<DataWrite>> writes = new HashMap<>();
        
        for (Map.Entry<String, List<Function>> entry : handlers.entrySet()) {
            String controlName = entry.getKey();
            List<DataWrite> controlWrites = new ArrayList<>();
            
            for (Function func : entry.getValue()) {
                // Analyze function for memory writes
                // Look for MOV instructions that write to data section
                AddressSetView body = func.getBody();
                InstructionIterator iter = currentProgram.getListing().getInstructions(body, true);
                
                while (iter.hasNext() && !monitor.isCancelled()) {
                    Instruction instr = iter.next();
                    
                    // Look for MOV [mem], reg or MOV [mem], imm
                    if (instr.getMnemonicString().equals("MOV")) {
                        Object[] opObjs = instr.getOpObjects(0);
                        if (opObjs != null && opObjs.length > 0 && opObjs[0] instanceof Address) {
                            Address writeAddr = (Address) opObjs[0];
                            controlWrites.add(new DataWrite(writeAddr, instr.getAddress()));
                        }
                    }
                }
            }
            
            if (!controlWrites.isEmpty()) {
                writes.put(controlName, controlWrites);
                println("  " + controlName + ": " + controlWrites.size() + " writes");
            }
        }
        
        return writes;
    }
    
    private Map<Integer, String> mapToOffsets(Map<String, List<DataWrite>> writes) {
        Map<Integer, String> mapping = new HashMap<>();
        
        // This would need to correlate write addresses with preset structure offsets
        // For now, just report the findings
        
        for (Map.Entry<String, List<DataWrite>> entry : writes.entrySet()) {
            println("  " + entry.getKey() + ":");
            for (DataWrite write : entry.getValue()) {
                println("    Writes to: " + write.targetAddr);
            }
        }
        
        return mapping;
    }
    
    private void analyzeTemplate() throws Exception {
        println("  Template at: 0x" + Long.toHexString(TEMPLATE_OFFSET));
        
        Address templateAddr = toAddr(TEMPLATE_OFFSET);
        Memory mem = currentProgram.getMemory();
        
        // Read template bytes
        byte[] template = new byte[200];
        mem.getBytes(templateAddr, template);
        
        // Analyze unknown fields
        println("\n  Unknown fields in template:");
        analyzeUnknownField(template, 0x5A, "Unknown 1");
        analyzeUnknownField(template, 0x5C, "Unknown 2");
        analyzeUnknownField(template, 0x66, "Unknown 3");
        analyzeUnknownField(template, 0x6A, "Unknown 4 (value 40)");
    }
    
    private void analyzeUnknownField(byte[] template, int offset, String name) {
        int value = (template[offset] & 0xFF) | ((template[offset + 1] & 0xFF) << 8);
        println("    0x" + Integer.toHexString(offset) + ": " + value + " - " + name);
    }
    
    private void generateReport(Map<Integer, String> mapping) {
        println("\nByte Offset Mapping:");
        for (Map.Entry<Integer, String> entry : mapping.entrySet()) {
            println("  0x" + Integer.toHexString(entry.getKey()) + ": " + entry.getValue());
        }
    }
    
    // Helper class to store data write information
    private static class DataWrite {
        Address targetAddr;
        Address instrAddr;
        
        DataWrite(Address target, Address instr) {
            this.targetAddr = target;
            this.instrAddr = instr;
        }
    }
}

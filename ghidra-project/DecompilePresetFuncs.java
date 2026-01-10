//Decompile preset parsing functions and extract structure
//@author DCX Parser
//@category Analysis
//@keybinding 
//@menupath 
//@toolbar 

import ghidra.app.script.GhidraScript;
import ghidra.app.decompiler.*;
import ghidra.program.model.address.Address;
import ghidra.program.model.listing.*;
import ghidra.program.model.pcode.*;

public class DecompilePresetFuncs extends GhidraScript {
    
    @Override
    public void run() throws Exception {
        println("=".repeat(60));
        println("Decompiling Preset Parsing Functions");
        println("=".repeat(60));
        
        DecompInterface decomp = new DecompInterface();
        decomp.openProgram(currentProgram);
        
        // Function that references XSNP
        Address[] funcAddrs = {
            toAddr(0x00421f84),  // References XSNP
            toAddr(0x004067b4),  // Has 4,6,9 constants
        };
        
        for (Address addr : funcAddrs) {
            Function func = getFunctionAt(addr);
            if (func == null) {
                println("No function at " + addr);
                continue;
            }
            
            println("\n" + "=".repeat(60));
            println("FUNCTION: " + func.getName() + " at " + addr);
            println("=".repeat(60));
            println("Signature: " + func.getSignature());
            
            // Decompile
            DecompileResults results = decomp.decompileFunction(func, 30, monitor);
            if (results.decompileCompleted()) {
                ClangTokenGroup tokenGroup = results.getCCodeMarkup();
                if (tokenGroup != null) {
                    String decompiledCode = tokenGroup.toString();
                    // Print first 5000 chars to avoid overwhelming output
                    if (decompiledCode.length() > 5000) {
                        println(decompiledCode.substring(0, 5000));
                        println("... (truncated)");
                    } else {
                        println(decompiledCode);
                    }
                }
            } else {
                println("Decompilation failed: " + results.getErrorMessage());
            }
            
            // Also look for structure size hints
            println("\n--- Structure Size Hints ---");
            Listing listing = currentProgram.getListing();
            InstructionIterator instIter = listing.getInstructions(func.getBody(), true);
            
            while (instIter.hasNext()) {
                Instruction inst = instIter.next();
                String mnemonic = inst.getMnemonicString();
                
                // Look for ADD/LEA with struct offsets
                if (mnemonic.equals("ADD") || mnemonic.equals("LEA") || mnemonic.equals("MOV")) {
                    for (int i = 0; i < inst.getNumOperands(); i++) {
                        String opRep = inst.getDefaultOperandRepresentation(i);
                        // Look for hex values that might be struct sizes/offsets
                        if (opRep.startsWith("0x")) {
                            try {
                                int val = Integer.decode(opRep);
                                // Interesting values: 124 (input stride), 90 (EQ bands), 10 (EQ band size)
                                if (val == 0x7c || val == 124 || val == 0x5a || val == 90 || 
                                    val == 10 || val == 0xa || val == 875 || val == 0x36b) {
                                    println("  " + inst.getAddress() + ": " + inst + " (value: " + val + ")");
                                }
                            } catch (NumberFormatException e) {
                                // Ignore
                            }
                        }
                    }
                }
            }
        }
        
        decomp.dispose();
        
        println("\n" + "=".repeat(60));
        println("Decompilation complete");
        println("=".repeat(60));
    }
}

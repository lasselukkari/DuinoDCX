//Decompile the decoder function FUN_004210b0
//@author DCX Parser  
//@category Analysis

import ghidra.app.script.GhidraScript;
import ghidra.app.decompiler.*;
import ghidra.program.model.address.Address;
import ghidra.program.model.listing.*;

public class DecompileDecoder extends GhidraScript {
    
    @Override
    public void run() throws Exception {
        println("=".repeat(60));
        println("Decompiling Decoder Function FUN_004210b0");
        println("=".repeat(60));
        
        DecompInterface decomp = new DecompInterface();
        decomp.openProgram(currentProgram);
        
        // The function called with XSNP data
        Address addr = toAddr(0x004210b0);
        
        Function func = getFunctionAt(addr);
        if (func == null) {
            println("No function at " + addr);
            return;
        }
        
        println("\nFUNCTION: " + func.getName() + " at " + addr);
        println("Signature: " + func.getSignature());
        
        // Decompile
        DecompileResults results = decomp.decompileFunction(func, 60, monitor);
        if (results.decompileCompleted()) {
            ClangTokenGroup tokenGroup = results.getCCodeMarkup();
            if (tokenGroup != null) {
                String decompiledCode = tokenGroup.toString();
                println(decompiledCode);
            }
        } else {
            println("Decompilation failed: " + results.getErrorMessage());
        }
        
        // Look for structure offsets in this function
        println("\n--- Structure Offset Analysis ---");
        Listing listing = currentProgram.getListing();
        InstructionIterator instIter = listing.getInstructions(func.getBody(), true);
        
        int count = 0;
        while (instIter.hasNext() && count < 500) {
            Instruction inst = instIter.next();
            String instStr = inst.toString();
            count++;
            
            // Look for interesting constants
            for (int i = 0; i < inst.getNumOperands(); i++) {
                String opRep = inst.getDefaultOperandRepresentation(i);
                if (opRep.startsWith("0x")) {
                    try {
                        int val = Integer.decode(opRep);
                        // Channel stride (124), EQ total (90), preset size (875)
                        if (val == 0x7c || val == 0x5a || val == 0x36b || 
                            val == 0x7e || val == 0x79 || val == 0x75 ||
                            val >= 110 && val <= 130) {
                            println(inst.getAddress() + ": " + instStr + " [val=" + val + "/0x" + Integer.toHexString(val) + "]");
                        }
                    } catch (NumberFormatException e) {}
                }
            }
        }
        
        decomp.dispose();
        println("=".repeat(60));
    }
}

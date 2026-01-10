//Find XSNP string references and analyze preset parsing
//@author DCX Parser
//@category Analysis
//@keybinding 
//@menupath 
//@toolbar 

import ghidra.app.script.GhidraScript;
import ghidra.program.model.address.Address;
import ghidra.program.model.listing.*;
import ghidra.program.model.mem.*;
import ghidra.program.model.symbol.*;

public class FindXSNPRefs extends GhidraScript {
    
    @Override
    public void run() throws Exception {
        println("=".repeat(60));
        println("DCX-Remote.exe XSNP Reference Analysis"); 
        println("=".repeat(60));
        
        Memory memory = currentProgram.getMemory();
        Listing listing = currentProgram.getListing();
        ReferenceManager refMgr = currentProgram.getReferenceManager();
        
        // Search for "XSNP" bytes in memory
        byte[] searchBytes = new byte[] { 0x58, 0x53, 0x4E, 0x50 }; // XSNP
        
        println("\nSearching for XSNP signature...");
        
        Address searchAddr = memory.getMinAddress();
        int count = 0;
        
        while (searchAddr != null && count < 10) {
            searchAddr = memory.findBytes(searchAddr, searchBytes, null, true, monitor);
            if (searchAddr != null) {
                println("Found XSNP at: " + searchAddr.toString());
                
                // Get references to this address
                ReferenceIterator refIter = refMgr.getReferencesTo(searchAddr);
                while (refIter.hasNext()) {
                    Reference ref = refIter.next();
                    Address fromAddr = ref.getFromAddress();
                    Function func = listing.getFunctionContaining(fromAddr);
                    String funcName = func != null ? func.getName() : "unknown";
                    println("  XRef from " + fromAddr + " in function: " + funcName);
                    
                    // Print the instruction
                    Instruction inst = listing.getInstructionAt(fromAddr);
                    if (inst != null) {
                        println("    Instruction: " + inst.toString());
                    }
                }
                
                // Move to next potential match
                searchAddr = searchAddr.add(1);
                count++;
            }
        }
        
        println("\nFound " + count + " XSNP occurrences");
        
        // Also search for loop patterns with channel counts (4, 6, 9)
        println("\n--- Channel Count Analysis ---");
        
        // Search for functions with constants 4, 6, 9 (input count, output count, EQ bands)
        FunctionIterator funcIter = listing.getFunctions(true);
        int funcCount = 0;
        
        while (funcIter.hasNext() && funcCount < 1000) {
            Function func = funcIter.next();
            funcCount++;
            
            // Check function for loop patterns
            InstructionIterator instIter = listing.getInstructions(func.getBody(), true);
            boolean has4 = false, has6 = false, has9 = false;
            
            while (instIter.hasNext()) {
                Instruction inst = instIter.next();
                String mnemonic = inst.getMnemonicString();
                
                // Look for CMP instructions
                if (mnemonic.equals("CMP") || mnemonic.equals("MOV")) {
                    for (int i = 0; i < inst.getNumOperands(); i++) {
                        String opRep = inst.getDefaultOperandRepresentation(i);
                        if (opRep.equals("0x4") || opRep.equals("4")) has4 = true;
                        if (opRep.equals("0x6") || opRep.equals("6")) has6 = true;
                        if (opRep.equals("0x9") || opRep.equals("9")) has9 = true;
                    }
                }
            }
            
            // Function with all three constants might be channel parsing loop
            if (has4 && has6 && has9) {
                println("POTENTIAL PARSING FUNCTION: " + func.getName() + " at " + func.getEntryPoint());
                println("  Has constants 4, 6, and 9");
            }
        }
        
        println("\n=".repeat(60));
        println("Analysis complete");
        println("=".repeat(60));
    }
}

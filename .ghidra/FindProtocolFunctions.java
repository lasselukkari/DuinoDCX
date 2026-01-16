// Find functions that reference protocol headers and file operations
// @category Analysis

import ghidra.app.script.GhidraScript;
import ghidra.program.model.listing.*;
import ghidra.program.model.address.*;
import ghidra.program.model.symbol.*;
import ghidra.program.model.mem.*;

public class FindProtocolFunctions extends GhidraScript {
    
    @Override
    public void run() throws Exception {
        println("Searching for protocol-related functions...");
        println("================================================================================");
        
        // Search for the protocol header string
        Memory memory = currentProgram.getMemory();
        AddressSetView searchSet = memory.getLoadedAndInitializedAddressSet();
        
        // Search for "XPRB", "XSNP", "XCUR", "XPCR" strings
        String[] protocolHeaders = {"XPRB", "XSNP", "XCUR", "XPCR", "XPRE"};
        
        for (String header : protocolHeaders) {
            println("\n--- Searching for: " + header + " ---");
            
            Address addr = find(searchSet, header.getBytes());
            while (addr != null && !monitor.isCancelled()) {
                println("Found '" + header + "' at: " + addr);
                
                // Find references to this address
                Reference[] refs = getReferencesTo(addr);
                if (refs.length > 0) {
                    println("  References to this string:");
                    for (Reference ref : refs) {
                        Address fromAddr = ref.getFromAddress();
                        Function func = getFunctionContaining(fromAddr);
                        if (func != null) {
                            println("    From function: " + func.getName() + " at " + fromAddr);
                        } else {
                            println("    From address: " + fromAddr);
                        }
                    }
                } else {
                    println("  No references found");
                }
                
                // Search for next occurrence
                addr = find(addr.add(1), searchSet, header.getBytes(), null, true, monitor);
            }
        }
        
        println("\n================================================================================");
        println("Searching for file I/O related functions...");
        println("================================================================================");
        
        // Search for common file I/O function names
        String[] fileIOKeywords = {"fopen", "fread", "fwrite", "fclose", "CreateFile", "ReadFile", "WriteFile"};
        
        FunctionManager funcMgr = currentProgram.getFunctionManager();
        for (Function func : funcMgr.getFunctions(true)) {
            String funcName = func.getName().toLowerCase();
            for (String keyword : fileIOKeywords) {
                if (funcName.contains(keyword.toLowerCase())) {
                    println("Found file I/O function: " + func.getName() + " at " + func.getEntryPoint());
                    break;
                }
            }
        }
        
        println("\n================================================================================");
        println("Analysis complete");
    }
}

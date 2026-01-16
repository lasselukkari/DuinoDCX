// Search for protocol-related strings in DCX-Remote.exe
// @category Analysis

import ghidra.app.script.GhidraScript;
import ghidra.program.model.listing.*;
import ghidra.program.model.address.*;

public class SearchStrings extends GhidraScript {
    
    @Override
    public void run() throws Exception {
        // Keywords to search for
        String[] keywords = {
            "XPCR", "XPRB", "XSNP", "XCUR", 
            "preset", "Preset", "PRESET",
            "save", "Save", "SAVE",
            "copy", "Copy", "COPY",
            "edit", "Edit", "EDIT",
            "buffer", "Buffer", "BUFFER",
            ".dcx", "DCX",
            "offset", "Offset", "OFFSET"
        };
        
        println("Searching for protocol-related strings...");
        println("================================================================================");
        
        Listing listing = currentProgram.getListing();
        AddressSetView dataAddresses = currentProgram.getMemory().getLoadedAndInitializedAddressSet();
        
        int foundCount = 0;
        
        // Iterate through all defined data
        DataIterator dataIter = listing.getDefinedData(dataAddresses, true);
        while (dataIter.hasNext() && !monitor.isCancelled()) {
            Data data = dataIter.next();
            
            if (data.hasStringValue()) {
                String stringValue = (String) data.getValue();
                if (stringValue != null) {
                    for (String keyword : keywords) {
                        if (stringValue.contains(keyword)) {
                            Address addr = data.getAddress();
                            String preview = stringValue.length() > 100 ? 
                                stringValue.substring(0, 100) + "..." : stringValue;
                            println(String.format("Found '%s' at %s: %s", keyword, addr, preview));
                            foundCount++;
                            break;
                        }
                    }
                }
            }
        }
        
        println("================================================================================");
        println(String.format("Total strings found: %d", foundCount));
    }
}

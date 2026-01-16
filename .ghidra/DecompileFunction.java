//Simple Ghidra script to decompile specific function
//@category DCX2496

import ghidra.app.script.GhidraScript;
import ghidra.app.decompiler.DecompInterface;
import ghidra.app.decompiler.DecompileResults;
import ghidra.program.model.listing.Function;
import ghidra.program.model.address.Address;
import java.io.FileWriter;

public class DecompileFunction extends GhidraScript {
    @Override
    public void run() throws Exception {
        // Target function: CbDelayUnitChange at 0x00427074
        long[] addrs = {0x00427074, 0x00433f40, 0x00433f94, 0x00425714}; 
        
        DecompInterface decomp = new DecompInterface();
        decomp.openProgram(currentProgram);
        
        FileWriter fw = new FileWriter("/tmp/dcx_decompiled.txt");
        
        for (long addrVal : addrs) {
            Address addr = toAddr(addrVal);
            Function func = getFunctionAt(addr);
            
            if (func == null) {
                func = createFunction(addr, null);
            }
            
            if (func != null) {
                fw.write("=== Function at " + addr.toString() + " (" + func.getName() + ") ===\n");
                DecompileResults res = decomp.decompileFunction(func, 60, monitor);
                if (res.decompileCompleted()) {
                    fw.write(res.getDecompiledFunction().getC());
                } else {
                    fw.write("Decompilation failed\n");
                }
                fw.write("\n\n");
            } else {
                fw.write("No function at " + addr.toString() + "\n\n");
            }
        }
        
        fw.close();
        decomp.dispose();
        println("Wrote decompiled code to /tmp/dcx_decompiled.txt");
    }
}

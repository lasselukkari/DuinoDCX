# Ghidra Script: Find XSNP references and preset parsing functions
# Run with: analyzeHeadless ... -postScript find_xsnp_refs.py

from ghidra.program.model.symbol import RefType
from ghidra.program.model.listing import CodeUnit

def find_string_refs(search_str):
    """Find all cross-references to a string in memory"""
    listing = currentProgram.getListing()
    memory = currentProgram.getMemory()
    
    # Search for the string in memory
    results = []
    
    # Get all defined strings
    dataIterator = listing.getDefinedData(True)
    while dataIterator.hasNext():
        data = dataIterator.next()
        if data.getDataType().getName() == "string" or data.getDataType().getName() == "unicode":
            value = data.getValue()
            if value and search_str in str(value):
                print(f"Found string '{value}' at {data.getAddress()}")
                results.append(data.getAddress())
    
    return results

def get_xrefs_to(addr):
    """Get all references to an address"""
    refs = getReferencesTo(addr)
    for ref in refs:
        from_addr = ref.getFromAddress()
        func = getFunctionContaining(from_addr)
        func_name = func.getName() if func else "unknown"
        print(f"  XRef from {from_addr} in function {func_name}")
        
        # Print surrounding instructions
        listing = currentProgram.getListing()
        inst = listing.getInstructionAt(from_addr)
        if inst:
            print(f"    Instruction: {inst}")

def analyze_function(func):
    """Analyze a function for loop patterns"""
    if func is None:
        return
    
    print(f"\n=== Analyzing function: {func.getName()} at {func.getEntryPoint()} ===")
    
    # Get function body
    body = func.getBody()
    listing = currentProgram.getListing()
    
    # Look for loop patterns (compare and jump)
    inst_iter = listing.getInstructions(body, True)
    loop_count = 0
    while inst_iter.hasNext():
        inst = inst_iter.next()
        mnemonic = inst.getMnemonicString()
        if mnemonic in ["CMP", "TEST"]:
            # Check what's being compared
            operands = []
            for i in range(inst.getNumOperands()):
                operands.append(str(inst.getDefaultOperandRepresentation(i)))
            print(f"  {inst.getAddress()}: {mnemonic} {', '.join(operands)}")
            loop_count += 1
    
    if loop_count > 0:
        print(f"  Found {loop_count} potential loop comparisons")

# Main script
print("=" * 60)
print("DCX-Remote.exe XSNP Reference Analysis")
print("=" * 60)

# Search for XSNP signature
xsnp_addrs = find_string_refs("XSNP")
print(f"\nFound {len(xsnp_addrs)} XSNP string references")

# Get cross-references to each
for addr in xsnp_addrs:
    print(f"\nCross-references to XSNP at {addr}:")
    get_xrefs_to(addr)

# Also search for preset-related strings
for search_str in ["Preset", "channel", "EQ", "XPRB"]:
    addrs = find_string_refs(search_str)
    if addrs:
        print(f"\n{search_str} found at: {[str(a) for a in addrs[:5]]}")

print("\n" + "=" * 60)
print("Analysis complete")
print("=" * 60)

# Search for protocol-related strings in DCX-Remote.exe
# @category Analysis

from ghidra.program.model.listing import CodeUnit

# Get the current program
program = currentProgram
listing = program.getListing()

# Keywords to search for
keywords = ["XPCR", "XPRB", "XSNP", "XCUR", "preset", "Preset", "PRESET", 
            "save", "Save", "SAVE", "copy", "Copy", "COPY", 
            "edit", "Edit", "EDIT", "buffer", "Buffer", "BUFFER",
            ".dcx", "DCX", "offset", "Offset"]

print("Searching for protocol-related strings...")
print("=" * 80)

# Search through all defined strings
string_iter = listing.getDefinedData(True)
found_strings = []

for data in string_iter:
    if data.hasStringValue():
        string_value = data.getValue()
        if string_value:
            string_text = str(string_value)
            for keyword in keywords:
                if keyword in string_text:
                    addr = data.getAddress()
                    found_strings.append((addr, string_text, keyword))
                    print("Found '{}' at {}: {}".format(keyword, addr, string_text[:100]))
                    break

print("=" * 80)
print("Total strings found: {}".format(len(found_strings)))

#!/bin/bash
# Automated radare2 script to trace UI handler functions and find byte offsets

EXE="/Users/lasselukkari/Documents/DuinoDCX/DCX2496_V1_16/DCX2496_V1_16/DCX-Remote.exe"

echo "=== AUTOMATED HANDLER TRACING ==="
echo

# Function to analyze a handler
analyze_handler() {
    local handler_name=$1
    echo "Analyzing: $handler_name"
    
    r2 -q -c "aaa; / $handler_name" "$EXE" 2>&1 | grep -A10 "$handler_name" | head -15
    echo
}

# Analyze each known handler
echo "1. Delay Unit Handler:"
analyze_handler "CbDelayUnitChange"

echo "2. Mute Outs Handler:"
analyze_handler "MuteOutsClick"

echo "3. Stereo Link Handler:"
analyze_handler "cbStereoLink"

echo "4. Preset Number:"
analyze_handler "Preset Number"

echo "=== FINDING DATA WRITE OPERATIONS ==="
echo

# Search for MOV instructions that write to specific offsets
echo "Searching for writes to preset data structure..."
r2 -q -c "aaa; /c mov" "$EXE" 2>&1 | grep -i "mov.*\[" | head -20

echo
echo "Analysis complete. Review output above for byte offset clues."

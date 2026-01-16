#!/usr/bin/env python3
"""
Automated analysis script to identify all unknown bytes in DCX2496 protocol
by analyzing DCX-Remote.exe binary and test files.
"""

import struct
import json
from pathlib import Path

# Paths
DCX_PARSER_DIR = Path("/Users/lasselukkari/Documents/DuinoDCX/dcx-parser")
TEST_DIR = DCX_PARSER_DIR / "src/test"
EXE_PATH = Path("/Users/lasselukkari/Documents/DuinoDCX/DCX2496_V1_16/DCX2496_V1_16/DCX-Remote.exe")

# Known offsets
TEMPLATE_OFFSET = 0x000F8DAC

class UnknownByteAnalyzer:
    def __init__(self):
        self.factory_dcx = self.load_file(TEST_DIR / "factory-presets.dcx")
        self.current_dcx = self.load_file(TEST_DIR / "current.dcx")
        self.test_json = self.load_json(TEST_DIR / "current-state-browser.json")
        self.exe_data = self.load_file(EXE_PATH)
        
    def load_file(self, path):
        with open(path, 'rb') as f:
            return f.read()
    
    def load_json(self, path):
        with open(path, 'r') as f:
            return json.load(f)
    
    def read_u16le(self, data, offset):
        """Read 16-bit little-endian value"""
        return struct.unpack('<H', data[offset:offset+2])[0]
    
    def analyze_unknown_fields(self):
        """Analyze all unknown fields by comparing test files and template"""
        print("=== UNKNOWN BYTES ANALYSIS ===\n")
        
        # Unknown fields to analyze
        unknowns = [
            (0x5A, "Unknown field 1"),
            (0x5C, "Unknown field 2"),
            (0x66, "Unknown field 3"),
            (0x6A, "Unknown field 4 (value 40)"),
        ]
        
        template = self.exe_data[TEMPLATE_OFFSET:TEMPLATE_OFFSET+200]
        
        for offset, name in unknowns:
            print(f"{name} at 0x{offset:02X}:")
            
            # Get values from all sources
            template_val = self.read_u16le(template, offset)
            factory_val = self.read_u16le(self.factory_dcx, offset)
            current_val = self.read_u16le(self.current_dcx, offset)
            
            print(f"  Template: {template_val}")
            print(f"  Factory:  {factory_val}")
            print(f"  Current:  {current_val}")
            
            # Analyze pattern
            if template_val == factory_val == current_val:
                print(f"  → All identical: likely default/constant value")
            else:
                print(f"  → Values differ: likely variable parameter")
            
            # Try to identify based on value
            self.identify_field(offset, template_val, name)
            print()
    
    def identify_field(self, offset, value, name):
        """Try to identify field based on value and position"""
        
        # Check against known enum ranges
        if value == 0:
            print(f"  Possibility: Boolean (false) or unused/reserved")
        elif value == 1:
            print(f"  Possibility: Boolean (true) or enum index 1")
        elif value == 40:
            print(f"  Possibility: Temperature (40°C), offset, or special value")
            print(f"  NOT stereolinkMode (should be 0-3)")
        elif 0 <= value <= 10:
            print(f"  Possibility: Small enum or index")
        elif 100 <= value <= 200:
            print(f"  Possibility: Gain value (dB scale)")
        
    def analyze_field_order(self):
        """Determine delayUnits vs muteOutsWhenPowered order"""
        print("=== FIELD ORDER ANALYSIS ===\n")
        
        print("delayUnits vs muteOutsWhenPowered:")
        
        val_56 = self.read_u16le(self.current_dcx, 0x56)
        val_58 = self.read_u16le(self.current_dcx, 0x58)
        
        print(f"  0x56: {val_56}")
        print(f"  0x58: {val_58}")
        
        # delayUnits enum: ['mm', 'inch'] -> 0 or 1
        # muteOutsWhenPowered: boolean -> 0 or 1
        
        # Test expects: delayUnits='mm' (0), muteOutsWhenPowered=false (0)
        # But file has: 0x56=1, 0x58=0
        
        print("\n  Test expects:")
        print(f"    delayUnits: {self.test_json['setup']['delayUnits']} (0=mm, 1=inch)")
        print(f"    muteOutsWhenPowered: {self.test_json['setup']['muteOutsWhenPowered']} (0=false, 1=true)")
        
        print("\n  Analysis:")
        if val_56 == 1 and val_58 == 0:
            print("    0x56=1 could be delayUnits='inch' (but test says 'mm'!)")
            print("    0x58=0 matches muteOutsWhenPowered=false ✓")
            print("\n  CONCLUSION: Either test file is wrong OR fields are swapped")
        
    def search_exe_strings(self):
        """Search exe for relevant UI strings"""
        print("=== EXE STRING SEARCH ===\n")
        
        search_terms = [
            b"Delay Unit",
            b"Mute Out",
            b"Stereo Link",
            b"Air Temp",
            b"Preset Number",
        ]
        
        for term in search_terms:
            pos = self.exe_data.find(term)
            if pos != -1:
                print(f"Found '{term.decode()}' at 0x{pos:08X}")
    
    def generate_report(self):
        """Generate comprehensive report"""
        print("\n" + "="*60)
        print("COMPREHENSIVE ANALYSIS REPORT")
        print("="*60 + "\n")
        
        self.analyze_unknown_fields()
        self.analyze_field_order()
        self.search_exe_strings()
        
        print("\n" + "="*60)
        print("RECOMMENDATIONS")
        print("="*60)
        print("""
1. Field at 0x6A (value 40):
   - NOT stereolinkMode (should be 0-3, not 40)
   - Possibly temperature-related or a different parameter
   - Needs manual verification in Ghidra

2. Fields at 0x5A, 0x5C (value 0):
   - Likely reserved/padding
   - Or rarely-used parameters with default 0

3. Field at 0x66 (value 1):
   - Likely a boolean flag or enum with default=1
   - Position suggests input-related parameter

4. delayUnits/muteOutsWhenPowered order:
   - Test file may have incorrect values
   - Need to verify with exe handler functions

5. Active preset number:
   - Found "Preset Number" string in exe
   - Likely in XCUR extension bytes
   - Need to trace preset selection UI
""")

if __name__ == "__main__":
    analyzer = UnknownByteAnalyzer()
    analyzer.generate_report()

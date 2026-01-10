# implementation_plan: Data-Driven Parser Refactoring

Target: Refactor `preset-parser.ts` and `state-parser.ts` to use a unified, data-driven engine based on offset maps.

## Background
We have successfully developed the generic parsing core and generated the necessary 16-bit offset maps for presets. The goal is now to move away from manually coded byte-shifting logic and use the generic engine. Also the 16-bit offset maps should convert to 8-bit offset maps that has the same format as as current state parser offset map.

## Infrastructure Ready
The following components have been implemented and are ready for integration:
- **Generic Engine**: `dcx-parser-new/src/model/generic-parser.ts` containing `parseStateGeneric`.
- **Offset Maps**: 
    - 8-bit (Status/State): `dcx-parser-new/src/model/offset-map-8bit.ts`
    - 16-bit (Presets): `dcx-parser-new/src/model/offset-map-preset.ts` We want to programmatically generate this 8 bit version from the 16 bit version.    

### Automated Tests
*   **Golden Comparison**: Run existing integration tests to ensure the new data-driven parser produces identical results to the legacy manual parser for the verified `edit_buffer_golden.json`.
*   **Preset Equality**: Compare the output of the new `preset-parser` against the legacy mapper results.

### Manual Verification

Notify when we are ready to start the manual verification process.
Yu will write a scipt that downloads the current state and presets from the device. The same preset has been store to the first and the last preset memory location. The script should verify that the json object of the current stat equals with the json object of the first preset and the last preset. The will most likely differ a bit at this point this is expected. 



import {type Status} from './types/index.js';

export function parseStatus(_data: Uint8Array): Status {
  // Basic implementation of Status parsing (Msg Type 0x21)
  // Assuming standard DCX structure:
  // Data is usually not 7-bit encoded for Meters? Or is it?
  // Meters are typically high rate, heavily optimized.
  // But documentation says "All data ... 7-bit encoded".

  // If input 'data' is the raw payload (after header):
  // Let's assume standard decoding first.

  // Placeholder implementation to verify type compatibility first.
  // The exact byte mapping requires reference.
  // Inputs: A, B, C, Sum (4)
  // Outputs: 1..6 (6)
  // Structure:
  // [InputLevels x4] [OutputLevels x6] [LimiterFlags] [FreeMem]

  // For now, return empty/safe defaults to allow build to pass.
  // Real logic needs to be verified against device.

  return {
    inputs: [],
    outputs: [],
    free: 100,
  };
}

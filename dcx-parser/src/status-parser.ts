import { type Status } from './types/index.js';

export function parseStatus(data: Uint8Array): Status {
  const inputs: Array<{ name: string; level: number; isLimited: boolean }> = [];
  const inputNames = ['A', 'B', 'C'];

  for (let i = 0; i < inputNames.length; i++) {
    const byteIndex = i + 8;
    if (byteIndex < data.length) {
      const value = data[byteIndex];
      const level = value & ~0x20;
      const isLimited = (value & 0x20) !== 0;

      inputs.push({ name: inputNames[i], level, isLimited });
    }
  }

  const outputs: Array<{ name: string; level: number; isLimited: boolean }> = [];

  for (let i = 0; i < 6; i++) {
    const byteIndex = i + 11;
    if (byteIndex < data.length) {
      const value = data[byteIndex];
      const level = value & ~0x20;
      const isLimited = (value & 0x20) !== 0;

      outputs.push({ name: String(i + 1), level, isLimited });
    }
  }

  let free = 0;
  if (21 < data.length) {
    free = data[21];
  }

  return {
    inputs,
    outputs,
    free,
  };
}

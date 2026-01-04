/**
 * Decoded index mapping for DCX2496 parameters.
 *
 * After decoding a DUMP_RESPONSE with decode7to8(), the values are in a flat array.
 * This maps decoded indices to parameter names and metadata.
 *
 * Generated from commands.ts syncResponse definitions using encodedToDecodedIndex().
 */

import type {Command} from './commands.js';
import * as commands from './commands.js';

// Header size in raw MIDI message
const DUMP_HEADER_SIZE = 13;

/**
 * Convert encoded byte position to decoded index.
 */
function encodedToDecoded(encodedPos: number): number {
  const payloadPos = encodedPos - DUMP_HEADER_SIZE;
  if (payloadPos < 0) return -1;

  const group = Math.floor(payloadPos / 8);
  const posInGroup = payloadPos % 8;

  if (posInGroup === 7) return -1; // Flag byte
  return group * 7 + posInGroup;
}

export type ParameterMapping = {
  name: string;
  command: Command;
  decodedIndex: number;
  highByteIndex?: number; // For 16-bit values
};

function buildSetupMappings(setup: Map<number, ParameterMapping>) {
  for (const cmd of commands.setupCommands) {
    if (!cmd.syncResponse?.bits6) continue;
    const idx = encodedToDecoded(cmd.syncResponse.bits6.index);
    if (idx >= 0) {
      const highIdx = cmd.syncResponse.bits8
        ? encodedToDecoded(cmd.syncResponse.bits8.index)
        : undefined;
      setup.set(idx, {
        name: cmd.name,
        command: cmd,
        decodedIndex: idx,
        highByteIndex: highIdx,
      });
    }
  }
}

function buildChannelMappings(
  commandsList: Command[],
  channelMaps: Array<Map<number, ParameterMapping>>,
  offset = 0,
) {
  for (const cmd of commandsList) {
    if (!cmd.syncResponses) continue;
    for (let ch = 0; ch < cmd.syncResponses.length; ch++) {
      const syncResp = cmd.syncResponses[ch];
      if (!syncResp?.bits6) continue;
      const idx = encodedToDecoded(syncResp.bits6.index);
      if (idx >= 0) {
        const highIdx = syncResp.bits8
          ? encodedToDecoded(syncResp.bits8.index)
          : undefined;
        channelMaps[ch + offset].set(idx, {
          name: cmd.name,
          command: cmd,
          decodedIndex: idx,
          highByteIndex: highIdx,
        });
      }
    }
  }
}

function buildEqMappings(eq: Array<Array<Map<number, ParameterMapping>>>) {
  for (const cmd of commands.eqCommands) {
    if (!cmd.syncResponses) continue;
    for (let i = 0; i < cmd.syncResponses.length; i++) {
      const ch = Math.floor(i / 9);
      const eqNumber = i % 9;
      const syncResp = cmd.syncResponses[i];
      if (!syncResp?.bits6) continue;
      const idx = encodedToDecoded(syncResp.bits6.index);
      if (idx >= 0) {
        const highIdx = syncResp.bits8
          ? encodedToDecoded(syncResp.bits8.index)
          : undefined;
        eq[ch][eqNumber].set(idx, {
          name: cmd.name,
          command: cmd,
          decodedIndex: idx,
          highByteIndex: highIdx,
        });
      }
    }
  }
}

/**
 * Build parameter mappings from commands.ts.
 * Returns maps keyed by decoded index for fast lookup.
 */
function buildMappings() {
  const setup = new Map<number, ParameterMapping>();
  const inputOutput: Array<Map<number, ParameterMapping>> = [];
  const outputOnly: Array<Map<number, ParameterMapping>> = [];
  const eq: Array<Array<Map<number, ParameterMapping>>> = [];

  for (let i = 0; i < 10; i++) {
    inputOutput.push(new Map());
    outputOnly.push(new Map());
    eq.push([]);
    for (let j = 0; j < 9; j++) {
      eq[i].push(new Map());
    }
  }

  buildSetupMappings(setup);
  buildChannelMappings(commands.inputOutputCommands, inputOutput);
  buildChannelMappings(commands.outputCommands, outputOnly, 4);
  buildEqMappings(eq);

  return {setup, inputOutput, outputOnly, eq};
}

export const parameterMappings = buildMappings();

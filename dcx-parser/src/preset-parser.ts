import {PRESET_SETUP_PARAMETERS, INPUT_NAMES, OUTPUT_NAMES} from './structure.js';
import {
  type State as ExtendedState,
  type BufferHeader,
  type InputChannel,
  type OutputChannel,
} from './types/index.js';
import {
  type Cursor,
  readString,
  readU16LE,
  readBytes,
  parseSequential,
  parseInputChannel,
  parseOutputChannel,
  parseInputChannelNames,
} from './parser-utils.js';

export function parsePreset(buffer: Uint8Array): ExtendedState {

  // Find XSNP signature
  let headerOffset = -1;
  for (let i = 0; i < 20; i++) {
    if (
      buffer[i] === 0x58 &&
      buffer[i + 1] === 0x53 &&
      buffer[i + 2] === 0x4e &&
      buffer[i + 3] === 0x50
    ) {
      headerOffset = i;
      break;
    }
  }

  if (headerOffset === -1) {
    throw new Error(
      'Invalid Preset Data: XSNP signature not found in first 20 bytes',
    );
  }

  // Parse header (minimal - just signature info)
  const header: BufferHeader = {
    xpcrSignature: readString(buffer, headerOffset, 4),
    xpcrVersion: readU16LE(buffer, headerOffset + 4),
    xpcrExtension: readBytes(buffer, headerOffset + 6, 6),
    xprbSignature: '',
    xprbVersion: 0,
    xprbExtension: new Uint8Array(0),
    deviceName: '',
    deviceNamePadding: new Uint8Array(0),
    signatureBytes: new Uint8Array(0),
    xcurSignature: '',
    xcurVersion: 0,
    xcurExtension: new Uint8Array(0),
    presetName: readString(buffer, headerOffset + 68, 8), // Offset 68 from XSNP = after skip(60) + 8 for name
    presetNamePadding: new Uint8Array(0),
    headerReserved: new Uint8Array(0),
  };

  // ========== MAIN PARSING ==========

  // Start parsing from XSNP header
  const cursor: Cursor = {
    buffer,
    offset: headerOffset,
  };

  // Parse Setup parameters (includes skipping header, getting preset name, and setup values)
  const setupRaw = parseSequential(cursor, PRESET_SETUP_PARAMETERS);

  // Use setup presetName if available (override header)
  if (
    typeof setupRaw.presetName === 'string' &&
    setupRaw.presetName.trim().length > 0
  ) {
    header.presetName = setupRaw.presetName;
  }

  delete setupRaw.presetName;

  // Remove internal fields
  delete setupRaw.setup_header;

  // Fields not stored in presets (only in Edit Buffer) - add defaults:
  // delayUnits: global UI preference
  // outputConfig: derived from output channel assignments (TODO: compute from outputs)
  // isDelayCorrectionOn: not stored in presets
  // muteOutsWhenPowered: global setting, not in presets
  setupRaw.delayUnits = 'mm';
  setupRaw.isDelayCorrectionOn = false;
  setupRaw.muteOutsWhenPowered = false;
  // outputConfig is NOT defaulted here - it should be computed from output configs
  // For now, leave it undefined and let the calling code handle it

  const setup = setupRaw;

  // Parse 4 Input Channels
  const inputs: Record<string, InputChannel> = {};
  for (const name of INPUT_NAMES) {
    inputs[name] = parseInputChannel(cursor);
  }

  // Parse 6 Output Channels
  const outputs: Record<string, OutputChannel> = {};
  for (const name of OUTPUT_NAMES) {
    outputs[name] = parseOutputChannel(cursor);
  }

  // Parse Input Channel Names from trailing block
  parseInputChannelNames(cursor, inputs);


  return {
    header,
    setup,
    inputs,
    outputs,
  };
}


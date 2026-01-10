import {decode7to8} from './protocol/encoding.js';
import {
  PRESET_SETUP_PARAMS,
  INPUT_CHANNEL_PARAMS,
  EQ_BAND_PARAMS,
  OUTPUT_CHANNEL_PARAMS_PREFIX,
  OUTPUT_EXTRA_PARAMS,
  INPUT_NAMES,
  OUTPUT_NAMES,
  INPUT_EQ_COUNT,
  OUTPUT_EQ_COUNT,
} from './structure.js';
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
} from './parser-utils.js';

export function parsePreset(input: Uint8Array | Uint8Array[]): ExtendedState {
  let buffer: Uint8Array;

  if (Array.isArray(input)) {
    // Concatenate pages
    const payloads = input.map((page) => {
      if (
        page[0] === 0xf0 &&
        page[1] === 0x00 &&
        page[2] === 0x20 &&
        page[3] === 0x32
      ) {
        return decode7to8(page.slice(13, -1), {indexed: false});
      }

      return decode7to8(page, {indexed: false});
    });

    const totalSize = payloads.reduce((acc, p) => acc + p.length, 0);
    buffer = new Uint8Array(totalSize);
    let offset = 0;
    for (const p of payloads) {
      buffer.set(p, offset);
      offset += p.length;
    }
  } else {
    buffer = input;
  }

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
  const setupRaw = parseSequential(cursor, PRESET_SETUP_PARAMS);

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

  return {
    header,
    setup,
    inputs: inputs as any,
    outputs: outputs as any,
  };
}

function parseInputChannel(cursor: Cursor): InputChannel {
  // Parse input prefix params (Little Endian)
  const basic = parseSequential(cursor, INPUT_CHANNEL_PARAMS);
  const channel: InputChannel = basic as any;

  // Parse 9 EQ bands (Little Endian)
  for (let j = 1; j <= INPUT_EQ_COUNT; j++) {
    const eqData = parseSequential(cursor, EQ_BAND_PARAMS);
    channel[`eq${j}`] = eqData;
  }

  return channel;
}

function parseOutputChannel(cursor: Cursor): OutputChannel {
  // Parse Output Prefix (Use Input Structure)
  const prefix = parseSequential(cursor, OUTPUT_CHANNEL_PARAMS_PREFIX);
  const channel: OutputChannel = prefix as any;

  // Parse 9 EQ bands
  for (let j = 1; j <= OUTPUT_EQ_COUNT; j++) {
    const eqData = parseSequential(cursor, EQ_BAND_PARAMS);
    channel[`eq${j}`] = eqData;
  }

  // Parse extra output params
  const extra = parseSequential(cursor, OUTPUT_EXTRA_PARAMS);
  Object.assign(channel, extra);
  return channel;
}

import { INPUT_NAMES, OUTPUT_NAMES, EDIT_BUFFER_SETUP_PARAMETERS as SETUP_PARAMETERS, } from './structure.js';
import { readString, readU16LE, readBytes, parseSequential, parseInputChannel, parseOutputChannel, parseInputChannelNames, } from './parser-utils.js';
// Export for tests if needed, but better to export from utils
export { readString, readU16LE, readBytes, nextU16, parseSequential, parseInputChannel, parseOutputChannel, } from './parser-utils.js';
function parseHeader(buffer) {
    // Offsets based on refined analysis
    return {
        xpcrSignature: readString(buffer, 0, 4),
        xpcrVersion: readU16LE(buffer, 4),
        xpcrExtension: readBytes(buffer, 6, 6),
        xprbSignature: readString(buffer, 12, 4),
        xprbVersion: readU16LE(buffer, 16),
        xprbExtension: readBytes(buffer, 18, 6),
        // Gap at 24 (10 bytes)
        deviceName: readString(buffer, 34, 8),
        deviceNamePadding: readBytes(buffer, 42, 8),
        signatureBytes: readBytes(buffer, 50, 4),
        xcurSignature: readString(buffer, 54, 4),
        xcurVersion: readU16LE(buffer, 58),
        xcurExtension: readBytes(buffer, 60, 12),
        presetName: readString(buffer, 72, 8),
        presetNamePadding: readBytes(buffer, 80, 16),
        headerReserved: readBytes(buffer, 96, 8),
    };
}
export function parseEditBuffer(decoded) {
    const MIN_SIZE = 1600; // Approx check
    if (decoded.length < MIN_SIZE) {
        throw new Error(`Buffer too short: ${decoded.length} bytes`);
    }
    // Header Offset Detection
    let headerOffset = -1;
    for (let i = 0; i < 20; i++) {
        if (decoded[i] === 0x58 &&
            decoded[i + 1] === 0x50 &&
            decoded[i + 2] === 0x43 &&
            decoded[i + 3] === 0x52) {
            headerOffset = i;
            break;
        }
    }
    const effectiveHeaderOffset = headerOffset === -1 ? 0 : headerOffset;
    // Parse Header from calculated start
    const header = parseHeader(decoded.slice(effectiveHeaderOffset));
    // Initialize Cursor
    // Start at offset 1 (odd alignment)
    const cursor = {
        buffer: decoded,
        offset: 1,
    };
    // 1. Setup
    const setup = parseSequential(cursor, SETUP_PARAMETERS);
    // 2. Inputs
    const inputs = {};
    for (const name of INPUT_NAMES) {
        inputs[name] = parseInputChannel(cursor);
    }
    // 3. Outputs
    const outputs = {};
    for (const name of OUTPUT_NAMES) {
        outputs[name] = parseOutputChannel(cursor);
    }
    // 4. Parse Input Channel Names from trailing block
    parseInputChannelNames(cursor, inputs);
    return {
        header,
        setup,
        inputs,
        outputs,
    };
}
//# sourceMappingURL=edit-buffer-parser.js.map
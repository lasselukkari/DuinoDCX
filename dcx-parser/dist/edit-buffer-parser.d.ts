import { type State as ExtendedState } from './types/index.js';
export { readString, readU16LE, readBytes, nextU16, parseSequential, parseInputChannel, parseOutputChannel, } from './parser-utils.js';
export type { Cursor } from './parser-utils.js';
export declare function parseEditBuffer(decoded: Uint8Array): ExtendedState;
//# sourceMappingURL=edit-buffer-parser.d.ts.map
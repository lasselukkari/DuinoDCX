# Refactoring Plan: Modular DCX Parser & Transport Abstraction

## Goal
To restructure `dcx-parser` into a cleaner, modular library that separates protocol logic, transport mechanisms, and command generation. The ultimate goal is to allow `dcx-ui` to replace its legacy parser with this library, supporting HTTP/SSE "Serial-over-Network" communication via a unified interface.

## 1. Architectural Changes

We will reorganize `dcx-parser/src` into domain-specific modules to reduce file size and improve discoverability.

### Proposed Directory Structure
```
src/
├── protocol/           # Low-level SysEx handling
│   ├── sysex.ts        # Message framing (start/end/checksum)
│   ├── checksum.ts     # Checksum algorithms
│   ├── encoding.ts     # 7-to-8 bit conversion
│   └── constants.ts    # Protocol constants
│
├── types/              # Shared Type definitions
│   ├── index.ts
│   └── ...
│
├── model/              # Domain Objects & Logic
│   ├── param-lookup.ts # Parameter mapping
│   ├── commands.ts     # Command definitions/metadata
│   └── state.ts        # Internal state representation
│
├── commands/           # Command Generation (Factories)
│   ├── generators.ts   # High-level command builders (Direct, Store, etc.)
│   └── parser.ts       # Message parser (bytes -> meaningful objects)
│
├── transport/          # Connection Logic
│   ├── interface.ts    # DuplexConnection interface
│   ├── restore.ts      # RestoreSession (Business Logic using Transport)
│   └── adapters/       # Concrete implementations (optional)
│
├── file/               # File Handling (.dcx)
│   ├── reader.ts
│   └── writer.ts
│
└── index.ts            # Main Public API (Exports Facade)
```

## 2. Transport Abstraction Layer

We will define a generic interface for bidirectional communication. This allows the parser logic (like `RestoreSession`) to operate identically whether connected to a real serial port (Node.js) or an HTTP/SSE proxy (Browser).

### Validated Interface
```typescript
/**
 * Represents a bidirectional connection stream.
 * Can be a Serial Port, a WebSocket, or an HTTP/SSE pair.
 */
export interface DuplexConnection {
  /**
   * Send binary data to the device.
   */
  send(data: Uint8Array): Promise<void>;

  /**
   * Subscribe to incoming data.
   * Returns a function to unsubscribe.
   */
  subscribe(callback: (data: Uint8Array) => void): () => void;

  /**
   * Close the connection.
   */
  close(): void;
}
```

### UI Implementation Strategy (Browser-Side)
The `dcx-ui` will implement an adapter `HttpSseConnection` that satisfies this interface:
*   `send(data)`: Performs `POST /api/commands` with binary body.
*   `subscribe(cb)`: Listens to the existing SSE stream and forwards `DUMP_RESPONSE` / `DIRECT_COMMAND` type messages as raw bytes to the callback.

## 3. Verification Strategy

We must ensure that refactoring does not break existing functionality.

### Phase A: Non-Regression Testing
1.  **Unit Tests**: Run `npm test` after every move/rename.
2.  **Snapshot Testing**:
    *   Create a "Golden Master" test suite before starting.
    *   Generate a large set of inputs (State objects) and record the `Parser.serializeCommands` outputs.
    *   Verify the refactored `commands/generators.ts` produces **identical** byte output for the same inputs.

### Phase B: Transport Integration Testing
1.  **Mock Transport**: Create a `MockDuplexConnection` for testing `RestoreSession` in isolation.
2.  **Round-Trip**: Verify `restore.ts` works with the Mock Transport exactly as it does with the current implementation.

## 4. Implementation Steps

### 4.0. Phase 0: Safe Environment Setup
1.  **Duplicate Project**:
    *   Create a full copy of the current parser to a new working directory: `dcx-parser-new`.
    *   `cp -r dcx-parser dcx-parser-new`
    *   All subsequent refactoring work will take place in `dcx-parser-new` to isolate changes from the active workspace.

### 4.1. Code Cleanup (Immediate)
1.  **Split Constants**: Break `constants.ts` (850+ lines) into modular files:
    *   `src/constants/enums.ts` (Parameter enums like `eqTypes`, `filterTypes`)
    *   `src/constants/limits.ts` (Min/Max values, steps)
    *   `src/constants/protocol.ts` (SysEx bytes, header formats)
2.  **Clean Commands**: Remove legacy `syncResponse` / `bits6/7/8` mappings from `commands.ts`.
    *   The parser should rely **exclusively** on `generated-mappings.ts` / `param-lookup.ts` for byte mapping.
    *   `commands.ts` should only contain UI-relevant metadata (name, unit, min/max for validation).

### 4.2. Parser Unification Strategy
*   **Assessment**: While `state-parser.ts` (Edit Buffer) and `preset-parser.ts` (DCX File) produce the same `State` object, they use physically different addressing (Wire Byte Index vs. Preset Word Offset).
*   **Action**: We will **keep the Reader logic separate** for now.
    *   `state-parser.ts` is driven by `generated-mappings.ts` (Metadata).
    *   `preset-parser.ts` is driven by hardcoded offsets (Procedural).
    *   *Reason*: We lack a metadata source for the Preset Word Offsets. Unifying them now would require significant manual data entry.
*   **Future Goal**: Enhance `generate-8bit-mapping.ts` to include Preset Word Offsets, allowing a single unified "Meta-Parser."

### 4.3. Refactoring Execution
1.  **Preparation**: Create the new directory structure.
2.  **Move Low-Level**: Move Checksum, Encoding, and Constants. Update imports. Verify Tests.
3.  **Move Domain**: Move Types, Param Lookups. Update imports. Verify Tests.
4.  **Transport Interface**: Define `DuplexConnection` in `transport/interface.ts`.
5.  **Refactor RestoreSession**: Update `RestoreSession` to accept `DuplexConnection` instead of its current ad-hoc setup.
6.  **Command Unification**: Compare `dcx-ui` serialization with `dcx-parser` builders. Create a unified builder in `commands/generators.ts`.
7.  **Finalize**: Export clear API from `index.ts`.

## 5. UI Integration (Future Step)
Once `dcx-parser` is published/linked:
1.  Replace `use-send-command.ts` logic with `new HttpSseConnection()` + `Parser.buildCommand()`.
2.  Replace `use-device-events.ts` parsing logic with `Parser.parseMessage()`.

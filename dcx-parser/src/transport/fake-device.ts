/**
 * Fake Device Simulator.
 *
 * Simulates DCX2496 device behavior for testing.
 * Responds to commands just like the real device would.
 */

import type {State} from '../types/index.js';
import {parseMessage} from '../index.js';
import {SYSEX_START, SYSEX_END, VENDOR_ID} from '../constants/protocol.js';
import {encode8to7} from '../protocol/encoding.js';
import {calculateChecksum} from '../protocol/checksum.js';

/**
 * A fake DCX2496 device for testing.
 */
export class FakeDevice {
  private readonly deviceId: number;
  private readonly deviceName: string;
  private state: State;
  private presetPages: Map<number, Uint8Array> = new Map();

  constructor(deviceId: number, deviceName = 'TESTDEV', initialState?: State) {
    this.deviceId = deviceId;
    this.deviceName = deviceName;
    this.state = initialState ?? this.createDefaultState();
    this.initializePresetPages();
  }

  /**
   * Process a command and return response(s).
   */
  public processCommand(cmd: Uint8Array): Uint8Array[] {
    // Validate SysEx framing
    if (cmd.length < 8 || cmd[0] !== SYSEX_START || cmd[cmd.length - 1] !== SYSEX_END) {
      return [];
    }

    // Extract command byte (at index 6 after header)
    const command = cmd[6];

    switch (command) {
      case 0x40: // Search/Ping command
        return [this.buildSearchResponse()];

      case 0x50: // Dump request (edit buffer or page)
        // Bank is at byte 7, part/page at offset 9
        const bank = cmd[7];
        const partOrPage = cmd[9] ?? 0;
        if (bank === 1) {
          // Edit buffer request
          return [this.buildEditBufferPart(partOrPage)];
        } else if (bank === 0) {
          // Page dump request (presets)
          const pageData = this.presetPages.get(partOrPage);
          if (pageData) {
            return [this.buildPageDump(partOrPage, pageData)];
          }
        }
        return [];

      case 0x44: // Status request
        return [this.buildStatusResponse()];

      case 0x20: // Direct parameter change - echo back
        return [cmd];

      default:
        // Try parseMessage as fallback for other commands
        const parsed = parseMessage(cmd);
        if (!parsed) return [];

        switch (parsed.type) {
          case 'direct':
            return [cmd]; // Echo direct commands
          case 'pageRequest':
            // Handle page request during restore - acknowledge
            return [];
          default:
            return [];
        }
    }
  }

  /**
   * Get the current device state.
   */
  public getState(): State {
    return this.state;
  }

  /**
   * Set a preset page.
   */
  public setPresetPage(page: number, data: Uint8Array): void {
    this.presetPages.set(page, data);
  }

  // ============================================================================
  // Response Builders
  // ============================================================================

  private buildSearchResponse(): Uint8Array {
    // Response format: F0 00 20 32 <DevID> 0E 00 <version> <name bytes> F7
    const nameBytes = new TextEncoder().encode(this.deviceName.padEnd(8, ' ').slice(0, 8));
    return new Uint8Array([
      SYSEX_START,
      ...VENDOR_ID,
      this.deviceId,
      0x0e,
      0x00, // Search response command
      0x01, // Version
      0x11, // Sub-version
      ...nameBytes,
      SYSEX_END,
    ]);
  }

  private buildEditBufferPart(part: number): Uint8Array {
    // Build a fake edit buffer response
    // Format: F0 00 20 32 <DevID> 0E 10 <bank> ... <part at byte 12> <encoded data> checksum F7
    const fakeData = this.createFakeEditBufferData(part);
    const encoded = encode8to7(fakeData);

    // Build message without checksum first
    // Structure: [F0][VENDOR_ID 3b][DevID][0E][CMD][bank][type][len_hi][len_lo][reserved][part]...
    const header = new Uint8Array([
      SYSEX_START,
      ...VENDOR_ID,   // bytes 1-3
      this.deviceId,  // byte 4
      0x0e,           // byte 5
      0x10,           // byte 6: Data response command (RSP_DUMP)
      0x01,           // byte 7: bank = 1 (edit buffer)
      0x00,           // byte 8: type
      0x00,           // byte 9: length high
      0x0c,           // byte 10: length low
      0x00,           // byte 11: reserved
      part,           // byte 12: part number
    ]);

    // Calculate checksum over data portion (from byte 13 onwards)
    const dataForChecksum = encoded;
    const checksum = calculateChecksum(dataForChecksum);

    // Build complete message
    const msg = new Uint8Array(header.length + encoded.length + 2);
    msg.set(header, 0);
    msg.set(encoded, header.length);
    msg[msg.length - 2] = checksum;
    msg[msg.length - 1] = SYSEX_END;

    return msg;
  }

  private buildPageDump(page: number, data: Uint8Array): Uint8Array {
    const encoded = encode8to7(data);

    const header = new Uint8Array([
      SYSEX_START,
      ...VENDOR_ID,
      this.deviceId,
      0x0e,
      0x10, // Data response command
      0x00,
      0x00, // Type: page dump
      0x00,
      0x0c, // Length indicator
      0x00,
      page,
    ]);

    const checksum = calculateChecksum(encoded);

    const msg = new Uint8Array(header.length + encoded.length + 2);
    msg.set(header, 0);
    msg.set(encoded, header.length);
    msg[msg.length - 2] = checksum;
    msg[msg.length - 1] = SYSEX_END;

    return msg;
  }

  private buildStatusResponse(): Uint8Array {
    // Build a minimal status response
    return new Uint8Array([
      SYSEX_START,
      ...VENDOR_ID,
      this.deviceId,
      0x0e,
      0x04, // Status response command
      0x00, // Data byte
      SYSEX_END,
    ]);
  }

  // ============================================================================
  // Helpers
  // ============================================================================

  private createDefaultState(): State {
    // Create a minimal valid state for testing
    // Use unknown cast since we're just creating test data
    return {
      header: {},
      setup: {
        deviceName: this.deviceName,
        deviceNamePadding: new Uint8Array(0),
        outputConfig: 'lmhlmh',
        stereoLink: false,
        inputSumType: 'off',
        muteOutsOnChange: true,
        syncSource: 'internal',
        inputADelay: 0,
        inputBDelay: 0,
        inputCDelay: 0,
        inputSumDelay: 0,
      },
      inputs: {},
      outputs: {},
    } as unknown as State;
  }

  private createFakeEditBufferData(part: number): Uint8Array {
    // Create minimal fake data for testing
    const size = part === 0 ? 875 : 784;
    const data = new Uint8Array(size);

    // Add XPCR signature at offset 0 for part 0
    if (part === 0) {
      data[0] = 0x58; // X
      data[1] = 0x50; // P
      data[2] = 0x43; // C
      data[3] = 0x52; // R
    }

    return data;
  }

  private initializePresetPages(): void {
    // Initialize 12 empty preset pages
    for (let i = 0; i < 12; i++) {
      this.presetPages.set(i, new Uint8Array(875));
    }
  }
}


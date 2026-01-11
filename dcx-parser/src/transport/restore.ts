import {type ParsedMessage} from '../protocol/sysex.js';
import {
  SYSEX_START,
  SYSEX_END,
  VENDOR_ID,
  PACKET_TYPE_PAGE,
} from '../constants/protocol.js';
import {buildDataPacket} from '../commands/builders.js';
import {splitDcxFileIntoPages} from '../dcx-file.js';

// Protocol Implementation Constants
const CMD_IDENTIFY = 0x40; // Identify device
const CMD_LISTEN_MODE = 0x3f; // Enter restore/listen mode
const PACKET_TYPE_CURRENT = 0x02; // Packet type for Current State (Type 01) pages

/**
 * Protocol Phases
 */
export enum RestorePhase {
  IDLE,
  INITIALIZING, // Sending ID + Listen Mode
  MAIN_MEMORY, // Transferring Pages 0-11 (Type 00)
  CURRENT_STATE, // Transferring Pages 0-1 (Type 01)
  COMPLETED,
  ERROR,
}

/**
 * Manages the state of a DCX2496 restore session.
 *
 * Implements the Pull-Based Protocol:
 * 1. Initialize (CMD_40, CMD_3F)
 * 2. Phase 1: Send Page 0 (unsolicited), wait for requests 1-11
 * 3. Phase 2: Send Page 0 (Type 01, unsolicited), wait for request 1
 */
export class RestoreSession {
  private readonly pages: Array<{page: number; data: Uint8Array}>;
  private phase: RestorePhase = RestorePhase.IDLE;
  private readonly messageQueue: Uint8Array[] = [];
  private readonly deviceId: number;

  constructor(fileBuffer: Uint8Array, deviceId = 0x00) {
    this.deviceId = deviceId;
    this.pages = splitDcxFileIntoPages(fileBuffer);

    if (this.pages.length === 0) {
      this.transitionToError('Empty DCX file');
    }
  }

  /**
   * Start the restore process.
   * Queues the initial commands and the first page.
   */
  public start() {
    this.phase = RestorePhase.INITIALIZING;

    // 1. Identify (CMD_40)
    // F0 00 20 32 20 0E 40 F7 (Note: ID 20 used in trace)
    const identifyCmd = new Uint8Array([
      SYSEX_START,
      0x00,
      0x20,
      0x32,
      0x20,
      0x0e,
      CMD_IDENTIFY,
      SYSEX_END,
    ]);
    this.messageQueue.push(identifyCmd);

    // 2. Listen Mode (CMD_3F)
    // F0 00 20 32 00 0E 3F 04 00 F7
    const listenCmd = new Uint8Array([
      SYSEX_START,
      ...VENDOR_ID,
      this.deviceId,
      0x0e,
      CMD_LISTEN_MODE,
      0x04,
      0x00,
      SYSEX_END,
    ]);
    this.messageQueue.push(listenCmd);

    // 3. Start Phase 1: Push Page 0 (Type 00)
    // This transitions us to MAIN_MEMORY phase effectively
    this.phase = RestorePhase.MAIN_MEMORY;
    if (this.pages.length > 0) {
      this.queuePage(0, 0x00);
    }
  }

  /**
   * Get the next message to send to the device.
   * Returns undefined if no messages are pending (waiting for device request).
   */
  public getNextMessage(): Uint8Array | undefined {
    if (
      this.phase === RestorePhase.ERROR ||
      this.phase === RestorePhase.COMPLETED
    ) {
      return undefined;
    }

    return this.messageQueue.shift() ?? undefined;
  }

  /**
   * Process a message received from the device.
   * Expects 'pageRequest' messages to drive the transfer.
   */
  public processResponse(message: ParsedMessage) {
    if (
      this.phase === RestorePhase.ERROR ||
      this.phase === RestorePhase.COMPLETED
    )
      return;

    // We primarily look for Page Requests (CMD 0x50)
    if (message.type === 'pageRequest') {
      const {page, requestType} = message;

      // Handle Request Type
      const bank = requestType ?? 0x00; // Default to 0 if undefined

      if (bank === 0x00) {
        // Main Memory Request
        this.handleMainPageRequest(page);
      } else if (bank === 0x01) {
        // Current State Request
        this.handleCurrentStateRequest(page);
      }
    } else if (message.type === 'unknown') {
      // Log?
    }
  }

  public getStatus() {
    return {
      phase: RestorePhase[this.phase],
      queueLength: this.messageQueue.length,
    };
  }

  public isComplete(): boolean {
    return this.phase === RestorePhase.COMPLETED;
  }

  private handleMainPageRequest(page: number) {
    if (this.phase !== RestorePhase.MAIN_MEMORY) {
      // It's possible we are still in INITIALIZING but device is fast
      this.phase = RestorePhase.MAIN_MEMORY;
    }

    if (page >= this.pages.length) {
      console.warn(
        `Device requested Page ${page} (Type 00) which is out of range.`,
      );
      return;
    }

    this.queuePage(page, 0x00);

    // Check for transition to Phase 2
    if (page === this.pages.length - 1) {
      this.phase = RestorePhase.CURRENT_STATE;
      this.queuePage(0, 0x01); // Send Page 0 of Type 01
    }
  }

  private handleCurrentStateRequest(page: number) {
    if (this.phase !== RestorePhase.CURRENT_STATE) {
      this.phase = RestorePhase.CURRENT_STATE;
    }

    // For Type 01, we reuse the data from the main pages (0 and 1)
    // because Current State is essentially Preset 1.
    if (page >= this.pages.length) return;

    this.queuePage(page, 0x01);

    // Completion condition: After Page 1 of Type 01 is requested and sent.
    if (page >= 1) {
      this.phase = RestorePhase.COMPLETED;
    }
  }

  private queuePage(pageIndex: number, bank: number) {
    const pageData = this.pages[pageIndex].data;

    if (bank === 0x00) {
      const packet = buildDataPacket(
        PACKET_TYPE_PAGE,
        pageIndex,
        pageData,
        this.deviceId,
        0x00,
      );
      this.messageQueue.push(packet);
    } else {
      // Type 01 (Current State)
      const packet = buildDataPacket(
        PACKET_TYPE_CURRENT,
        pageIndex,
        pageData,
        this.deviceId,
        0x01,
      );
      this.messageQueue.push(packet);
    }
  }

  private transitionToError(message: string) {
    this.phase = RestorePhase.ERROR;
    console.error(`Restore Error: ${message}`);
  }
}

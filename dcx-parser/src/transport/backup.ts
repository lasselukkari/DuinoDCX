/**
 * Backup Session State Machine.
 *
 * Event-driven state machine for downloading device presets.
 * Follows the same pattern as RestoreSession:
 * 1. start() - queues page 0 request, transitions to DOWNLOADING state
 * 2. processResponse() - reacts to pageDump messages, queues next page request
 * 3. getNextMessage() - returns next message to send (non-blocking)
 */

import type {ParsedMessage} from '../protocol/sysex.js';
import {buildPageDumpRequest} from '../commands/builders.js';
import {assemblePagesIntoDcxFile} from '../dcx-file.js';

const TOTAL_PAGES = 12;

/**
 * Backup Phases
 */
export enum BackupPhase {
  IDLE,
  DOWNLOADING,
  COMPLETED,
  ERROR,
}

/**
 * Manages the state of a DCX2496 backup session.
 *
 * Implements a reactive Pull-based protocol:
 * 1. start() - send page 0 request
 * 2. On page 0 response - send page 1 request
 * 3. On page 1 response - send page 2 request
 * ... until all 12 pages received
 */
export class BackupSession {
  private phase: BackupPhase = BackupPhase.IDLE;
  private readonly messageQueue: Uint8Array[] = [];
  private readonly pages = new Map<number, Uint8Array>();
  private nextPageToRequest = 0;
  private dcxData: Uint8Array | undefined = undefined;
  private errorMessage: string | undefined = undefined;

  /**
   * Start the backup process.
   * Queues only the first page request.
   */
  public start(): void {
    if (this.phase !== BackupPhase.IDLE) {
      return; // Already started
    }

    this.phase = BackupPhase.DOWNLOADING;
    this.pages.clear();
    this.nextPageToRequest = 0;
    this.dcxData = undefined;
    this.errorMessage = undefined;

    // Queue only the first page request
    this.queuePageRequest(0);
    this.nextPageToRequest = 1;
  }

  /**
   * Reset to idle state.
   */
  public reset(): void {
    this.phase = BackupPhase.IDLE;
    this.pages.clear();
    this.nextPageToRequest = 0;
    this.dcxData = undefined;
    this.errorMessage = undefined;
    this.messageQueue.length = 0;
  }

  /**
   * Get the next message to send to the device.
   * Returns undefined if no messages are pending.
   */
  public getNextMessage(): Uint8Array | undefined {
    if (
      this.phase === BackupPhase.ERROR ||
      this.phase === BackupPhase.COMPLETED ||
      this.phase === BackupPhase.IDLE
    ) {
      return undefined;
    }

    return this.messageQueue.shift() ?? undefined;
  }

  /**
   * Process a message received from the device.
   * Reacts to pageDump messages by queuing the next page request.
   */
  public processResponse(message: ParsedMessage): void {
    if (this.phase !== BackupPhase.DOWNLOADING) {
      return;
    }

    // Handle page dump responses
    if (message.type === 'pageDump') {
      const {page, data} = message;

      // Store the page data
      this.pages.set(page, data);

      // Check if all pages received
      if (this.pages.size === TOTAL_PAGES) {
        this.assembleAndComplete();
      } else if (this.nextPageToRequest < TOTAL_PAGES) {
        // Queue the next page request
        this.queuePageRequest(this.nextPageToRequest);
        this.nextPageToRequest++;
      }
    }
  }

  /**
   * Get the current status.
   */
  public getStatus(): {
    phase: string;
    progress: number;
    queueLength: number;
  } {
    return {
      phase: BackupPhase[this.phase],
      progress: this.pages.size / TOTAL_PAGES,
      queueLength: this.messageQueue.length,
    };
  }

  /**
   * Check if backup is complete.
   */
  public isComplete(): boolean {
    return this.phase === BackupPhase.COMPLETED;
  }

  /**
   * Check if there was an error.
   */
  public isError(): boolean {
    return this.phase === BackupPhase.ERROR;
  }

  /**
   * Get the assembled DCX data (only available after completion).
   */
  public getDcxData(): Uint8Array | undefined {
    return this.dcxData;
  }

  /**
   * Get the error message (only available after error).
   */
  public getError(): string | undefined {
    return this.errorMessage;
  }

  /**
   * Get the current phase.
   */
  public getPhase(): BackupPhase {
    return this.phase;
  }

  private queuePageRequest(page: number): void {
    const request = buildPageDumpRequest(page);
    this.messageQueue.push(request);
  }

  private assembleAndComplete(): void {
    try {
      // Assemble pages into DCX file
      const pageArray: Array<{page: number; data: Uint8Array}> = [];
      for (let i = 0; i < TOTAL_PAGES; i++) {
        const pageData = this.pages.get(i);
        if (!pageData) {
          throw new Error(`Missing page ${i}`);
        }

        pageArray.push({page: i, data: pageData});
      }

      this.dcxData = assemblePagesIntoDcxFile(pageArray);
      this.phase = BackupPhase.COMPLETED;
    } catch (error) {
      this.errorMessage = String(error);
      this.phase = BackupPhase.ERROR;
    }
  }
}

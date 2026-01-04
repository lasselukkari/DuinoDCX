/**
 * BackupProcess - Downloads all memory pages from DCX2496 and creates a .dcx file
 *
 * Protocol:
 * 1. Send page dump request: F0 00 20 32 <DevID> 0E 50 00 00 <page> F7
 * 2. Receive dump response with ~1015 bytes of 7-bit encoded data
 * 3. Repeat for 16 pages (0-15)
 * 4. Decode all responses from 7-bit to 8-bit
 * 5. Stitch together and align to XSNP signature
 */

import {decode7to8} from './dcx-file.js';

// Response command for dump
const RSP_DUMP = 0x10;

// Number of pages to download
const TOTAL_PAGES = 16;

// Header size in response (skip to get payload)
const DUMP_HEADER_SIZE = 13;

// Timeout for each page request
const PAGE_TIMEOUT_MS = 3000;

export type BackupProgressCallback = (
  current: number,
  total: number,
  status: string,
) => void;

/**
 * Builds a page dump request command
 * Format: F0 00 20 32 <DevID> 0E 50 00 00 <page> F7
 */
export function buildPageDumpRequest(
  deviceId: number,
  page: number,
): Uint8Array {
  return new Uint8Array([
    0xf0, // SysEx start
    0x00,
    0x20,
    0x32, // Behringer vendor ID
    deviceId, // Device ID (usually 0x00)
    0x0e, // Model ID (DCX2496)
    0x50, // Command: Dump Request
    0x00, // Sub-command byte 1
    0x00, // Sub-command byte 2
    page, // Page number (0-15)
    0xf7, // SysEx end
  ]);
}

/**
 * Parses a page dump response message (for backup).
 * Distinguishes from edit buffer responses by checking header bytes.
 *
 * Page dump response format:
 * F0 00 20 32 <DevID> 0E 10 00 01 00 0D 00 <Page> ... <Payload> ... F7
 * Index:  0  1-3     4     5   6  7  8  9  10 11 12
 *
 * Edit buffer response format (which we must filter out):
 * F0 00 20 32 <DevID> 0E 10 <Part> ...
 * Index:  0  1-3     4     5   6  7
 */
export function parseDumpResponse(message: Uint8Array):
  | {
      page: number;
      payload: Uint8Array;
    }
  | undefined {
  // Minimum valid response length for page dump
  if (message.length < 20) {
    return undefined;
  }

  // Verify it's a dump response (command byte at index 6)
  if (message[6] !== RSP_DUMP) {
    return undefined;
  }

  // Check for page dump header signature: 00 01 00 0C 00 at bytes 7-11
  // This distinguishes page dumps from edit buffer responses
  // NOTE: 0x0C (12) is the correct value per captured traffic, not 0x0D (13)
  if (
    message[7] !== 0x00 ||
    message[8] !== 0x01 ||
    message[9] !== 0x00 ||
    message[10] !== 0x0c ||
    message[11] !== 0x00
  ) {
    // This is likely an edit buffer response (sync), not a page dump
    return undefined;
  }

  // Page/slot number is at index 12
  const page = message[12];

  // Payload is after header, before terminator
  const terminatorIndex = message.length - 1;
  if (message[terminatorIndex] !== 0xf7) {
    return undefined;
  }

  // Extract encoded payload (skip header, exclude terminator)
  const payload = message.slice(DUMP_HEADER_SIZE, terminatorIndex);

  return {page, payload};
}

/**
 * Stitches decoded page data together and creates a .dcx file
 * Finds XSNP signature and aligns data to it
 */
export function stitchPagesToFile(pages: Uint8Array[]): Uint8Array {
  // Concatenate all page data
  const totalLength = pages.reduce((sum, p) => sum + p.length, 0);
  const fullData = new Uint8Array(totalLength);

  let offset = 0;
  for (const page of pages) {
    fullData.set(page, offset);
    offset += page.length;
  }

  // Find XSNP signature to align the data
  const XSNP = [0x58, 0x53, 0x4e, 0x50]; // "XSNP"
  let xsnpOffset = -1;

  for (let i = 0; i < fullData.length - 4; i++) {
    if (
      fullData[i] === XSNP[0] &&
      fullData[i + 1] === XSNP[1] &&
      fullData[i + 2] === XSNP[2] &&
      fullData[i + 3] === XSNP[3]
    ) {
      xsnpOffset = i;
      break;
    }
  }

  if (xsnpOffset < 0) {
    console.warn('XSNP signature not found in dump, returning full data');
    return fullData;
  }

  // Return data starting from XSNP signature
  return fullData.slice(xsnpOffset);
}

export class BackupProcess {
  private active = false;
  private resolvePromise?: (data: Uint8Array) => void;
  private rejectPromise?: (reason: Error) => void;
  private nextStep: ((data: Uint8Array) => void) | undefined = undefined;
  private readonly deviceId: number;

  constructor(deviceId = 0) {
    this.deviceId = deviceId;
  }

  /**
   * Start the backup process
   * @param sendSysex Function to send SysEx data via /api/sysex
   * @param onProgress Progress callback
   * @returns Promise resolving to the .dcx file data
   */
  public async start(
    sendSysex: (data: Uint8Array) => Promise<void>,
    onProgress: BackupProgressCallback,
  ): Promise<Uint8Array> {
    if (this.active) throw new Error('Backup already in progress');
    this.active = true;

    return new Promise<Uint8Array>((resolve, reject) => {
      this.resolvePromise = resolve;
      this.rejectPromise = reject;

      void (async () => {
        try {
          await this.runBackupSequence(sendSysex, onProgress);
        } catch (error: unknown) {
          this.cleanup();
          reject(error instanceof Error ? error : new Error(String(error)));
        }
      })();
    });
  }

  /**
   * Handle incoming SysEx response from SSE
   */
  public handleIncomingSysex(data: Uint8Array): void {
    if (this.nextStep) {
      this.nextStep(data);
    }
  }

  /**
   * Cancel the backup process
   */
  public cancel(): void {
    this.cleanup();
    if (this.rejectPromise) {
      this.rejectPromise(new Error('Backup cancelled'));
    }
  }

  private cleanup(): void {
    this.active = false;
    this.nextStep = undefined;
  }

  private async runBackupSequence(
    sendSysex: (data: Uint8Array) => Promise<void>,
    onProgress: BackupProgressCallback,
  ): Promise<void> {
    const decodedPages: Uint8Array[] = [];

    onProgress(0, TOTAL_PAGES, 'Starting backup...');

    for (let page = 0; page < TOTAL_PAGES; page++) {
      onProgress(
        page,
        TOTAL_PAGES,
        `Downloading page ${page + 1}/${TOTAL_PAGES}...`,
      );

      // Send page dump request
      const request = buildPageDumpRequest(this.deviceId, page);
      // eslint-disable-next-line no-await-in-loop
      await sendSysex(request);

      // Wait for response
      // eslint-disable-next-line no-await-in-loop
      const response = await this.waitForDumpResponse(page);

      if (!response) {
        // If no response for this page, we might be at the end
        console.log(`No response for page ${page}, stopping`);
        break;
      }

      // Decode 7-bit to 8-bit
      const decoded = decode7to8(response.payload);
      decodedPages.push(decoded);

      // Small delay between pages
      // eslint-disable-next-line no-await-in-loop
      await this.delay(50);
    }

    if (decodedPages.length === 0) {
      throw new Error('No data received from device');
    }

    onProgress(TOTAL_PAGES, TOTAL_PAGES, 'Stitching data...');

    // Stitch pages together and create .dcx file
    const dcxFile = stitchPagesToFile(decodedPages);

    this.cleanup();

    if (this.resolvePromise) {
      this.resolvePromise(dcxFile);
    }
  }

  private async waitForDumpResponse(
    _expectedPage: number,
  ): Promise<ReturnType<typeof parseDumpResponse>> {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        this.nextStep = undefined;
        resolve(undefined);
      }, PAGE_TIMEOUT_MS);

      this.nextStep = (data: Uint8Array) => {
        clearTimeout(timeout);
        this.nextStep = undefined;

        const parsed = parseDumpResponse(data);

        // Accept any dump response (page might not match due to protocol quirks)
        if (parsed) {
          resolve(parsed);
        } else {
          // Not a dump response, keep waiting
          this.nextStep = (data2: Uint8Array) => {
            clearTimeout(timeout);
            this.nextStep = undefined;
            resolve(parseDumpResponse(data2));
          };
        }
      };
    });
  }

  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }
}

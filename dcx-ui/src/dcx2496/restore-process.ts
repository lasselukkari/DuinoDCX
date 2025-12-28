import {
  buildSyncCommand,
  buildHeaderPacket,
  buildPage0Packet,
  buildDataPacket,
} from './sysex-builder';
import {parseDcxFile} from './dcx-file';
// Constants
const CMD_ACK = 0x52;
const CMD_REQUEST = 0x50;
const TIMEOUT_MS = 5000;

export type ProgressCallback = (
  current: number,
  total: number,
  status: string,
) => void;

export class RestoreProcess {
  private active = false;
  private resolvePromise?: () => void;
  private rejectPromise?: (reason: any) => void;
  private readonly headerPayload: Uint8Array;
  private readonly encodedFull: Uint8Array; // Includes 7-byte size header + encoded data

  constructor(fileBuffer: ArrayBuffer) {
    const {headerPayload, encodedFull} = parseDcxFile(fileBuffer);
    this.headerPayload = headerPayload;
    this.encodedFull = encodedFull;
  }

  public async start(
    sendSysex: (data: Uint8Array) => void,
    onProgress: ProgressCallback,
  ): Promise<void> {
    if (this.active) throw new Error('Restore already in progress');
    this.active = true;

    return new Promise<void>((resolve, reject) => {
      this.resolvePromise = resolve;
      this.rejectPromise = reject;

      this.runRestoreSequence(sendSysex, onProgress).catch((error) => {
        this.cleanup();
        reject(error);
      });
    });
  }

  // Changing approach: The class manages state, but is driven by external events for simplicity in React.
  // Or better: Use an EventTarget or simple callback register.

  private nextStep: ((data: Uint8Array) => void) | undefined = null;

  public handleIncomingSysex(data: Uint8Array) {
    if (this.nextStep) {
      this.nextStep(data);
    }
  }

  private async runRestoreSequence(
    sendSysex: (data: Uint8Array) => void,
    onProgress: ProgressCallback,
  ) {
    onProgress(0, 100, 'Initializing Sync...');

    // 1. Send Sync
    const syncCmd = buildSyncCommand();
    sendSysex(syncCmd);

    // 2. Wait for ACK
    onProgress(5, 100, 'Waiting for Device ACK...');
    const ack = await this.waitForResponse(CMD_ACK);
    if (!ack) throw new Error('Timed out waiting for ACK');

    // 3. Send Header (Type 0x01)
    onProgress(10, 100, 'Sending Header...');
    const headerPkt = buildHeaderPacket(this.headerPayload);
    sendSysex(headerPkt);
    await this.delay(500); // Give device time

    // 4. Send Page 0 (Type 0x0C, Page 0)
    onProgress(15, 100, 'Sending Page 0...');
    // This takes the FIRST 1000 bytes of encodedFull
    const chunk0 = this.encodedFull.slice(0, 1000);
    // Note: Checksum window for Page 0 is special (file dependent? No, Page 0 is usually 1000)
    // Wait, parseDcxFile logic for checksum window needs to be here?
    // Let's assume standard window 1000 for Page 0 unless it's the last page.
    const page0Pkt = buildPage0Packet(chunk0); // Helper needs to handle checksum window logic?
    // Actually, we should probably implement the checksum window logic here or in builder.
    // Let's use the builder's default for now, assuming standard full pages.

    // Wait, we need checksum window logic from Python:
    // window = 1000 usually. Last page = remainder.
    // Page 0 IS a data page.

    // The builder `buildDataPacket` handles the packet wrapping.
    // We just need to slice the data correctly.

    // Page 0 logic:
    const page0Message = buildDataPacket(0x0c, 0, chunk0);
    sendSysex(page0Message);

    // 5. Loop
    const totalPages = Math.ceil(this.encodedFull.length / 1000);

    onProgress(20, 100, 'Starting Transfer Loop...');

    while (true) {
      const request = await this.waitForResponse(CMD_REQUEST, 10_000);
      if (!request) throw new Error('Timeout waiting for request');

      // Check if it's a request (0x50)
      if (request.length > 9 && request[6] === CMD_REQUEST) {
        const page = request[9];
        onProgress(
          20 + Math.floor((page / totalPages) * 80),
          100,
          `Sending Page ${page}...`,
        );

        const start = page * 1000;
        if (start >= this.encodedFull.length) {
          console.log('Requested page beyond end - transfer likely done?');
          // Device might ask for page N, we stop?
          // Usually device stops asking.
          // But if it asks, we should reply or it times out.
          // If out of bounds, maybe we are done.
          break;
        }

        const end = start + 1000;
        const chunk = this.encodedFull.slice(start, end);
        const isLast = end >= this.encodedFull.length;

        // For last page, Python logic says we send exact length, no padding?
        // sysex-builder handles padding if we don't handle it here.
        // But wait, the checksum window is critical.
        // The checksum logic in `sysex-builder.ts` assumes the passed data IS the data to checksum.
        // So if we pass 391 bytes, it checksums 391 bytes.
        // We just need to make sure we don't PAD it if it's last page.

        const responseLength = isLast ? chunk.length : 1000;

        // If chunk is < 1000 and NOT last (which shouldn't happen with math), pad.
        // If chunk is < 1000 and IS last, send as is.

        // Wait, logic check: Page 0 was sent blindly.
        // Subsequent pages are requested.
        // Protocol findings: "Full pages are padded to 1000 bytes" (logic in Python)
        // "Last page uses actual data length (no padding)"

        const pkt = buildDataPacket(0x0c, page, chunk);
        await this.delay(200); // Small pacing delay
        sendSysex(pkt);

        if (isLast) {
          onProgress(100, 100, 'Transfer Complete!');
          this.cleanup();
          this.resolvePromise?.();
          return;
        }
      }
    }
  }

  private async waitForResponse(
    cmdId: number,
    timeout = TIMEOUT_MS,
  ): Promise<Uint8Array | undefined> {
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        this.nextStep = null;
        resolve(null);
      }, timeout);

      this.nextStep = (data) => {
        if (data.length > 6 && data[6] === cmdId) {
          clearTimeout(timer);
          this.nextStep = null;
          resolve(data);
        }
      };
    });
  }

  private async delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  public cancel() {
    this.active = false;
    this.cleanup();
    this.rejectPromise?.(new Error('Cancelled'));
  }

  private cleanup() {
    this.active = false;
    this.nextStep = null;
  }
}

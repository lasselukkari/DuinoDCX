/**
 * Fake Device Simulator.
 *
 * Simulates DCX2496 device behavior for testing.
 * Responds to commands just like the real device would.
 */
import type { State } from '../types/index.js';
/**
 * A fake DCX2496 device for testing.
 */
export declare class FakeDevice {
    private readonly deviceId;
    private readonly deviceName;
    private state;
    private presetPages;
    constructor(deviceId: number, deviceName?: string, initialState?: State);
    /**
     * Process a command and return response(s).
     */
    processCommand(cmd: Uint8Array): Uint8Array[];
    /**
     * Get the current device state.
     */
    getState(): State;
    /**
     * Set a preset page.
     */
    setPresetPage(page: number, data: Uint8Array): void;
    private buildSearchResponse;
    private buildEditBufferPart;
    private buildPageDump;
    private buildStatusResponse;
    private createDefaultState;
    private createFakeEditBufferData;
    private initializePresetPages;
}
//# sourceMappingURL=fake-device.d.ts.map
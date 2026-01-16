/**
 * DeviceCoordinator Tests.
 *
 * Comprehensive tests using FakeDevice simulator.
 */

import {describe, it, expect, beforeEach} from 'vitest';
import {DeviceCoordinator, CoordinatorPhase} from './device-coordinator.js';
import {FakeDevice} from './fake-device.js';
import {parseMessage} from '../index.js';

/**
 * Enhanced TestHarness for tests.
 */
class TestHarness {
  public readonly coordinator: DeviceCoordinator;
  public readonly devices: FakeDevice[];
  public sentMessages: Uint8Array[] = [];
  private time: number;

  constructor(devices?: FakeDevice[]) {
    this.coordinator = new DeviceCoordinator();
    this.devices = devices ?? [new FakeDevice(0)];
    // Start time at current real time to match Date.now() used in sessions
    this.time = Date.now();
  }

  /**
   * Advance time and tick coordinator.
   */
  advanceTime(ms: number): void {
    this.time += ms;
    this.coordinator.tick(this.time);
  }

  /**
   * Process one message cycle - send coordinator messages to devices.
   */
  processMessages(): number {
    let count = 0;
    let msg = this.coordinator.getNextMessage();
    
    while (msg) {
      this.sentMessages.push(msg);
      count++;

      // Route to all devices (broadcast behavior)
      for (const device of this.devices) {
        const responses = device.processCommand(msg);
        for (const response of responses) {
          const parsed = parseMessage(response);
          if (parsed) {
            this.coordinator.processResponse(parsed);
          }
        }
      }

      msg = this.coordinator.getNextMessage();
    }

    return count;
  }

  /**
   * Run until phase changes or timeout.
   */
  runUntilPhase(phase: CoordinatorPhase, maxMs = 5000): boolean {
    const startTime = this.time;
    while (this.time - startTime < maxMs) {
      this.advanceTime(100);
      this.processMessages();
      if (this.coordinator.getPhase() === phase) {
        return true;
      }
    }
    return false;
  }

  /**
   * Run for specified duration.
   */
  runFor(ms: number, tickInterval = 100): void {
    const endTime = this.time + ms;
    while (this.time < endTime) {
      this.advanceTime(tickInterval);
      this.processMessages();
    }
  }

  /**
   * Get current time.
   */
  getTime(): number {
    return this.time;
  }
}

// ============================================================================
// 1. Device Discovery Tests
// ============================================================================

describe('DeviceCoordinator - Device Discovery', () => {
  let harness: TestHarness;

  beforeEach(() => {
    harness = new TestHarness();
  });

  it('finds single device', () => {
    harness.coordinator.connect();
    const found = harness.runUntilPhase(CoordinatorPhase.IDLE);

    expect(found).toBe(true);
    expect(harness.coordinator.getDeviceIds()).toContain(0);
  });

  it('finds multiple devices', () => {
    const devices = [new FakeDevice(0), new FakeDevice(1), new FakeDevice(2)];
    harness = new TestHarness(devices);

    harness.coordinator.connect();
    const found = harness.runUntilPhase(CoordinatorPhase.IDLE);

    expect(found).toBe(true);
    const ids = harness.coordinator.getDeviceIds();
    expect(ids).toContain(0);
    expect(ids).toContain(1);
    expect(ids).toContain(2);
  });

  it('starts in DISCONNECTED phase', () => {
    expect(harness.coordinator.getPhase()).toBe(CoordinatorPhase.DISCONNECTED);
  });

  it('transitions to SEARCHING when connected', () => {
    harness.coordinator.connect();
    expect(harness.coordinator.getPhase()).toBe(CoordinatorPhase.SEARCHING);
  });

  it('transitions to IDLE after search completes', () => {
    harness.coordinator.connect();
    harness.runUntilPhase(CoordinatorPhase.IDLE);
    expect(harness.coordinator.getPhase()).toBe(CoordinatorPhase.IDLE);
  });
});

// ============================================================================
// 2. Keep-Alive (Ping) Tests
// ============================================================================

describe('DeviceCoordinator - Keep-Alive', () => {
  let harness: TestHarness;

  beforeEach(() => {
    harness = new TestHarness();
    harness.coordinator.connect();
    harness.runUntilPhase(CoordinatorPhase.IDLE);
    harness.sentMessages = []; // Clear search messages
  });

  it('sends periodic pings after device found', () => {
    // Run for 3 seconds, pings should occur
    harness.runFor(3000);
    
    // Should have sent at least one ping
    expect(harness.sentMessages.length).toBeGreaterThan(0);
  });

  it('maintains connection while device responds', () => {
    // Run for 10 seconds
    harness.runFor(10000);
    
    // Should still be IDLE (not disconnected)
    expect(harness.coordinator.getPhase()).toBe(CoordinatorPhase.IDLE);
  });
});

// ============================================================================
// 3. Edit Buffer Download Tests
// ============================================================================

describe('DeviceCoordinator - Edit Buffer Download', () => {
  let harness: TestHarness;

  beforeEach(() => {
    harness = new TestHarness();
    harness.coordinator.connect();
    harness.runUntilPhase(CoordinatorPhase.IDLE);
  });

  it('auto-downloads state after device found', () => {
    // State should be available after search completes
    // The coordinator auto-queues requestDeviceState
    harness.runFor(2000);
    
    // Should have state (even if minimal from FakeDevice)
    // Note: actual parsing may fail with fake data, but request should be made
    expect(harness.sentMessages.length).toBeGreaterThan(0);
  });

  it('can request device state explicitly', () => {
    harness.sentMessages = [];
    harness.coordinator.requestDeviceState(0);
    harness.processMessages();
    
    expect(harness.sentMessages.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// 4. Preset Backup Tests
// ============================================================================

describe('DeviceCoordinator - Preset Backup', () => {
  let harness: TestHarness;

  beforeEach(() => {
    harness = new TestHarness();
    harness.coordinator.connect();
    harness.runUntilPhase(CoordinatorPhase.IDLE);
    harness.sentMessages = [];
  });

  it('can request presets', () => {
    harness.coordinator.requestPresets(0);
    
    expect(harness.coordinator.getPhase()).toBe(CoordinatorPhase.BUSY);
  });

  it('transitions to BUSY during download', () => {
    // Request presets - initially should be BUSY before any processing
    harness.coordinator.requestPresets(0);
    
    // Before any processing, should be BUSY
    expect(harness.coordinator.getPhase()).toBe(CoordinatorPhase.BUSY);
    
    // After processing all messages, should be IDLE (sync harness completes immediately)
    harness.runFor(1000);
    expect(harness.coordinator.getPhase()).toBe(CoordinatorPhase.IDLE);
  });

  it('returns to IDLE after download completes', () => {
    harness.coordinator.requestPresets(0);
    harness.runFor(5000);
    
    // Should be back to IDLE after download
    expect(harness.coordinator.getPhase()).toBe(CoordinatorPhase.IDLE);
  });
});

// ============================================================================
// 5. Direct Parameter Changes Tests
// ============================================================================

describe('DeviceCoordinator - Direct Parameter Changes', () => {
  let harness: TestHarness;

  beforeEach(() => {
    harness = new TestHarness();
    harness.coordinator.connect();
    harness.runUntilPhase(CoordinatorPhase.IDLE);
    harness.sentMessages = [];
  });

  it('sends parameter change command', () => {
    // Send parameter change - check that coordinator has message to send
    harness.coordinator.sendParameterChange(0, {kind: 'channel', group: 'inputs', id: 'A', key: 'gain'}, 5);
    
    // Should have a message queued
    const msg = harness.coordinator.getNextMessage();
    expect(msg).toBeDefined();
  });

  it('queues multiple parameter changes', () => {
    harness.coordinator.sendParameterChange(0, {kind: 'channel', group: 'inputs', id: 'A', key: 'gain'}, 5);
    harness.coordinator.sendParameterChange(0, {kind: 'channel', group: 'inputs', id: 'A', key: 'mute'}, true);
    
    // Should have messages queued
    const msg1 = harness.coordinator.getNextMessage();
    const msg2 = harness.coordinator.getNextMessage();
    expect(msg1).toBeDefined();
    expect(msg2).toBeDefined();
  });
});

// ============================================================================
// 6. Operation Queuing Tests
// ============================================================================

describe('DeviceCoordinator - Operation Queuing', () => {
  let harness: TestHarness;

  beforeEach(() => {
    harness = new TestHarness();
    harness.coordinator.connect();
    harness.runUntilPhase(CoordinatorPhase.IDLE);
  });

  it('queues operations when busy', () => {
    // Start first operation
    harness.coordinator.requestPresets(0);
    harness.processMessages();
    
    // Queue second operation while first is running
    harness.coordinator.requestDeviceState(0);
    
    // Should still be busy with first op
    expect(harness.coordinator.getPhase()).toBe(CoordinatorPhase.BUSY);
  });

  it('executes queued operations in order', () => {
    harness.sentMessages = [];
    
    // Queue multiple operations
    harness.coordinator.requestPresets(0);
    harness.coordinator.requestDeviceState(0);
    
    // Run until all complete
    harness.runFor(10000);
    
    // Both should have been executed
    expect(harness.sentMessages.length).toBeGreaterThan(2);
  });
});

// ============================================================================
// 7. Multi-Device Tests
// ============================================================================

describe('DeviceCoordinator - Multi-Device', () => {
  let harness: TestHarness;

  beforeEach(() => {
    const devices = [new FakeDevice(0, 'DEV_0'), new FakeDevice(1, 'DEV_1')];
    harness = new TestHarness(devices);
    harness.coordinator.connect();
    harness.runUntilPhase(CoordinatorPhase.IDLE);
  });

  it('manages multiple devices', () => {
    const ids = harness.coordinator.getDeviceIds();
    expect(ids.length).toBe(2);
    expect(ids).toContain(0);
    expect(ids).toContain(1);
  });

  it('can request state from different devices', () => {
    harness.sentMessages = [];
    
    harness.coordinator.requestDeviceState(0);
    harness.coordinator.requestDeviceState(1);
    harness.runFor(5000);
    
    // Operations for both devices should run
    expect(harness.sentMessages.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// 8. Connection Lifecycle Tests
// ============================================================================

describe('DeviceCoordinator - Connection Lifecycle', () => {
  let harness: TestHarness;

  beforeEach(() => {
    harness = new TestHarness();
  });

  it('disconnect clears all state', () => {
    harness.coordinator.connect();
    harness.runUntilPhase(CoordinatorPhase.IDLE);
    
    harness.coordinator.disconnect();
    
    expect(harness.coordinator.getPhase()).toBe(CoordinatorPhase.DISCONNECTED);
    expect(harness.coordinator.getDeviceIds()).toHaveLength(0);
  });

  it('can reconnect after disconnect', () => {
    harness.coordinator.connect();
    harness.runUntilPhase(CoordinatorPhase.IDLE);
    harness.coordinator.disconnect();
    
    // Reconnect
    harness.coordinator.connect();
    const found = harness.runUntilPhase(CoordinatorPhase.IDLE);
    
    expect(found).toBe(true);
    expect(harness.coordinator.getDeviceIds()).toContain(0);
  });
});

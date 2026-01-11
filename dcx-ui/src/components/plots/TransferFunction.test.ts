import {describe, it, expect} from 'vitest';
import TransferFunction from '@/components/plots/TransferFunction.ts';

describe('generateFrequencyPoints', () => {
  it('returns correct result', () => {
    const points = TransferFunction.generateFrequencyPoints(10, 20_000, 5);
    expect(points[0]).toBeCloseTo(10, 10);
    expect(points[1]).toBeCloseTo(66.874_030_497_6, 8);
    expect(points[2]).toBeCloseTo(447.213_595_5, 8);
    expect(points[3]).toBeCloseTo(2990.697_562_44, 8);
    expect(points[4]).toBeCloseTo(20_000, 8);
  });
});

describe('firstOrderFilter', () => {
  describe('lowpass', () => {
    const tf = new TransferFunction([100, 200, 400]);
    tf.lowPass1stOrder(100);
    it('creates the correct amplitude response', () => {
      const mag = tf.getMagnitude();
      // At f=f0, magnitude should be around -3dB
      expect(mag[0]).toBeCloseTo(-3.01, 1);
      expect(mag[1]).toBeLessThan(-3.01);
      expect(mag[2]).toBeLessThan(mag[1]);
    });
  });

  describe('highpass', () => {
    const tf = new TransferFunction([100, 200, 400]);
    tf.highPass1stOrder(400);
    it('creates the correct amplitude response', () => {
      const mag = tf.getMagnitude();
      expect(mag[2]).toBeCloseTo(-3.01, 1);
      expect(mag[1]).toBeLessThan(-3.01);
      expect(mag[0]).toBeLessThan(mag[1]);
    });
  });
});

describe('secondOrderFilter', () => {
  describe('lowpass', () => {
    const tf = new TransferFunction([100, 200, 400]);
    tf.lowPass2ndOrder(100, 0.5);
    it('creates the correct amplitude response', () => {
      const mag = tf.getMagnitude();
      // For Q=0.5, at f0 it's -6dB
      expect(mag[0]).toBeCloseTo(-6.02, 1);
    });
  });

  describe('highpass', () => {
    const tf = new TransferFunction([100, 200, 400]);
    tf.highPass2ndOrder(400, 0.5);
    it('creates the correct amplitude response', () => {
      const mag = tf.getMagnitude();
      expect(mag[2]).toBeCloseTo(-6.02, 1);
    });
  });
});

describe('parametricEQ', () => {
  it('creates the correct amplitude response', () => {
    const tf = new TransferFunction([100, 200, 400]);
    tf.parametricEQ(200, 10, 1);
    const mag = tf.getMagnitude();
    expect(mag[1]).toBeCloseTo(10, 1);
    expect(mag[0]).toBeCloseTo(mag[2], 1);
    expect(mag[0]).toBeLessThan(10);
  });
});

describe('shelving', () => {
  it('low shelving works', () => {
    const tf = new TransferFunction([100, 1000, 10_000]);
    tf.lowShelving(1000, 6, 0.707);
    const mag = tf.getMagnitude();
    expect(mag[0]).toBeCloseTo(6, 0.5);
    expect(mag[1]).toBeCloseTo(3, 0.5);
    expect(mag[2]).toBeCloseTo(0, 0.5);
  });

  it('high shelving works', () => {
    const tf = new TransferFunction([100, 1000, 10_000]);
    tf.highShelving(1000, 6, 0.707);
    const mag = tf.getMagnitude();
    expect(mag[0]).toBeCloseTo(0, 0.5);
    expect(mag[1]).toBeCloseTo(3, 0.5);
    expect(mag[2]).toBeCloseTo(6, 0.5);
  });
});

describe('crossovers', () => {
  it('but24 lowpass', () => {
    const tf = new TransferFunction([1000]);
    tf.applyCrossover('but24', 1000, false);
    expect(tf.getMagnitude()[0]).toBeCloseTo(-3, 0.5);
  });

  it('lr24 lowpass', () => {
    const tf = new TransferFunction([1000]);
    tf.applyCrossover('lr24', 1000, false);
    expect(tf.getMagnitude()[0]).toBeCloseTo(-6, 0.5);
  });
});

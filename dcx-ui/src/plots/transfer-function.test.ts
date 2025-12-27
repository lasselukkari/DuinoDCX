// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
/* global describe, it, expect */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import TransferFunction from './transfer-function.ts';

describe('generateFrequencyPoints', () => {
  it('returns correct result', () => {
    expect(TransferFunction.generateFrequencyPoints(10, 20_000, 5)).toEqual([
      10, 66.874_030_497_642_21, 447.213_595_499_958, 2990.697_562_442_441_3,
      20_000.000_000_000_004,
    ]);
  });
});

describe('firstOrderFilter', () => {
  describe('lowpass', () => {
    const tf = new TransferFunction([100, 200, 400]);
    tf.firstOrderFilter(100, false);
    it('creates the correct amplitude response', () => {
      expect(tf.getMagnitude()).toEqual([
        -3.010_299_956_639_811_6, -6.989_700_043_360_187_5,
        -12.304_489_213_782_74,
      ]);
    });
  });

  describe('highpass', () => {
    const tf = new TransferFunction([100, 200, 400]);
    tf.firstOrderFilter(400, true);
    it('creates the correct amplitude response', () => {
      expect(tf.getMagnitude()).toEqual([
        -12.304_489_213_782_74, -6.989_700_043_360_187_5,
        -3.010_299_956_639_811_6,
      ]);
    });
  });
});

describe('secondOrderFilter', () => {
  describe('lowpass', () => {
    const tf = new TransferFunction([100, 200, 400]);
    tf.secondOrderFilter(100, 0.5, false);
    it('creates the correct amplitude response', () => {
      expect(tf.getMagnitude()).toEqual([
        -6.020_599_913_279_624, -13.979_400_086_720_375, -24.608_978_427_565_48,
      ]);
    });
  });

  describe('highpass', () => {
    const tf = new TransferFunction([100, 200, 400]);
    tf.secondOrderFilter(400, 0.5, true);
    it('creates the correct amplitude response', () => {
      expect(tf.getMagnitude()).toEqual([
        -24.608_978_427_565_48, -13.979_400_086_720_375, -6.020_599_913_279_624,
      ]);
    });
  });
});

describe('firstOrderShelving', () => {
  describe('low shelving', () => {
    const tf = new TransferFunction([100, 200, 400]);
    tf.firstOrderShelving(100, 10, false);
    it('creates the correct amplitude response', () => {
      expect(tf.getMagnitude()).toEqual([
        7.403_626_894_942_439, 4.471_580_313_422_193, 1.845_244_265_925_440_7,
      ]);
    });
  });

  describe('high shelving', () => {
    const tf = new TransferFunction([100, 200, 400]);
    tf.firstOrderShelving(400, 10, true);
    it('creates the correct amplitude response', () => {
      expect(tf.getMagnitude()).toEqual([
        1.845_244_265_925_440_7, 4.471_580_313_422_193, 7.403_626_894_942_439,
      ]);
    });
  });
});

describe('secondOrderShelving', () => {
  describe('low shelving', () => {
    const tf = new TransferFunction([100, 200, 400]);
    tf.secondOrderShelving(100, 10, false);
    it('creates the correct amplitude response', () => {
      expect(tf.getMagnitude()).toEqual([
        7.403_626_894_942_439, 1.845_244_265_925_438_9,
        0.149_485_132_997_726_37,
      ]);
    });
  });

  describe('high shelving', () => {
    const tf = new TransferFunction([100, 200, 400]);
    tf.secondOrderShelving(400, 10, true);
    it('creates the correct amplitude response', () => {
      expect(tf.getMagnitude()).toEqual([
        0.149_485_132_997_726_37, 1.845_244_265_925_438_9,
        7.403_626_894_942_439,
      ]);
    });
  });
});

describe('parametricEQ', () => {
  const tf = new TransferFunction([100, 200, 400]);
  tf.parametricEQ(200, 10, 1);
  it('creates the correct amplitude response', () => {
    expect(tf.getMagnitude()).toEqual([
      3.240_848_689_963_755, 10, 3.240_848_689_963_755,
    ]);
  });
});

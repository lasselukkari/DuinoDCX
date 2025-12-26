import TransferFunction from './TransferFunction';

describe('generateFrequencyPoints', () => {
  it('returns correct result', () => {
    expect(TransferFunction.generateFrequencyPoints(10, 20000, 5)).toEqual([
      10,
      66.87403049764221,
      447.213595499958,
      2990.6975624424413,
      20000.000000000004
    ]);
  });
});

describe('firstOrderFilter', () => {
  describe('lowpass', () => {
    const tf = new TransferFunction([100, 200, 400]);
    tf.firstOrderFilter(100, false);
    it('creates the correct amplitude response', () => {
      expect(tf.getMagnitude()).toEqual([
        -3.0102999566398116,
        -6.9897000433601875,
        -12.30448921378274
      ]);
    });
  });

  describe('highpass', () => {
    const tf = new TransferFunction([100, 200, 400]);
    tf.firstOrderFilter(400, true);
    it('creates the correct amplitude response', () => {
      expect(tf.getMagnitude()).toEqual([
        -12.30448921378274,
        -6.9897000433601875,
        -3.0102999566398116
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
        -6.020599913279624,
        -13.979400086720375,
        -24.60897842756548
      ]);
    });
  });

  describe('highpass', () => {
    const tf = new TransferFunction([100, 200, 400]);
    tf.secondOrderFilter(400, 0.5, true);
    it('creates the correct amplitude response', () => {
      expect(tf.getMagnitude()).toEqual([
        -24.60897842756548,
        -13.979400086720375,
        -6.020599913279624
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
        7.403626894942439,
        4.471580313422193,
        1.8452442659254407
      ]);
    });
  });

  describe('high shelving', () => {
    const tf = new TransferFunction([100, 200, 400]);
    tf.firstOrderShelving(400, 10, true);
    it('creates the correct amplitude response', () => {
      expect(tf.getMagnitude()).toEqual([
        1.8452442659254407,
        4.471580313422193,
        7.403626894942439
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
        7.403626894942439,
        1.8452442659254389,
        0.14948513299772637
      ]);
    });
  });

  describe('high shelving', () => {
    const tf = new TransferFunction([100, 200, 400]);
    tf.secondOrderShelving(400, 10, true);
    it('creates the correct amplitude response', () => {
      expect(tf.getMagnitude()).toEqual([
        0.14948513299772637,
        1.8452442659254389,
        7.403626894942439
      ]);
    });
  });
});

describe('parametricEQ', () => {
  const tf = new TransferFunction([100, 200, 400]);
  tf.parametricEQ(200, 10, 1);
  it('creates the correct amplitude response', () => {
    expect(tf.getMagnitude()).toEqual([
      3.240848689963755,
      10,
      3.240848689963755
    ]);
  });
});

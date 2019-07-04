import {
  abs,
  sqrt,
  complex,
  log10,
  pow,
  pi,
  add,
  divide,
  multiply
} from 'mathjs';

class TransferFunction {
  constructor(frequencyPoints) {
    this.frequencyPoints = frequencyPoints;
    this.transferFunction = this.frequencyPoints.map(() => complex(1, 0));
  }

  static generateFrequencyPoints(startFrequency, endFrequency, count) {
    const freqData = [];
    for (let i = 0; i < count; i++) {
      const frequency =
        log10(startFrequency) +
        (i * log10(endFrequency / startFrequency)) / (count - 1);
      freqData[i] = pow(10, frequency);
    }

    return freqData;
  }

  firstOrderFilter(f0, isHighPass) {
    const w0 = 2 * pi * f0; // Angular frequency w0 for cut of frequency

    this.apply(
      this.frequencyPoints.map(frequencyPoint => {
        const w = 2 * pi * frequencyPoint; // Angular frequency w for frequency of interest
        const s = complex(0, w); // S = iw
        const giveMeName = add(divide(s, w0), 1);

        if (isHighPass) {
          return multiply(divide(1, giveMeName), divide(s, w0));
        }

        return divide(1, giveMeName);
      })
    );
  }

  secondOrderFilter(f0, Q, isHighpass) {
    const w0 = 2 * pi * f0; // Angular frequency w0 for cut of frequency

    this.apply(
      this.frequencyPoints.map(frequencyPoint => {
        const w = 2 * pi * frequencyPoint; // Angular frequency w for frequency of interest
        const s = complex(0, w); // S = iw
        const giveMeName = divide(
          pow(w0, 2),
          add(add(pow(s, 2), divide(multiply(s, w0), Q)), pow(w0, 2))
        );

        if (isHighpass) {
          return multiply(divide(pow(s, 2), pow(w0, 2)), giveMeName);
        }

        return giveMeName;
      })
    );
  }

  getMagnitude() {
    return this.transferFunction.map(point => 20 * log10(point.toPolar().r));
  }

  getAngle() {
    return this.transferFunction.map(point =>
      divide(180 * point.toPolar().phi, pi)
    );
  }

  static multiplyVectors(points1, points2) {
    return points1.map((point, index) => multiply(point, points2[index]));
  }

  getGroupDelay() {
    const angle = this.getAngle();
    const angUw = TransferFunction.unwrapPhase(angle).map(
      num => (num * 1000) / 360
    );

    const diff = [];
    for (let j = 0; j < angle.length - 1; j++) {
      diff[j] =
        (angUw[j + 1] - angUw[j]) /
        (this.frequencyPoints[j + 1] - this.frequencyPoints[j]);
    }

    diff.push(diff[diff.length - 1]); // Add last element

    return diff.map(num => -1 * num);
  }

  static unwrapPhase(angle) {
    const angleNew = [];
    let wrapcount = 0;
    angleNew[0] = angle[0];
    for (let j = 1; j < angle.length; j++) {
      if (angle[j] - angle[j - 1] > 180) {
        wrapcount++;
      }

      angleNew[j] = angle[j] - wrapcount * 360;
    }

    return angleNew;
  }

  parametricEQ(f0, g, q) {
    const w0 = 2 * pi * f0;
    const temp3 = divide(g, 40);
    const K = pow(10, temp3);
    const A = w0 / q / K;
    const B = (K * w0) / q;

    this.apply(
      this.frequencyPoints.map(frequenzy => {
        const w = 2 * pi * frequenzy; // Angular frequency w for frequency of interest
        const s = complex(0, w); // S = iw
        // H=(s.^2 + B*s + w0^2) ./ (s.^2 + A*s + w0^2);
        const temp1 = add(pow(s, 2), multiply(B, s));
        const nom = add(temp1, pow(w0, 2));

        const temp2 = add(pow(s, 2), multiply(A, s));
        const denom = add(temp2, pow(w0, 2));
        return divide(nom, denom);
      })
    );
  }

  firstOrderShelving(f0, gain, isHighShelving) {
    const w0 = 2 * pi * f0;
    this.apply(
      this.frequencyPoints.map(frequenzy => {
        const w = 2 * pi * frequenzy; // Angular frequency w for frequency of interest
        const s = complex(0, w); // S = iw
        let nom;
        if (isHighShelving) {
          nom = add(multiply(s, pow(10, abs(gain) / 20)), w0);
        } else {
          nom = add(s, multiply(w0, pow(10, abs(gain) / 20)));
        }

        const denom = add(s, w0);

        if (gain > 0) {
          return divide(nom, denom); // Boost
        }

        if (gain < 0) {
          return divide(denom, nom); // Cut
        }

        return 1;
      })
    );
  }

  secondOrderShelving(f0, gain, isHighShelving) {
    const w0 = 2 * pi * f0;
    const gainAbs = pow(10, abs(gain) / 20);
    this.apply(
      this.frequencyPoints.map(frequenzy => {
        const w = 2 * pi * frequenzy; // Angular frequency w for frequency of interest
        const s = complex(0, w); // S = iw

        let temp1;
        if (isHighShelving) {
          temp1 = multiply(gainAbs, pow(s, 2));
        } else {
          temp1 = multiply(gainAbs, pow(w0, 2));
        }

        const temp2 = multiply(sqrt(2 * gainAbs) * w0, s);
        const temp3 = add(temp1, temp2);

        let nom;
        if (isHighShelving) {
          nom = add(temp3, pow(w0, 2));
        } else {
          nom = add(temp3, pow(s, 2));
        }

        const temp4 = pow(s, 2);
        const temp5 = multiply(sqrt(2) * w0, s);
        const temp6 = add(temp4, temp5);
        const denom = add(temp6, pow(w0, 2));
        if (gain > 0) {
          return divide(nom, denom); // Boost
        }

        if (gain < 0) {
          return divide(denom, nom); // Cut
        }

        return 1;
      })
    );
  }

  apply(transferFunction) {
    this.transferFunction = TransferFunction.multiplyVectors(
      this.transferFunction,
      transferFunction
    );
  }

  applyCrosover(type, f0, isHighpass) {
    switch (type) {
      case 'but6': {
        this.firstOrderFilter(f0, isHighpass);
        break;
      }

      case 'but12': {
        this.secondOrderFilter(f0, 0.707107, isHighpass);
        break;
      }

      case 'but18': {
        this.firstOrderFilter(f0, isHighpass);
        this.secondOrderFilter(f0, 1, isHighpass);
        break;
      }

      case 'but24': {
        this.secondOrderFilter(f0, 0.5412, isHighpass);
        this.secondOrderFilter(f0, 1.3065, isHighpass);
        break;
      }

      case 'but48': {
        this.secondOrderFilter(f0, 0.5089, isHighpass);
        this.secondOrderFilter(f0, 0.6013, isHighpass);
        this.secondOrderFilter(f0, 0.9, isHighpass);
        this.secondOrderFilter(f0, 2.5628, isHighpass);
        break;
      }

      case 'bes12': {
        const fk1 = isHighpass ? 1 / 1.254 : 1.254;
        this.secondOrderFilter(fk1 * f0, 0.577, isHighpass);
        break;
      }

      case 'bes24': {
        const fk1 = isHighpass ? 1 / 1.4192 : 1.4192;
        const fk2 = isHighpass ? 1 / 1.5912 : 1.5912;
        this.secondOrderFilter(fk1 * f0, 0.5219, isHighpass);
        this.secondOrderFilter(fk2 * f0, 0.8055, isHighpass);
        break;
      }

      case 'lr12': {
        this.secondOrderFilter(f0, 0.5, isHighpass);
        break;
      }

      case 'lr24': {
        this.secondOrderFilter(f0, 0.707107, isHighpass);
        this.secondOrderFilter(f0, 0.707107, isHighpass);
        break;
      }

      case 'lr48': {
        this.secondOrderFilter(f0, 0.54, isHighpass);
        this.secondOrderFilter(f0, 1.34, isHighpass);
        this.secondOrderFilter(f0, 0.54, isHighpass);
        this.secondOrderFilter(f0, 1.34, isHighpass);
        break;
      }

      default: {
        this.apply(this.frequencyPoints.map(() => 1));
      }
    }
  }
}

export default TransferFunction;

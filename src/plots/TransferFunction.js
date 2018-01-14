import math from 'mathjs';

class TransferFunction {
  constructor(frequencyPoints) {
    this.frequencyPoints = frequencyPoints;
    this.transferFunction = this.frequencyPoints.map(() => math.complex(1, 0));
  }

  static generateFrequencyPoints(startFrequency, endFrequency, count) {
    const freqData = [];
    for (let i = 0; i < count; i++) {
      const frequency =
        math.log10(startFrequency) +
        (i * math.log10(endFrequency / startFrequency) / (count - 1));
      freqData[i] = math.pow(10, frequency);
    }

    return freqData;
  }

  firstOrderFilter(f0, isHighPass) {
    const w0 = 2 * math.pi * f0; // Angular frequency w0 for cut of frequency

    this.apply(
      this.frequencyPoints.map(frequencyPoint => {
        const w = 2 * math.pi * frequencyPoint; // Angular frequency w for frequency of interest
        const s = math.complex(0, w); // S = iw
        const giveMeName = math.add(math.divide(s, w0), 1);

        if (isHighPass) {
          return math.multiply(math.divide(1, giveMeName), math.divide(s, w0));
        }
        return math.divide(1, giveMeName);
      })
    );
  }

  secondOrderFilter(f0, Q, isHighpass) {
    const w0 = 2 * math.pi * f0; // Angular frequency w0 for cut of frequency

    this.apply(
      this.frequencyPoints.map(frequencyPoint => {
        const w = 2 * math.pi * frequencyPoint; // Angular frequency w for frequency of interest
        const s = math.complex(0, w); // S = iw
        const giveMeName = math.divide(
          math.pow(w0, 2),
          math.add(
            math.add(math.pow(s, 2), math.divide(math.multiply(s, w0), Q)),
            math.pow(w0, 2)
          )
        );

        if (isHighpass) {
          return math.multiply(
            math.divide(math.pow(s, 2), math.pow(w0, 2)),
            giveMeName
          );
        }
        return giveMeName;
      })
    );
  }

  getMagnitude() {
    return this.transferFunction.map(
      point => 20 * math.log10(point.toPolar().r)
    );
  }

  getAngle() {
    return this.transferFunction.map(point =>
      math.divide(180 * point.toPolar().phi, math.pi)
    );
  }

  static multiplyVectors(points1, points2) {
    return points1.map((point, index) => math.multiply(point, points2[index]));
  }

  getGroupDelay() {
    const angle = this.getAngle();
    const angUw = TransferFunction.unwrapPhase(angle).map(
      num => num * 1000 / 360
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
      angleNew[j] = angle[j] - (wrapcount * 360);
    }
    return angleNew;
  }

  parametricEQ(f0, g, q) {
    const w0 = 2 * math.pi * f0;
    const temp3 = math.divide(g, 40);
    const K = math.pow(10, temp3);
    const A = w0 / q / K;
    const B = K * w0 / q;

    this.apply(
      this.frequencyPoints.map(frequenzy => {
        const w = 2 * math.pi * frequenzy; // Angular frequency w for frequency of interest
        const s = math.complex(0, w); // S = iw
        // H=(s.^2 + B*s + w0^2) ./ (s.^2 + A*s + w0^2);
        const temp1 = math.add(math.pow(s, 2), math.multiply(B, s));
        const nom = math.add(temp1, math.pow(w0, 2));

        const temp2 = math.add(math.pow(s, 2), math.multiply(A, s));
        const denom = math.add(temp2, math.pow(w0, 2));
        return math.divide(nom, denom);
      })
    );
  }

  firstOrderShelving(f0, gain, isHighShelving) {
    const w0 = 2 * math.pi * f0;
    this.apply(
      this.frequencyPoints.map(frequenzy => {
        const w = 2 * math.pi * frequenzy; // Angular frequency w for frequency of interest
        const s = math.complex(0, w); // S = iw
        let nom;
        if (isHighShelving) {
          nom = math.add(
            math.multiply(s, math.pow(10, math.abs(gain) / 20)),
            w0
          );
        } else {
          nom = math.add(
            s,
            math.multiply(w0, math.pow(10, math.abs(gain) / 20))
          );
        }

        const denom = math.add(s, w0);

        if (gain > 0) {
          return math.divide(nom, denom); // Boost
        } else if (gain < 0) {
          return math.divide(denom, nom); // Cut
        }
        return 1;
      })
    );
  }

  secondOrderShelving(f0, gain, isHighShelving) {
    const w0 = 2 * math.pi * f0;
    const gainAbs = math.pow(10, math.abs(gain) / 20);
    this.apply(
      this.frequencyPoints.map(frequenzy => {
        const w = 2 * math.pi * frequenzy; // Angular frequency w for frequency of interest
        const s = math.complex(0, w); // S = iw

        let temp1;
        if (isHighShelving) {
          temp1 = math.multiply(gainAbs, math.pow(s, 2));
        } else {
          temp1 = math.multiply(gainAbs, math.pow(w0, 2));
        }

        const temp2 = math.multiply(math.sqrt(2 * gainAbs) * w0, s);
        const temp3 = math.add(temp1, temp2);

        let nom;
        if (isHighShelving) {
          nom = math.add(temp3, math.pow(w0, 2));
        } else {
          nom = math.add(temp3, math.pow(s, 2));
        }

        const temp4 = math.pow(s, 2);
        const temp5 = math.multiply(math.sqrt(2) * w0, s);
        const temp6 = math.add(temp4, temp5);
        const denom = math.add(temp6, math.pow(w0, 2));
        if (gain > 0) {
          return math.divide(nom, denom); // Boost
        } else if (gain < 0) {
          return math.divide(denom, nom); // Cut
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
        this.secondOrderFilter(1.2754 * f0, 0.577, isHighpass);
        break;
      }

      case 'bes24': {
        this.secondOrderFilter(1.4192 * f0, 0.5219, isHighpass);
        this.secondOrderFilter(1.5912 * f0, 0.8055, isHighpass);
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

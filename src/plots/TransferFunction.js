import mathjs from 'mathjs';

class TransferFunction {
  constructor(frequencyPoints) {
    this.frequencyPoints = frequencyPoints;
    this.transferFunction = this.frequencyPoints.map(() =>
      mathjs.complex(1, 0)
    );
  }

  static generateFrequencyPoints(startFrequency, endFrequency, count) {
    const freqData = [];
    for (let i = 0; i < count; i++) {
      const frequency =
        mathjs.log10(startFrequency) +
        (i * mathjs.log10(endFrequency / startFrequency)) / (count - 1);
      freqData[i] = mathjs.pow(10, frequency);
    }

    return freqData;
  }

  firstOrderFilter(f0, isHighPass) {
    const w0 = 2 * mathjs.pi * f0; // Angular frequency w0 for cut of frequency

    this.apply(
      this.frequencyPoints.map(frequencyPoint => {
        const w = 2 * mathjs.pi * frequencyPoint; // Angular frequency w for frequency of interest
        const s = mathjs.complex(0, w); // S = iw
        const giveMeName = mathjs.add(mathjs.divide(s, w0), 1);

        if (isHighPass) {
          return mathjs.multiply(
            mathjs.divide(1, giveMeName),
            mathjs.divide(s, w0)
          );
        }
        return mathjs.divide(1, giveMeName);
      })
    );
  }

  secondOrderFilter(f0, Q, isHighpass) {
    const w0 = 2 * mathjs.pi * f0; // Angular frequency w0 for cut of frequency

    this.apply(
      this.frequencyPoints.map(frequencyPoint => {
        const w = 2 * mathjs.pi * frequencyPoint; // Angular frequency w for frequency of interest
        const s = mathjs.complex(0, w); // S = iw
        const giveMeName = mathjs.divide(
          mathjs.pow(w0, 2),
          mathjs.add(
            mathjs.add(
              mathjs.pow(s, 2),
              mathjs.divide(mathjs.multiply(s, w0), Q)
            ),
            mathjs.pow(w0, 2)
          )
        );

        if (isHighpass) {
          return mathjs.multiply(
            mathjs.divide(mathjs.pow(s, 2), mathjs.pow(w0, 2)),
            giveMeName
          );
        }
        return giveMeName;
      })
    );
  }

  getMagnitude() {
    return this.transferFunction.map(
      point => 20 * mathjs.log10(point.toPolar().r)
    );
  }

  getAngle() {
    return this.transferFunction.map(point =>
      mathjs.divide(180 * point.toPolar().phi, mathjs.pi)
    );
  }

  static multiplyVectors(points1, points2) {
    return points1.map((point, index) =>
      mathjs.multiply(point, points2[index])
    );
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
    const w0 = 2 * mathjs.pi * f0;
    const temp3 = mathjs.divide(g, 40);
    const K = mathjs.pow(10, temp3);
    const A = w0 / q / K;
    const B = (K * w0) / q;

    this.apply(
      this.frequencyPoints.map(frequenzy => {
        const w = 2 * mathjs.pi * frequenzy; // Angular frequency w for frequency of interest
        const s = mathjs.complex(0, w); // S = iw
        // H=(s.^2 + B*s + w0^2) ./ (s.^2 + A*s + w0^2);
        const temp1 = mathjs.add(mathjs.pow(s, 2), mathjs.multiply(B, s));
        const nom = mathjs.add(temp1, mathjs.pow(w0, 2));

        const temp2 = mathjs.add(mathjs.pow(s, 2), mathjs.multiply(A, s));
        const denom = mathjs.add(temp2, mathjs.pow(w0, 2));
        return mathjs.divide(nom, denom);
      })
    );
  }

  firstOrderShelving(f0, gain, isHighShelving) {
    const w0 = 2 * mathjs.pi * f0;
    this.apply(
      this.frequencyPoints.map(frequenzy => {
        const w = 2 * mathjs.pi * frequenzy; // Angular frequency w for frequency of interest
        const s = mathjs.complex(0, w); // S = iw
        let nom;
        if (isHighShelving) {
          nom = mathjs.add(
            mathjs.multiply(s, mathjs.pow(10, mathjs.abs(gain) / 20)),
            w0
          );
        } else {
          nom = mathjs.add(
            s,
            mathjs.multiply(w0, mathjs.pow(10, mathjs.abs(gain) / 20))
          );
        }

        const denom = mathjs.add(s, w0);

        if (gain > 0) {
          return mathjs.divide(nom, denom); // Boost
        }
        if (gain < 0) {
          return mathjs.divide(denom, nom); // Cut
        }
        return 1;
      })
    );
  }

  secondOrderShelving(f0, gain, isHighShelving) {
    const w0 = 2 * mathjs.pi * f0;
    const gainAbs = mathjs.pow(10, mathjs.abs(gain) / 20);
    this.apply(
      this.frequencyPoints.map(frequenzy => {
        const w = 2 * mathjs.pi * frequenzy; // Angular frequency w for frequency of interest
        const s = mathjs.complex(0, w); // S = iw

        let temp1;
        if (isHighShelving) {
          temp1 = mathjs.multiply(gainAbs, mathjs.pow(s, 2));
        } else {
          temp1 = mathjs.multiply(gainAbs, mathjs.pow(w0, 2));
        }

        const temp2 = mathjs.multiply(mathjs.sqrt(2 * gainAbs) * w0, s);
        const temp3 = mathjs.add(temp1, temp2);

        let nom;
        if (isHighShelving) {
          nom = mathjs.add(temp3, mathjs.pow(w0, 2));
        } else {
          nom = mathjs.add(temp3, mathjs.pow(s, 2));
        }

        const temp4 = mathjs.pow(s, 2);
        const temp5 = mathjs.multiply(mathjs.sqrt(2) * w0, s);
        const temp6 = mathjs.add(temp4, temp5);
        const denom = mathjs.add(temp6, mathjs.pow(w0, 2));
        if (gain > 0) {
          return mathjs.divide(nom, denom); // Boost
        }
        if (gain < 0) {
          return mathjs.divide(denom, nom); // Cut
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

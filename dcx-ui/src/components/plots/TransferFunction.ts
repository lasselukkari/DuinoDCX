/**
 * Transfer Function Implementation for Digital Audio Filters
 *
 * This implementation is based on standard z-domain Biquad filter theory.
 *
 * Mathematical Foundation:
 * The filters are derived using the Bilinear Transform, which maps analog s-domain
 * filter prototypes into the digital z-domain. The coefficients are calculated
 * using the industry-standard formulas found in the "Audio EQ Cookbook" by
 * Robert Bristow-Johnson (RBJ).
 *
 * Historical Context:
 * In the early days of digital audio (1990s), consistent filter behavior across
 * different digital audio workstations (DAWs) was a challenge. Robert Bristow-Johnson
 * published his "Cookbook" on the music-dsp mailing list to provide a unified set
 * of formulas for Parametric EQ, Shelving, and Pass filters. These formulas
 * ensure that the digital filters closely mimic their classic analog counterparts
 * while remaining computationally efficient as "Direct Form I/II" Biquads.
 *
 * Accuracy:
 * Unlike s-domain approximations, this implementation evaluates the frequency
 * response directly on the unit circle in the z-domain (H(z) = (b0 + b1z⁻¹ + b2z⁻²) / (1 + a1z⁻¹ + a2z⁻²)).
 * This provides precise magnitude, phase, and group delay information up to
 * the Nyquist frequency (fs/2), which is essential for accurate visualization
 * of the DCX2496's internal 96kHz processing.
 */

import {
  complex,
  log10,
  pow,
  pi,
  add,
  divide,
  multiply,
  exp,
  abs,
  type Complex,
} from '@/components/plots/mathUtils.ts';

export type BiquadCoefficients = {
  // Feed-forward coefficients (numerator)
  feedForward0: number;
  feedForward1: number;
  feedForward2: number;
  // Feed-back coefficients (denominator)
  feedback0: number;
  feedback1: number;
  feedback2: number;
};

class TransferFunction {
  static generateFrequencyPoints(
    startFrequency: number,
    endFrequency: number,
    count: number,
  ): number[] {
    const freqData: number[] = [];
    const logStart = log10(startFrequency);
    const logEnd = log10(endFrequency);
    const step = (logEnd - logStart) / (count - 1);

    for (let i = 0; i < count; i++) {
      freqData[i] = pow(10, logStart + i * step);
    }

    return freqData;
  }

  static unwrapPhase(angle: number[]): number[] {
    if (angle.length === 0) return [];
    const unwrapped: number[] = [angle[0]];
    let offset = 0;
    for (let i = 1; i < angle.length; i++) {
      const diff = angle[i] - angle[i - 1];
      if (diff > 180) {
        offset -= 360;
      } else if (diff < -180) {
        offset += 360;
      }

      unwrapped[i] = angle[i] + offset;
    }

    return unwrapped;
  }

  private transferFunction: Complex[];

  constructor(
    public readonly frequencyPoints: number[],
    private readonly sampleRate = 96_000,
  ) {
    this.transferFunction = this.frequencyPoints.map(() => complex(1, 0));
  }

  applyBiquad(coeffs: BiquadCoefficients): void {
    const {
      feedForward0,
      feedForward1,
      feedForward2,
      feedback0,
      feedback1,
      feedback2,
    } = coeffs;

    this.transferFunction = this.transferFunction.map((currentTf, index) => {
      const frequency = this.frequencyPoints[index];
      const normalizedAngularFrequency = (2 * pi * frequency) / this.sampleRate;

      // H(z) = (b0 + b1*z^-1 + b2*z^-2) / (a0 + a1*z^-1 + a2*z^-2)
      // z^-1 = e^(-j*w) = cos(w) - j*sin(w)
      // z^-2 = e^(-j*2w) = cos(2w) - j*sin(2w)

      const zInverse1 = exp(complex(0, -normalizedAngularFrequency));
      const zInverse2 = exp(complex(0, -2 * normalizedAngularFrequency));

      const numerator = add(
        add(feedForward0, multiply(feedForward1, zInverse1)),
        multiply(feedForward2, zInverse2),
      );
      const denominator = add(
        add(feedback0, multiply(feedback1, zInverse1)),
        multiply(feedback2, zInverse2),
      );

      const responseAtFrequency = divide(numerator, denominator);
      return multiply(currentTf, responseAtFrequency);
    });
  }

  parametricEQ(
    centerFrequency: number,
    gainDb: number,
    qualityFactor: number,
  ): void {
    const omega = (2 * pi * centerFrequency) / this.sampleRate;
    const sinOmega = Math.sin(omega);
    const cosOmega = Math.cos(omega);
    const alpha = sinOmega / (2 * qualityFactor);
    const gainAmplitude = 10 ** (gainDb / 40);

    const b0 = 1 + alpha * gainAmplitude;
    const b1 = -2 * cosOmega;
    const b2 = 1 - alpha * gainAmplitude;
    const a0 = 1 + alpha / gainAmplitude;
    const a1 = -2 * cosOmega;
    const a2 = 1 - alpha / gainAmplitude;

    this.applyBiquad({
      feedForward0: b0,
      feedForward1: b1,
      feedForward2: b2,
      feedback0: a0,
      feedback1: a1,
      feedback2: a2,
    });
  }

  lowShelving1stOrder(cornerFrequency: number, gainDb: number): void {
    const omega = 2 * pi * cornerFrequency;
    const timeStep = 1 / this.sampleRate;
    const gainAmplitude = 10 ** (gainDb / 20);
    const K = (omega * timeStep) / 2;

    const b0 = (gainAmplitude * K + 1) / (K + 1);
    const b1 = (gainAmplitude * K - 1) / (K + 1);
    const b2 = 0;
    const a0 = 1;
    const a1 = (K - 1) / (K + 1);
    const a2 = 0;

    this.applyBiquad({
      feedForward0: b0,
      feedForward1: b1,
      feedForward2: b2,
      feedback0: a0,
      feedback1: a1,
      feedback2: a2,
    });
  }

  highShelving1stOrder(cornerFrequency: number, gainDb: number): void {
    const omega = 2 * pi * cornerFrequency;
    const timeStep = 1 / this.sampleRate;
    const gainAmplitude = 10 ** (gainDb / 20);
    const K = (omega * timeStep) / 2;

    const b0 = (gainAmplitude + K) / (K + 1);
    const b1 = (gainAmplitude - K) / (K + 1);
    const b2 = 0;
    const a0 = 1;
    const a1 = (K - 1) / (K + 1);
    const a2 = 0;

    this.applyBiquad({
      feedForward0: b0,
      feedForward1: b1,
      feedForward2: b2,
      feedback0: a0,
      feedback1: a1,
      feedback2: a2,
    });
  }

  lowShelving(
    cornerFrequency: number,
    gainDb: number,
    qualityFactor: number = 1 / Math.sqrt(2),
  ): void {
    const omega = (2 * pi * cornerFrequency) / this.sampleRate;
    const gainAmplitude = 10 ** (gainDb / 40);
    const alpha = Math.sin(omega) / (2 * qualityFactor);
    const cosOmega = Math.cos(omega);
    const beta = 2 * Math.sqrt(gainAmplitude) * alpha;

    const b0 =
      gainAmplitude *
      (gainAmplitude + 1 - (gainAmplitude - 1) * cosOmega + beta);
    const b1 =
      2 * gainAmplitude * (gainAmplitude - 1 - (gainAmplitude + 1) * cosOmega);
    const b2 =
      gainAmplitude *
      (gainAmplitude + 1 - (gainAmplitude - 1) * cosOmega - beta);
    const a0 = gainAmplitude + 1 + (gainAmplitude - 1) * cosOmega + beta;
    const a1 = -2 * (gainAmplitude - 1 + (gainAmplitude + 1) * cosOmega);
    const a2 = gainAmplitude + 1 + (gainAmplitude - 1) * cosOmega - beta;

    this.applyBiquad({
      feedForward0: b0,
      feedForward1: b1,
      feedForward2: b2,
      feedback0: a0,
      feedback1: a1,
      feedback2: a2,
    });
  }

  highShelving(
    cornerFrequency: number,
    gainDb: number,
    qualityFactor: number = 1 / Math.sqrt(2),
  ): void {
    const omega = (2 * pi * cornerFrequency) / this.sampleRate;
    const gainAmplitude = 10 ** (gainDb / 40);
    const alpha = Math.sin(omega) / (2 * qualityFactor);
    const cosOmega = Math.cos(omega);
    const beta = 2 * Math.sqrt(gainAmplitude) * alpha;

    const b0 =
      gainAmplitude *
      (gainAmplitude + 1 + (gainAmplitude - 1) * cosOmega + beta);
    const b1 =
      -2 * gainAmplitude * (gainAmplitude - 1 + (gainAmplitude + 1) * cosOmega);
    const b2 =
      gainAmplitude *
      (gainAmplitude + 1 + (gainAmplitude - 1) * cosOmega - beta);
    const a0 = gainAmplitude + 1 - (gainAmplitude - 1) * cosOmega + beta;
    const a1 = 2 * (gainAmplitude - 1 - (gainAmplitude + 1) * cosOmega);
    const a2 = gainAmplitude + 1 - (gainAmplitude - 1) * cosOmega - beta;

    this.applyBiquad({
      feedForward0: b0,
      feedForward1: b1,
      feedForward2: b2,
      feedback0: a0,
      feedback1: a1,
      feedback2: a2,
    });
  }

  lowPass2ndOrder(cutoffFrequency: number, qualityFactor: number): void {
    const omega = (2 * pi * cutoffFrequency) / this.sampleRate;
    const alpha = Math.sin(omega) / (2 * qualityFactor);
    const cosOmega = Math.cos(omega);

    const b0 = (1 - cosOmega) / 2;
    const b1 = 1 - cosOmega;
    const b2 = (1 - cosOmega) / 2;
    const a0 = 1 + alpha;
    const a1 = -2 * cosOmega;
    const a2 = 1 - alpha;

    this.applyBiquad({
      feedForward0: b0,
      feedForward1: b1,
      feedForward2: b2,
      feedback0: a0,
      feedback1: a1,
      feedback2: a2,
    });
  }

  highPass2ndOrder(cutoffFrequency: number, qualityFactor: number): void {
    const omega = (2 * pi * cutoffFrequency) / this.sampleRate;
    const alpha = Math.sin(omega) / (2 * qualityFactor);
    const cosOmega = Math.cos(omega);

    const b0 = (1 + cosOmega) / 2;
    const b1 = -(1 + cosOmega);
    const b2 = (1 + cosOmega) / 2;
    const a0 = 1 + alpha;
    const a1 = -2 * cosOmega;
    const a2 = 1 - alpha;

    this.applyBiquad({
      feedForward0: b0,
      feedForward1: b1,
      feedForward2: b2,
      feedback0: a0,
      feedback1: a1,
      feedback2: a2,
    });
  }

  lowPass1stOrder(cutoffFrequency: number): void {
    // Bilinear transform of H(s) = 1 / (s/w0 + 1)
    // s = (2/T) * (1 - z^-1) / (1 + z^-1)
    const omega = 2 * pi * cutoffFrequency;
    const timeStep = 1 / this.sampleRate;
    const bilinearK = (omega * timeStep) / 2;

    const b0 = bilinearK / (bilinearK + 1);
    const b1 = bilinearK / (bilinearK + 1);
    const b2 = 0;
    const a0 = 1;
    const a1 = (bilinearK - 1) / (bilinearK + 1);
    const a2 = 0;

    this.applyBiquad({
      feedForward0: b0,
      feedForward1: b1,
      feedForward2: b2,
      feedback0: a0,
      feedback1: a1,
      feedback2: a2,
    });
  }

  highPass1stOrder(cutoffFrequency: number): void {
    // Bilinear transform of H(s) = (s/w0) / (s/w0 + 1)
    const omega = 2 * pi * cutoffFrequency;
    const timeStep = 1 / this.sampleRate;
    const bilinearK = (omega * timeStep) / 2;

    const b0 = 1 / (bilinearK + 1);
    const b1 = -1 / (bilinearK + 1);
    const b2 = 0;
    const a0 = 1;
    const a1 = (bilinearK - 1) / (bilinearK + 1);
    const a2 = 0;

    this.applyBiquad({
      feedForward0: b0,
      feedForward1: b1,
      feedForward2: b2,
      feedback0: a0,
      feedback1: a1,
      feedback2: a2,
    });
  }

  applyCrossover(
    type: string,
    crossoverFrequency: number,
    isHighpass: boolean,
  ): void {
    const apply2nd = isHighpass
      ? (f: number, q: number) => {
          this.highPass2ndOrder(f, q);
        }
      : (f: number, q: number) => {
          this.lowPass2ndOrder(f, q);
        };

    const apply1st = isHighpass
      ? (f: number) => {
          this.highPass1stOrder(f);
        }
      : (f: number) => {
          this.lowPass1stOrder(f);
        };

    switch (type.toLowerCase()) {
      case 'but6': {
        apply1st(crossoverFrequency);
        break;
      }

      case 'but12': {
        apply2nd(crossoverFrequency, 0.707_107);
        break;
      }

      case 'but18': {
        apply1st(crossoverFrequency);
        apply2nd(crossoverFrequency, 1);
        break;
      }

      case 'but24': {
        apply2nd(crossoverFrequency, 0.5412);
        apply2nd(crossoverFrequency, 1.3065);
        break;
      }

      case 'but48': {
        apply2nd(crossoverFrequency, 0.5098);
        apply2nd(crossoverFrequency, 0.6013);
        apply2nd(crossoverFrequency, 0.9);
        apply2nd(crossoverFrequency, 2.5628);
        break;
      }

      case 'bes12': {
        const freqCorrection = isHighpass ? 1 / 1.254 : 1.254;
        apply2nd(crossoverFrequency * freqCorrection, 0.577);
        break;
      }

      case 'bes24': {
        const freqCorrection1 = isHighpass ? 1 / 1.4192 : 1.4192;
        const freqCorrection2 = isHighpass ? 1 / 1.5912 : 1.5912;
        apply2nd(crossoverFrequency * freqCorrection1, 0.5219);
        apply2nd(crossoverFrequency * freqCorrection2, 0.8055);
        break;
      }

      case 'lr12': {
        apply2nd(crossoverFrequency, 0.5);
        break;
      }

      case 'lr24': {
        apply2nd(crossoverFrequency, 0.707_107);
        apply2nd(crossoverFrequency, 0.707_107);
        break;
      }

      case 'lr48': {
        apply2nd(crossoverFrequency, 0.5412);
        apply2nd(crossoverFrequency, 1.3065);
        apply2nd(crossoverFrequency, 0.5412);
        apply2nd(crossoverFrequency, 1.3065);
        break;
      }

      default: {
        break;
      }
    }
  }

  getMagnitude(): number[] {
    return this.transferFunction.map((point) => 20 * log10(abs(point)));
  }

  getAngle(): number[] {
    return this.transferFunction.map(
      (point) => (point.toPolar().phi * 180) / pi,
    );
  }

  getGroupDelay(): number[] {
    const angle = this.getAngle();
    const unwrapped = TransferFunction.unwrapPhase(angle);

    // Group delay = -d(phase)/dw
    // phase is in degrees, convert to radians
    // w = 2*pi*f
    // delay = - (1/2pi) * d(phase_rad)/df = - (1/360) * d(phase_deg)/df

    const gd: number[] = [];
    for (let i = 0; i < this.frequencyPoints.length - 1; i++) {
      const df = this.frequencyPoints[i + 1] - this.frequencyPoints[i];
      const dphi = unwrapped[i + 1] - unwrapped[i];
      gd[i] = (-(dphi / df) / 360) * 1000; // In ms
    }

    gd.push(gd.at(-1) ?? 0);
    return gd;
  }
}

export default TransferFunction;

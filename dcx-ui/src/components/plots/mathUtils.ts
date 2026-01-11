/**
 * Minimal complex number math utilities for transfer function calculations.
 * Replaces the mathjs dependency with lightweight implementations.
 */

export type Complex = {
  re: number;
  im: number;
  toPolar(): {r: number; phi: number};
};

function createComplex(re: number, im: number): Complex {
  return {
    re,
    im,
    toPolar() {
      return {
        r: Math.hypot(re, im),
        phi: Math.atan2(im, re),
      };
    },
  };
}

export function complex(re: number, im: number): Complex {
  return createComplex(re, im);
}

export const pi: number = Math.PI;

export function log10(x: number): number {
  return Math.log10(x);
}

export function pow(base: number, exponent: number): number {
  return base ** exponent;
}

export function abs(z: Complex): number {
  return Math.hypot(z.re, z.im);
}

export function exp(z: Complex): Complex {
  // E^(a + bi) = e^a * (cos(b) + i*sin(b))
  const expReal = Math.exp(z.re);
  return createComplex(expReal * Math.cos(z.im), expReal * Math.sin(z.im));
}

export function add(a: Complex | number, b: Complex | number): Complex {
  const aComplex = typeof a === 'number' ? createComplex(a, 0) : a;
  const bComplex = typeof b === 'number' ? createComplex(b, 0) : b;
  return createComplex(aComplex.re + bComplex.re, aComplex.im + bComplex.im);
}

export function multiply(a: Complex | number, b: Complex | number): Complex {
  const aComplex = typeof a === 'number' ? createComplex(a, 0) : a;
  const bComplex = typeof b === 'number' ? createComplex(b, 0) : b;
  // (a + bi)(c + di) = (ac - bd) + (ad + bc)i
  return createComplex(
    aComplex.re * bComplex.re - aComplex.im * bComplex.im,
    aComplex.re * bComplex.im + aComplex.im * bComplex.re,
  );
}

export function divide(a: Complex | number, b: Complex | number): Complex {
  const aComplex = typeof a === 'number' ? createComplex(a, 0) : a;
  const bComplex = typeof b === 'number' ? createComplex(b, 0) : b;
  // (a + bi) / (c + di) = ((ac + bd) + (bc - ad)i) / (c² + d²)
  const denominator = bComplex.re * bComplex.re + bComplex.im * bComplex.im;
  return createComplex(
    (aComplex.re * bComplex.re + aComplex.im * bComplex.im) / denominator,
    (aComplex.im * bComplex.re - aComplex.re * bComplex.im) / denominator,
  );
}

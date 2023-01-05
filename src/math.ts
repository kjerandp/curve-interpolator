import {
  NumArray4,
  Vector,
} from './interfaces';
import { reduce, fill, map } from './utils';

export const EPS = Math.pow(2, -42);

/**
 * Take the cube root of a number
 * @param x value to return the cube root of
 */
function cuberoot(x: number) : number {
  const y = Math.pow(Math.abs(x), 1/3);
  return x < 0 ? -y : y;
}

/**
 * Solve 2nd degree equations
 * @param a 2nd degree coefficient
 * @param b 1st degree coefficient
 * @param c constant coefficient
 */
export function getQuadRoots(a: number, b: number, c: number) : number[] {
  if (Math.abs(a) < EPS) { // Linear case, ax+b=0
    if (Math.abs(b) < EPS) return []; // Degenerate case
    return [-c / b];
  }
  const D = b * b - 4 * a * c;
  if (Math.abs(D) < EPS) return [-b / (2 * a)];

  if (D > 0) {
    return [(-b + Math.sqrt(D)) / (2 * a), (-b - Math.sqrt(D)) / (2 * a)];
  }
  return [];
}
/**
 * Solve 3rd degree equations
 * @param a 3rd degree coefficient
 * @param b 2nd degree coefficient
 * @param c 1st degree coefficient
 * @param d constant coefficient
 */
export function getCubicRoots(a: number, b: number, c: number, d: number) : number[] {
  if (Math.abs(a) < EPS) { // Quadratic case, ax^2+bx+c=0
    return getQuadRoots(b, c, d);
  }

  // Convert to depressed cubic t^3+pt+q = 0 (subst x = t - b/3a)
  const p = (3 * a * c - b * b) / (3 * a * a);
  const q = (2 * b * b * b - 9 * a * b * c + 27 * a * a * d) / (27 * a * a * a);
  let roots : number[];

  if (Math.abs(p) < EPS) { // p = 0 -> t^3 = -q -> t = -q^1/3
    roots = [cuberoot(-q)];
  } else if (Math.abs(q) < EPS) { // q = 0 -> t^3 + pt = 0 -> t(t^2+p)=0
    roots = [0].concat(p < 0 ? [Math.sqrt(-p), -Math.sqrt(-p)] : []);
  } else {
    const D = q * q / 4 + p * p * p / 27;
    if (Math.abs(D) < EPS) {       // D = 0 -> two roots
      roots = [-1.5 * q / p, 3 * q / p];
    } else if (D > 0) {             // Only one real root
      const u = cuberoot(-q / 2 - Math.sqrt(D));
      roots = [u - p/(3*u)];
    } else { // D < 0, three roots, but needs to use complex numbers/trigonometric solution
      const u = 2 * Math.sqrt(-p / 3);
      const t = Math.acos(3 * q / p / u) / 3;  // D < 0 implies p < 0 and acos argument in [-1..1]
      const k = 2 * Math.PI / 3;
      roots = [u * Math.cos(t), u * Math.cos(t-k), u * Math.cos(t - 2 * k)];
    }
  }

  // Convert back from depressed cubic
  for (let i = 0; i < roots.length; i++) {
    roots[i] -= b / (3 * a);
  }

  return roots;
}

/**
 * Calculate coefficients from point values and optional target value for a spline
 * curve with a specified tension
 * @param v0 value of first control point
 * @param v1 value of second control point
 * @param v2 value of third control point
 * @param v3 value of fourth control point
 * @param v target value
 * @param tension curve tension
 * @param deltas time deltas to use for calculating curve velocity vectors
 */
export function getCoefficients(v0: number, v1:number, v2:number, v3:number, v = 0, tension = 0.5, deltas = [0, 1, 2, 3]) : NumArray4 {
  const [t0, t1, t2, t3] = deltas;

  const c = (1 - tension) * (t2 - t1) * ((v0 - v1) / (t0 - t1) - (v0 - v2) / (t0 - t2) + (v1 - v2) / (t1 - t2));
  const x = (1 - tension) * (t2 - t1) * ((v1 - v2) / (t1 - t2) - (v1 - v3) / (t1 - t3) + (v2 - v3) / (t2 - t3));

  const a = (2 * v1 - 2 * v2 + c + x);
  const b = (-3 * v1 + 3 * v2 - 2 * c - x);
  const d = v1 - v;

  return [a, b, c, d];
}

/**
 * Plugs point values into spline equation and return the result
 * @param t interpolation time
 * @param tension curve tension
 * @param deltas time deltas to use for calculating curve velocity vectors
 * @param v0 value of first control point
 * @param v1 value of second control point
 * @param v2 value of third control point
 * @param v3 value of fourth control point
 */
export function solveForT (t:number, tension:number, deltas: NumArray4, v0:number, v1:number, v2:number, v3:number) : number {
  if (Math.abs(t) < EPS) return v1;
  if (Math.abs(1 - t) < EPS) return v2;
  const t2 = t * t;
  const t3 = t * t2;
  const [a, b, c, d] = getCoefficients(v0, v1, v2, v3, 0, tension, deltas);
  return a * t3 + b * t2 + c * t + d;
}

/**
 * Plugs point values into the derivative of the spline equation and return the result
 * @param t interpolation time
 * @param tension curve tension
 * @param deltas time deltas to use for calculating curve velocity vectors
 * @param v0 value of first control point
 * @param v1 value of second control point
 * @param v2 value of third control point
 * @param v3 value of fourth control point
 */
export function getDerivativeOfT(t:number, tension:number, deltas: NumArray4, v0:number, v1:number, v2:number, v3:number) : number {
  const t2 = t * t;
  const [a, b, c] = getCoefficients(v0, v1, v2, v3, 0, tension, deltas);
  return (3 * a * t2 + 2 * b * t + c);
}

/**
 * Calculate the distance between two points
 * @param p1 coordinates of point 1
 * @param p2 coordinates of point 2
 */
export function distance(p1:Vector, p2:Vector) : number {
  return Math.sqrt(reduce(p2, (s, c, i) => s + (c - p1[i]) ** 2));
}

/**
 * Normalizes a vector (mutate input)
 * @param v input array/vector to normalize
 */
export function normalize(v:Vector) : Vector {
  const squared = reduce(v, (s, c) => s + c ** 2);
  const l = Math.sqrt(squared);
  if (l === 0) return fill(v, 0);

  return map(v, c => c / l);
}

/**
 * Rotates a vector 90 degrees to make it orthogonal (mutates input vector)
 * @param v vector to rotate
 */
export function orthogonal(v:Vector) : Vector {
  if (v.length > 2) throw Error('Only supported for 2d vectors');
  const x = -v[1];
  v[1] = v[0];
  v[0] = x;
  return v;
}

/**
 * Clamp an input value to min and max
 * @param value input value
 * @param min min value
 * @param max max value
 */
export function clamp(value:number, min = 0, max = 1) : number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

import {
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
 * Calculate the sum of squares between two points
 * @param u coordinates of point 1
 * @param v coordinates of point 2
 */
export function sumOfSquares(u:Vector, v:Vector) : number {
  let sumOfSquares = 0;
  for (let i = 0; i < u.length; i++) {
    sumOfSquares += (u[i] - v[i]) * (u[i] - v[i]);
  }
  return sumOfSquares;
}

/**
 * Calculate the length of a vector
 * @param v coordinates of the vector
 */
export function length(v:Vector) : number {
  let sumOfSquares = 0;
  for (let i = 0; i < v.length; i++) {
    sumOfSquares += (v[i]) * v[i];
  }
  return Math.sqrt(sumOfSquares);
}

/**
 * Calculate the distance between two points
 * @param p1 coordinates of point 1
 * @param p2 coordinates of point 2
 */
export function distance(p1:Vector, p2:Vector) : number {
  const sqrs = sumOfSquares(p1, p2);
  return sqrs === 0 ? 0 : Math.sqrt(sqrs);
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

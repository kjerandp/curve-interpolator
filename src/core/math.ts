import {
  Vector,
} from './interfaces';
import { reduce, fill, map, copyValues } from './utils';

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
 * Get the dot product of two vectors
 * @param v1 Vector
 * @param v2 Vector
 * @returns Dot product
 */
export function dot(v1:Vector, v2:Vector) : number {
  if (v1.length !== v2.length) throw Error('Vectors must be of equal length!');
  let p = 0;
  for (let k = 0; k < v1.length; k++) {
    p += v1[k] * v2[k];
  }
  return p;
}

/**
 * Get the cross product of two 3d vectors. For 2d vectors, we imply the z-component
 * is zero and return a 3d vector. The function returns undefined for dimensions > 3.
 * @param v1 Vector
 * @param v2 Vector
 * @param target optional target
 * @returns Vector perpendicular to p1 and p2
 */
export function cross(v1:Vector, v2:Vector, target?:Vector) : Vector {
  if (v1.length > 3) return undefined;
  target = target || new Array(3);

  const ax = v1[0], ay = v1[1], az = v1[2] || 0;
  const bx = v2[0], by = v2[1], bz = v2[2] || 0;

  target[0] = ay * bz - az * by;
  target[1] = az * bx - ax * bz;
  target[2] = ax * by - ay * bx;

  return target;
}

/**
 * Add two vectors
 * @param v1 Vector
 * @param v2 Vector
 * @param target optional target
 * @returns Sum of v1 and v2
 */
export function add(v1:Vector, v2:Vector, target?:Vector) : Vector {
  target = target || new Array(v1.length);

  for (let k = 0; k < v1.length; k++) {
    target[k] = v1[k] + v2[k];
  }
  return target;
}

/**
 * Subtract two vectors
 * @param v1 Vector
 * @param v2 Vector
 * @param target optional target
 * @returns Difference of v1 and v2
 */
export function sub(v1:Vector, v2:Vector, target?:Vector) : Vector {
  target = target || new Array(v1.length);

  for (let k = 0; k < v1.length; k++) {
    target[k] = v1[k] - v2[k];
  }
  return target;
}

/**
 * Calculate the sum of squares between two points
 * @param v1 coordinates of point 1
 * @param v2 coordinates of point 2
 */
export function sumOfSquares(v1:Vector, v2:Vector) : number {
  let sumOfSquares = 0;
  for (let i = 0; i < v1.length; i++) {
    sumOfSquares += (v1[i] - v2[i]) * (v1[i] - v2[i]);
  }
  return sumOfSquares;
}

/**
 * Calculate the magnitude/length of a vector
 * @param v coordinates of the vector
 */
export function magnitude(v:Vector) : number {
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
 * @returns the distance between p1 and p2
 */
export function distance(p1:Vector, p2:Vector) : number {
  const sqrs = sumOfSquares(p1, p2);
  return sqrs === 0 ? 0 : Math.sqrt(sqrs);
}

/**
 * Normalizes a vector (mutate input)
 * @param v input array/vector to normalize
 * @param target optional target
 * @return normalized vector v
 */
export function normalize(v:Vector, target?: Vector) : Vector {
  const u = target ? copyValues(v, target) : v;
  const squared = reduce(u, (s, c) => s + c ** 2);
  const l = Math.sqrt(squared);
  if (l === 0) return fill(u, 0);

  return map(u, c => c / l);
}

/**
 * Rotates a vector 90 degrees to make it orthogonal (mutates input vector)
 * @param v vector to rotate
 * @param target optional target
 */
export function orthogonal(v:Vector, target?: Vector) : Vector {
  if (v.length > 2) throw Error('Only supported for 2d vectors');
  const u = target ? copyValues(v, target) : v;
  const x = -u[1];
  u[1] = u[0];
  u[0] = x;
  return u;
}

/**
 * Rotate a point around the given axis and angle 
 * @param vector vector to rotate
 * @param axis vector defining the rotation axis
 * @param angle angle of rotation in radians
 * @param target optional target
 * @returns rotated vector
 */
export function rotate3d(vector:Vector, axis:Vector = [0, 1, 0], angle = 0, target?: Vector) : Vector {
  const c = Math.cos(angle);
  const s = Math.sin(angle);

  const t = 1 - c;

  const vx = vector[0];
  const vy = vector[1];
  const vz = vector[2];

  const ax = axis[0];
  const ay = axis[1];
  const az = axis[2];

  const tx = t * ax, ty = t * ay;
  
  target = target || vector;

  target[0] = (tx * ax + c) * vx + (tx * ay - s * az) * vy + (tx * az + s * ay) * vz;
  target[1] = (tx * ay + s * az) * vx + (ty * ay + c) * vy + (ty * az - s * ax) * vz;
  target[2] = (tx * az - s * ay) * vx + (ty * az + s * ax) * vy + (t * az * az + c) * vz;
  
  return target;
}

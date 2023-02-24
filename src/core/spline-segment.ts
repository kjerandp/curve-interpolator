import { NumArray4, Vector, CurveParameters, SegmentFunction } from "./interfaces";
import { EPS, getCubicRoots, sumOfSquares } from "./math";
import { clamp } from "./utils";



/**
 * This function will calculate the knot sequence, based on a given value for alpha, for a set of
 * control points for a curve segment. It is used to calculate the velocity vectors, which
 * determines the curvature of the segment. Alpha=0.5 produces a centripetal curve, while
 * alpha=1 produces a chordal curve.
 * @param p0 First control point
 * @param p1 Second control point
 * @param p2 Third control point
 * @param p3 Fourth control point
 * @param alpha alpha value
 * @returns calculated knot sequence to use for curve velocity vector calculations
 */
export function calcKnotSequence(p0 : Vector, p1: Vector, p2: Vector, p3: Vector, alpha = 0) : NumArray4 {
  if (alpha === 0) return [0, 1, 2, 3];

  const deltaT = (u: Vector, v: Vector) : number => Math.pow(sumOfSquares(u, v), 0.5 * alpha);

  const t1 = deltaT(p1, p0);
  const t2 = deltaT(p2, p1) + t1;
  const t3 = deltaT(p3, p2) + t2;

  return [0, t1, t2, t3];
}

/**
 * Calculate coefficients for a curve segment with specified parameters
 * @param p0 control point 1
 * @param p1 control point 2
 * @param p2 control point 3
 * @param p3 control point 4
 * @param options curve parameters
 * @returns coefficients for curve function
 */
export function calculateCoefficients(p0: Vector, p1:Vector, p2:Vector, p3:Vector, options: CurveParameters) : NumArray4[] {
  const tension = Number.isFinite(options.tension) ? options.tension : 0.5;
  const alpha = Number.isFinite(options.alpha) ? options.alpha : null;
  const knotSequence = alpha > 0 ? calcKnotSequence(p0, p1, p2, p3, alpha) : null;
  const coefficientsList = new Array(p0.length);

  for (let k = 0; k < p0.length; k++) {
    let u = 0, v = 0;
    const v0 = p0[k], v1 = p1[k], v2 = p2[k], v3 = p3[k];
    if (!knotSequence) {
      u = (1 - tension) * (v2 - v0) * 0.5;
      v = (1 - tension) * (v3 - v1) * 0.5;
    } else {
      const [t0, t1, t2, t3] = knotSequence;
      if (t1 - t2 !== 0) {
        if (t0 - t1 !== 0 && t0 - t2 !== 0) {
          u = (1 - tension) * (t2 - t1) * ((v0 - v1) / (t0 - t1) - (v0 - v2) / (t0 - t2) + (v1 - v2) / (t1 - t2));
        }
        if (t1 - t3 !== 0 && t2 - t3 !== 0) {
          v = (1 - tension) * (t2 - t1) * ((v1 - v2) / (t1 - t2) - (v1 - v3) / (t1 - t3) + (v2 - v3) / (t2 - t3));
        }
      }
    }

    const a = (2 * v1 - 2 * v2 + u + v);
    const b = (-3 * v1 + 3 * v2 - 2 * u - v);
    const c = u;
    const d = v1;
    coefficientsList[k] = [a, b, c, d];
  }
  return coefficientsList;
}

/**
 * Calculates vector component for a point along the curve segment at time t
 * @param t time along curve segment
 * @param coefficients coefficients for curve function
 * @returns curve value
 */
export function valueAtT(t: number, coefficients: NumArray4) : number {
  const t2 = t * t;
  const t3 = t * t2;
  const [a, b, c, d] = coefficients;
  return a * t3 + b * t2 + c * t + d;
}

/**
 * Calculates vector component for the derivative of the curve segment at time t
 * @param t time along curve segment
 * @param coefficients coefficients for curve function
 * @returns derivative (t')
 */
export function derivativeAtT(t: number, coefficients: NumArray4) : number {
  const t2 = t * t;
  const [a, b, c] = coefficients;
  return 3 * a * t2 + 2 * b * t + c;
}

/**
 * Calculates vector component for the second derivative of the curve segment at time t
 * @param t time along curve segment
 * @param coefficients coefficients for curve function
 * @returns second derivative (t'')
 */
export function secondDerivativeAtT(t: number, coefficients: NumArray4) : number {
  const [a, b] = coefficients;
  return 6 * a * t + 2 * b;
}

/**
 * Solves the cubic spline equation and return t
 * @param lookup target lookup value
 * @param coefficients lookup axis coefficients
 */
export function findRootsOfT(lookup: number, coefficients: NumArray4): number[] {
  const [a, b, c, d] = coefficients;
  const x = d - lookup;
  if (a === 0 && b === 0 && c === 0 && x === 0) {
    return [0]; // whole segment matches - how to deal with this?
  }
  const roots = getCubicRoots(a, b, c, x);
  return roots.filter(t => t > -EPS && t <= 1 + EPS).map(t => clamp(t, 0, 1));
}

/**
 * Convenience function for evaluating segment functions for all components of a vector
 * @param func SegmentFunction to evaluate
 * @param t time along curve segment
 * @param coefficients coefficients for curve function (for each component)
 * @param target target vector
 * @returns vector
 */
export function evaluateForT(func: SegmentFunction, t:number, coefficients: NumArray4[], target: Vector = null) : Vector {
  target = target || new Array(coefficients.length);

  for (let k = 0; k < coefficients.length; k++) {
    target[k] = func(t, coefficients[k]);
  }

  return target;
}


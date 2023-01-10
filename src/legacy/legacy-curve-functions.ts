import {
  EPS,
  getQuadRoots,
} from '../core/math';
import {
  Vector,
  LookupOptions,
  BBoxOptions,
  BBox,
  VectorType,
  SplineCurveOptions,
  PositionLookupOptions,
} from '../core/interfaces';
import { calculateCoefficients, derivativeAtT, evaluateForT, findRootsOfT, valueAtT } from '../core/spline-segment';
import { getControlPoints, getSegmentIndexAndT } from '../core/spline-curve';

/**
 * @deprecated CurveInterpolator/CurveMapper should be used in order to take advantage of cache
 * Find the point on the curve at time t, where t is a number between 0 and 1.
 * Note that splines (curve segements) may have different lengths, thus t will
 * not be evenly distributed.
 * @param t time along curve (0 - 1)
 * @param points set of coordinates/control points making out the curve
 * @param options interpolation options
 * @param target optional target instance to add results to
 */
export function getPointAtT<T extends VectorType>(t: number, points: Vector[], target: T): T
export function getPointAtT<T extends VectorType>(t: number, points: Vector[], options: SplineCurveOptions, target: T): T
export function getPointAtT(t: number, points: Vector[], options: null, target: Vector): Vector
export function getPointAtT(t: number, points: Vector[], options: SplineCurveOptions): Vector
export function getPointAtT(t: number, points: Vector[], options: SplineCurveOptions, target: Vector): Vector
export function getPointAtT(t: number, points: Vector[], options: SplineCurveOptions = {}, target?: Vector) : Vector {
  const { index, weight } = getSegmentIndexAndT(t, points, !!options.closed);
  const [p0, p1, p2, p3] = getControlPoints(index, points, !!options.closed);
  const coefficients = calculateCoefficients(p0, p1, p2, p3, options);

  target = target || new Array(p0.length);

  return evaluateForT(valueAtT, weight, coefficients, target);
}


/**
 * @deprecated CurveInterpolator/CurveMapper should be used in order to take advantage of cache
 * Find the tangent on the curve at time t, where t is a number between 0 and 1.
 * Note that splines (curve segements) may have different lengths, thus t will
 * not be evenly distributed.
 * @param t time along curve (0 - 1)
 * @param points set of coordinates/control points making out the curve
 * @param options curve options (tension [0-1], alpha [0-1], closed [true/false])
 * @param target optional target instance to add results to
 */
export function getTangentAtT<T extends VectorType>(t: number, points: Vector[], options: null, target: T): T
export function getTangentAtT<T extends VectorType>(t: number, points: Vector[], options: SplineCurveOptions, target: T): T
export function getTangentAtT(t: number, points: Vector[]): Vector
export function getTangentAtT(t: number, points: Vector[], options: SplineCurveOptions): Vector
export function getTangentAtT(t: number, points: Vector[], options: SplineCurveOptions, target: Vector): Vector
export function getTangentAtT(t: number, points: Vector[], options: SplineCurveOptions = {}, target?: Vector): Vector {
  const { index, weight } = getSegmentIndexAndT(t, points, !!options.closed);
  const [p0, p1, p2, p3] = getControlPoints(index, points, !!options.closed);
  const coefficients = calculateCoefficients(p0, p1, p2, p3, options);

  target = target || new Array(p0.length);

  return evaluateForT(derivativeAtT, weight, coefficients, target);
}

/**
 * @deprecated CurveInterpolator/CurveMapper should be used in order to take advantage of cache
 * Looks up values intersecting the curve along one of the axises (x=0, y=1, z=2 ...).
 * @param lookup lookup value along the axis
 * @param points control points
 * @param options lookup options to control axis, tension, alpha, max solutions etc.
 */
export function valuesLookup(lookup: number, points: Vector[], options?: LookupOptions): Vector[] {
  const { axis, closed, margin, max, processRefAxis } = {
    axis: 0,
    closed: false,
    margin: 0.5,
    max: 0,
    processRefAxis: false,
    ...options,
  };

  const k = axis;
  const solutions = [];
  const nPoints = closed ? points.length : points.length - 1;

  for (let i = 0; i < nPoints; i += 1) {
    const idx = (max < 0 ? nPoints - (i + 1) : i);

    const [p0, p1, p2, p3] = getControlPoints(idx, points, closed);
    const coefficients = calculateCoefficients(p0, p1, p2, p3, options);

    let vmin: number, vmax: number;
    if (p1[k] < p2[k]) {
      vmin = p1[k];
      vmax = p2[k];
    } else {
      vmin = p2[k];
      vmax = p1[k];
    }

    if (lookup - margin <= vmax && lookup + margin >= vmin) {
      const ts = findRootsOfT(lookup, coefficients[k]);

      // sort on t to solve in order of curve length if max != 0
      if (max < 0) ts.sort((a, b) => b - a);
      else if (max >= 0) ts.sort((a, b) => a - b);

      for (let j = 0; j < ts.length; j++) {
        if (ts[j] === 0 && i > 0) continue; // avoid duplicate (0 would be found as 1 in previous iteration)
        const coord = [];
        for (let c = 0; c < p0.length; c++) {
          let v: number;
          if (c !== k || processRefAxis) {
            v = valueAtT(ts[j], coefficients[c]);
          } else {
            v = lookup;
          }
          coord[c] = v;
        }
        solutions.push(coord);

        if (solutions.length === Math.abs(max)) return solutions;
      }
    }
  }

  return solutions;
}

/**
 * @deprecated CurveInterpolator/CurveMapper should be used in order to take advantage of cache
 * Looks up positions (U values) intersecting the curve along one of the axises (x=0, y=1, z=2 ...).
 * @param lookup lookup value along the axis
 * @param points control points
 * @param options lookup options to control axis, tension, max solutions etc.
 */
export function positionsLookup(lookup: number, points: Vector[], options?: PositionLookupOptions): number[] {
  const { axis, closed, margin, max } = {
    axis: 0,
    closed: false,
    margin: 0.5,
    max: 0,
    ...options,
  };

  const k = axis;
  const solutions = new Set<number>();
  const nPoints = closed ? points.length : points.length - 1;

  for (let i = 0; i < nPoints; i += 1) {
    const idx = (max < 0 ? points.length - i : i);

    const [p0, p1, p2, p3] = getControlPoints(i, points, closed);
    const coefficients = calculateCoefficients(p0, p1, p2, p3, options);

    let vmin: number, vmax: number;
    if (p1[k] < p2[k]) {
      vmin = p1[k];
      vmax = p2[k];
    } else {
      vmin = p2[k];
      vmax = p1[k];
    }

    if (lookup - margin <= vmax && lookup + margin >= vmin) {
      const ts = findRootsOfT(lookup, coefficients[k]);
      // sort on t to solve in order of curve length if max != 0
      if (max < 0) ts.sort((a, b) => b - a);
      else if (max >= 0) ts.sort((a, b) => a - b);

      for (let j = 0; j < ts.length; j++) {
        if (ts[j] === 0 && i > 0) continue; // avoid duplicate (0 would be found as 1 in previous iteration)
        const nt = (ts[j] + idx) / nPoints; // normalize t
        solutions.add(nt);

        if (solutions.size === Math.abs(max)) return Array.from(solutions);
      }
    }
  }

  return Array.from(solutions);
}

/**
 * @deprecated CurveInterpolator/CurveMapper should be used in order to take advantage of cache
 * Get the bounding box for the curve or a segment of the curve
 * @param points Curve points
 * @param options Bounding box options
 */
export function getBoundingBox(points: Vector[], options: BBoxOptions = {}): BBox {
  const { tension, alpha, closed, from: t0, to: t1 } = {
    tension: 0.5,
    alpha: 0,
    closed: false,
    from: 0,
    to: 1,
    ...options,
  };
  const nPoints = closed ? points.length : points.length - 1;

  const i0 = Math.floor(nPoints * t0);
  const i1 = Math.ceil(nPoints * t1);

  const start = getPointAtT(t0, points, { tension, alpha, closed });
  const end = getPointAtT(t1, points, { tension, alpha, closed });

  const min = [];
  const max = [];

  for (let c = 0; c < start.length; c++) {
    min[c] = Math.min(start[c], end[c]);
    max[c] = Math.max(start[c], end[c]);
  }

  for (let i = i0 + 1; i <= i1; i++) {
    const [p0, p1, p2, p3] = getControlPoints(i - 1, points, closed);

    if (i < i1) {
      for (let c = 0; c < p2.length; c++) {
        if (p2[c] < min[c]) min[c] = p2[c];
        if (p2[c] > max[c]) max[c] = p2[c];
      }
    }

    if (tension < 1) {
      const w0 = nPoints * t0 - (i - 1);
      const w1 = nPoints * t1 - (i - 1);

      const valid = (t: number) => t > -EPS && t <= 1 + EPS && (i - 1 !== i0 || t > w0) && (i !== i1 || t < w1);

      const coefficients = calculateCoefficients(p0, p1, p2, p3, { tension, alpha });
      for (let c = 0; c < coefficients.length; c++) {
        const [k, l, m] = coefficients[c];

        const roots = getQuadRoots(3 * k, 2 * l, m);

        roots.filter(valid).forEach(t => {
          const v = valueAtT(t, coefficients[c]);
          if (v < min[c]) min[c] = v;
          if (v > max[c]) max[c] = v;
        });
      }
    }
  }

  return { min, max };
}

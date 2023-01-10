import {
  solveForT,
  getDerivativeOfT,
  getCoefficients,
  getCubicRoots,
  distance,
  clamp,
  EPS,
  getQuadRoots,
  sumOfSquares,
} from './math';
import {
  Vector,
  LookupOptions,
  BBoxOptions,
  BBox,
  VectorType,
  CurveOptions,
  InterpolationOptions,
  PositionLookupOptions,
  NumArray4,
} from './interfaces';

/**
 * Used to extrapolate points in the beginning and end segments of an open spline chain
 * @param u Point bias 1
 * @param v Point bias 2
 * @returns extrapolated point
 */
function extrapolateControlPoint(u: Vector, v: Vector) : Vector {
  const e = new Array(u.length);
  for (let i = 0; i < u.length; i++) {
    e[i] = 2 * u[i] + (-1 * v[i]);
  }
  return e;
}

/**
 * Get the four control points for a spline segment
 * @param idx segment index
 * @param points all input control points
 * @param closed whether the curve should be closed or open
 * @returns array of control points
 */
function getControlPoints(idx: number, points: Vector[], closed: boolean) : Vector[] {
  const maxIndex = points.length - 1;

  let p0: Vector, p1: Vector, p2: Vector, p3: Vector;

  if (closed) {
    p0 = points[idx - 1 < 0 ? maxIndex : idx - 1];
    p1 = points[idx % points.length];
    p2 = points[(idx + 1) % points.length];
    p3 = points[(idx + 2) % points.length];
  } else {
    p1 = points[idx];
    p2 = points[Math.min(maxIndex, idx + 1)];
    p0 = idx > 0 ? points[idx - 1] : extrapolateControlPoint(p1, p2);
    p3 = idx < maxIndex - 1 ? points[idx + 2] : extrapolateControlPoint(p2, p1);
  }

  return [p0, p1, p2, p3];
}

/**
 * This function will calculate the knot sequence, based on a given value for alpha, for a set of
 * control points for a spline segment. It is used to calculate the velocity vectors, which
 * determines the curvature of the segment.
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
 * Find the point on the curve at time t, where t is a number between 0 and 1.
 * Note that splines (curve segements) may have different lengths, thus t will
 * not be evenly distributed.
 * @param t time along curve (0 - 1)
 * @param points set of coordinates/control points making out the curve
 * @param options interpolation options
 * @param target optional target instance to add results to
 */
export function getPointAtT<T extends VectorType>(t: number, points: Vector[], target: T): T
export function getPointAtT<T extends VectorType>(t: number, points: Vector[], options: InterpolationOptions, target: T): T
export function getPointAtT(t: number, points: Vector[], options: null, target: Vector): Vector
export function getPointAtT(t: number, points: Vector[], options: InterpolationOptions): Vector
export function getPointAtT(t: number, points: Vector[], options: InterpolationOptions, target: Vector): Vector
export function getPointAtT(t: number, points: Vector[], options: InterpolationOptions = {}, target?: Vector) : Vector {
  const tension = Number.isFinite(options.tension) ? options.tension : 0.5;
  const alpha = Number.isFinite(options.alpha) ? options.alpha : 0;

  const closed = !!options.closed;
  const func = options.func || solveForT;

  const nPoints = closed ? points.length : points.length - 1;
  const p = nPoints * t;
  const idx = Math.floor(p);
  const weight = p - idx;

  const [p0, p1, p2, p3] = getControlPoints(idx, points, closed);

  target = target || new Array(p0.length);

  const knotSequence = calcKnotSequence(p0, p1, p2, p3, alpha);

  for (let i = 0; i < p0.length; i++) {
    target[i] = func(weight, tension, knotSequence, p0[i], p1[i], p2[i], p3[i]);
  }

  return target;
}

/**
 * Find the tangent on the curve at time t, where t is a number between 0 and 1.
 * Note that splines (curve segements) may have different lengths, thus t will
 * not be evenly distributed.
 * @param t time along curve (0 - 1)
 * @param points set of coordinates/control points making out the curve
 * @param options curve options (tension [0-1], alpha [0-1], closed [true/false])
 * @param target optional target instance to add results to
 */
export function getTangentAtT<T extends VectorType>(t: number, points: Vector[], options: null, target: T): T
export function getTangentAtT<T extends VectorType>(t: number, points: Vector[], options: CurveOptions, target: T): T
export function getTangentAtT(t: number, points: Vector[]): Vector
export function getTangentAtT(t: number, points: Vector[], options: CurveOptions): Vector
export function getTangentAtT(t: number, points: Vector[], options: CurveOptions, target: Vector): Vector
export function getTangentAtT(t: number, points: Vector[], options: CurveOptions = {}, target?: Vector): Vector {
  const tension = Number.isFinite(options.tension) ? options.tension : 0.5;
  const alpha = Number.isFinite(options.alpha) ? options.alpha : 0;
  const closed = !!options.closed;

  if (tension === 1 && t === 0) {
    t += EPS;
  } else if ((tension === 1 || alpha > 0) && t === 1) {
    t -= EPS;
  }
  return getPointAtT(t, points, { tension, alpha, closed, func: getDerivativeOfT }, target);
}

/**
 * Break curve into segments and return the curve length at each segment index.
 * Used for mapping between t and u along the curve.
 * @param points set of coordinates/control points making out the curve
 * @param divisions number of segments to divide the curve into to estimate its length
 * @param options curve options (tension [0-1], alpha [0-1], closed [true/false])
 */
export function getArcLengths(points: Vector[], divisions: number, options: CurveOptions = {}) {
  const lengths = [];
  let current: Vector, last = getPointAtT(0, points, options) as Vector;
  let sum = 0;

  divisions = divisions || 300;

  lengths.push(0);

  for (let p = 1; p <= divisions; p++) {
    current = getPointAtT(p / divisions, points, options) as Vector;
    sum += distance(current, last);
    lengths.push(sum);
    last = current;
  }

  return lengths;
}

/**
 * This maps a value of normalized u (global time along curve) to a value of t,
 * where t is a value between 0 and 1 which can be used to calculate the spline
 * segment index and local spline time along curve.
 * @param u point on curve between 0 and 1.
 * @param arcLengths aggregated curve segment lengths
 */
export function getUtoTmapping(u: number, arcLengths: number[]): number {
  const il = arcLengths.length;
  const targetArcLength = u * arcLengths[il - 1];

  // binary search for the index with largest value smaller than target u distance
  let low = 0;
  let high = il - 1;
  let comparison: number;

  let i = 0;

  while (low <= high) {
    i = Math.floor(low + (high - low) / 2);
    comparison = arcLengths[i] - targetArcLength;

    if (comparison < 0) {
      low = i + 1;
    } else if (comparison > 0) {
      high = i - 1;
    } else {
      high = i;
      break; // DONE
    }
  }

  i = high;

  if (arcLengths[i] === targetArcLength) {
    return i / (il - 1);
  }

  // we could get finer grain at lengths, or use simple interpolation between two points
  const lengthBefore = arcLengths[i];
  const lengthAfter = arcLengths[i + 1];
  const segmentLength = lengthAfter - lengthBefore;

  // determine where we are between the 'before' and 'after' points
  const segmentFraction = (targetArcLength - lengthBefore) / segmentLength;

  // add that fractional amount to t
  return (i + segmentFraction) / (il - 1);
}

/**
 * This maps a normalized value of T (0-1) to a global uniform position U (0-1),
 * @param t point on curve between 0 and 1.
 * @param arcLengths aggregated curve segment lengths
 */
export function getTtoUmapping(t: number, arcLengths: number[]): number {
  if (t === 0) return 0;
  if (t === 1) return 1;

  const al = arcLengths.length - 1;
  const totalLength = arcLengths[al];

  // need to denormalize t to find the matching length
  const tIdx = t * al;

  const subIdx = Math.floor(tIdx);
  const l1 = arcLengths[subIdx];

  if (tIdx === subIdx) return l1 / totalLength;

  const l2 = arcLengths[subIdx + 1];
  const l = l1 + (tIdx - subIdx) * (l2 - l1);

  return l / totalLength;
}

/**
 * Gets and solves the cubic spline equation for t
 * @param lookup target lookup value
 * @param tension curve tension
 * @param knotSequence knot sequence to use for calculating curve velocity vectors
 * @param v0 axis value of control point 0
 * @param v1 axis value of control point 1
 * @param v2 axis value of control point 2
 * @param v3 axis value of control point 3
 */
export function getTAtValue(lookup: number, tension: number, knotSequence: NumArray4, v0: number, v1: number, v2: number, v3: number): number[] {
  const [a, b, c, d] = getCoefficients(v0, v1, v2, v3, lookup, tension, knotSequence);
  if (a === 0 && b === 0 && c === 0 && d === 0) {
    return [0]; // whole segment matches - how to deal with this?
  }
  const roots = getCubicRoots(a, b, c, d);
  return roots.filter(t => t > -EPS && t <= 1 + EPS).map(t => clamp(t, 0, 1));
}

/**
 * Looks up values intersecting the curve along one of the axises (x=0, y=1, z=2 ...).
 * @param lookup lookup value along the axis
 * @param points control points
 * @param options lookup options to control axis, tension, alpha, max solutions etc.
 */
export function valuesLookup(lookup: number, points: Vector[], options?: LookupOptions): Vector[] {

  const { func, axis, tension, alpha, closed, margin, max, processRefAxis } = {
    axis: 0,
    tension: 0.5,
    alpha: 0,
    closed: false,
    margin: 0.5,
    max: 0,
    processRefAxis: false,
    func: solveForT,
    ...options,
  };

  const k = axis;
  const solutions = [];

  const nPoints = closed ? points.length : points.length - 1;

  for (let i = 0; i < nPoints; i += 1) {
    const idx = (max < 0 ? nPoints - (i + 1) : i);

    const [p0, p1, p2, p3] = getControlPoints(idx, points, closed);

    let vmin: number, vmax: number;
    if (p1[k] < p2[k]) {
      vmin = p1[k];
      vmax = p2[k];
    } else {
      vmin = p2[k];
      vmax = p1[k];
    }

    if (lookup - margin <= vmax && lookup + margin >= vmin) {
      const knotSequence = calcKnotSequence(p0, p1, p2, p3, alpha);
      const ts = getTAtValue(lookup, tension, knotSequence, p0[k], p1[k], p2[k], p3[k]);

      // sort on t to solve in order of curve length if max != 0
      if (max < 0) ts.sort((a, b) => b - a);
      else if (max >= 0) ts.sort((a, b) => a - b);

      for (let j = 0; j < ts.length; j++) {
        if (ts[j] === 0 && i > 0) continue; // avoid duplicate (0 would be found as 1 in previous iteration)
        const coord = [];
        for (let c = 0; c < p0.length; c++) {
          let v: number;
          if (c !== k || processRefAxis) {
            v = func(ts[j], tension, knotSequence, p0[c], p1[c], p2[c], p3[c], idx - 1);
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
 * Looks up positions (U values) intersecting the curve along one of the axises (x=0, y=1, z=2 ...).
 * @param lookup lookup value along the axis
 * @param points control points
 * @param options lookup options to control axis, tension, max solutions etc.
 */
export function positionsLookup(lookup: number, points: Vector[], options?: PositionLookupOptions): number[] {

  const { axis, tension, alpha, closed, margin, max } = {
    axis: 0,
    tension: 0.5,
    alpha: 0,
    closed: false,
    margin: 0.5,
    max: 0,
    ...options,
  };

  const k = axis;
  const solutions = new Set<number>();
  const arcLengths = options.arcLengths || getArcLengths(points, options.arcDivisions || 300, { tension, alpha, closed });
  const nPoints = closed ? points.length : points.length - 1;

  for (let i = 0; i < nPoints; i += 1) {
    const idx = (max < 0 ? points.length - i : i);

    const [p0, p1, p2, p3] = getControlPoints(idx, points, closed);

    let vmin: number, vmax: number;
    if (p1[k] < p2[k]) {
      vmin = p1[k];
      vmax = p2[k];
    } else {
      vmin = p2[k];
      vmax = p1[k];
    }

    const knotSequence = calcKnotSequence(p0, p1, p2, p3, alpha);

    if (lookup - margin <= vmax && lookup + margin >= vmin) {
      const ts = getTAtValue(lookup, tension, knotSequence, p0[k], p1[k], p2[k], p3[k]);

      // sort on t to solve in order of curve length if max != 0
      if (max < 0) ts.sort((a, b) => b - a);
      else if (max >= 0) ts.sort((a, b) => a - b);

      for (let j = 0; j < ts.length; j++) {
        if (ts[j] === 0 && i > 0) continue; // avoid duplicate (0 would be found as 1 in previous iteration)
        const nt = (ts[j] + idx) / nPoints; // normalize t
        const u = getTtoUmapping(nt, arcLengths);
        solutions.add(u);

        if (solutions.size === Math.abs(max)) return Array.from(solutions);
      }
    }
  }

  return Array.from(solutions);
}


/**
 * Lookup tangents at the intersection points formed by a value along one of the axises (x=0, y=1, z=2 ...).
 * @param lookup lookup value along the axis
 * @param points control points
 * @param options lookup options to control axis, tension, alpha, max solutions etc.
 */
export function tangentsLookup(lookup: number, points: Vector[], options?: LookupOptions): Vector[] {
  return valuesLookup(lookup, points, {
    ...options,
    func: getDerivativeOfT,
    processRefAxis: true,
  }) as Vector[];
}

/**
 * Get the bounding box for the curve or a segment of the curve
 * @param points Curve points
 * @param options Bounding box options
 */
export function getBoundingBox(points: Vector[], options: BBoxOptions = {}): BBox {
  const { tension, alpha, closed, from: u0, to: u1, arcDivisions } = {
    tension: 0.5,
    alpha: 0,
    closed: false,
    from: 0,
    to: 1,
    arcDivisions: 300,
    ...options,
  };
  const nPoints = closed ? points.length : points.length - 1;
  const arcLengths = options.arcLengths || getArcLengths(points, arcDivisions, { tension, alpha, closed });

  const t0 = getUtoTmapping(u0, arcLengths);
  const t1 = getUtoTmapping(u1, arcLengths);

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
      const knotSequence = calcKnotSequence(p0, p1, p2, p3, alpha);

      for (let c = 0; c < p0.length; c++) {
        const [k, l, m] = getCoefficients(p0[c], p1[c], p2[c], p3[c], 0, tension, knotSequence);

        const roots = getQuadRoots(3 * k, 2 * l, m);

        roots.filter(valid).forEach(t => {
          const v = solveForT(t, tension, knotSequence, p0[c], p1[c], p2[c], p3[c]);
          if (v < min[c]) min[c] = v;
          if (v > max[c]) max[c] = v;
        });
      }
    }
  }

  return { min, max };
}

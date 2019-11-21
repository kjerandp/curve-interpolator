import {
  solveForT,
  getDerivativeOfT,
  getCoefficients,
  getCubicRoots,
  distance,
  orthogonal,
  clamp,
  EPS,
  getQuadRoots,
 } from './math';

/**
 * Find the point on the curve at time t, where t is a number between 0 and 1.
 * Note that splines (curve segements) may have different lengths, thus t will
 * not be evenly distributed.
 * @param t time along curve (0 - 1)
 * @param points set of coordinates/control points making out the curve
 * @param tension curve tension (0 = Catmull-Rom curve, 1 = linear curve)
 * @param func override function used to retrieve the x and y values of the point at t
 */
export function getPointAtT(t:number, points:number[][], tension:number, func:Function = solveForT) : number[] {
  const p = (points.length - 1) * t;
  const idx = Math.floor(p);
  const weight = p - idx;

  const p0 = points[idx === 0 ? idx : idx - 1];
  const p1 = points[idx];
  const p2 = points[idx > points.length - 2 ? points.length - 1 : idx + 1];
  const p3 = points[idx > points.length - 3 ? points.length - 1 : idx + 2];

  const x = func(weight, tension, p0[0], p1[0], p2[0], p3[0]);
  const y = func(weight, tension, p0[1], p1[1], p2[1], p3[1]);

  return [x, y];
}

/**
 * Find the tangent on the curve at time t, where t is a number between 0 and 1.
 * Note that splines (curve segements) may have different lengths, thus t will
 * not be evenly distributed.
 * @param t time along curve (0 - 1)
 * @param points set of coordinates/control points making out the curve
 * @param tension curve tension (0 = Catmull-Rom curve, 1 = linear curve)
 */
export function getTangentAtT(t:number, points:number[][], tension:number) : number[] {
  if (tension === 1 && t === 0) {
    t += EPS;
  } else if (tension === 1 && t === 1) {
    t -= EPS;
  }
  return getPointAtT(t, points, tension, getDerivativeOfT);
}

/**
 * Find the normal on the curve at time t, where t is a number between 0 and 1.
 * Note that splines (curve segements) may have different lengths, thus t will
 * not be evenly distributed.
 * @param t time along curve (0 - 1)
 * @param points set of coordinates/control points making out the curve
 * @param tension curve tension (0 = Catmull-Rom curve, 1 = linear curve)
 */
export function getNormalAtT(t:number, points:number[][], tension:number) : number[] {
  const res = getTangentAtT(t, points, tension);
  return orthogonal(res);
}

/**
 * Find the angle in radians on the curve at time t, where t is a number between 0 and 1.
 * Note that splines (curve segements) may have different lengths, thus t will
 * not be evenly distributed.
 * @param t time along curve (0 - 1)
 * @param points set of coordinates/control points making out the curve
 * @param tension curve tension (0 = Catmull-Rom curve, 1 = linear curve)
 */
export function getAngleAtT(t:number, points:number[][], tension:number) : number {
  const tan = getTangentAtT(t, points, tension);
  return Math.atan2(tan[1], tan[0]);
}

/**
 * Break curve into segments and return the curve length at each segment index.
 * Used for mapping between t and u along the curve.
 * @param points set of coordinates/control points making out the curve
 * @param divisions number of segments to divide the curve into to estimate its length
 * @param tension curve tension (0 = Catmull-Rom curve, 1 = linear curve)
 */
export function getArcLengths(points:number[][], divisions:number, tension:number = 0.5) {
  const lengths = [];
  let current:number[], last = getPointAtT(0, points, tension);
  let sum = 0;

  divisions = divisions || 300;

  lengths.push(0);

  for (let p = 1; p <= divisions; p++) {
    current = getPointAtT(p / divisions, points, tension);
    sum += distance(current, last);
    lengths.push(sum);
    last = current;
  }

  return lengths;
}

/**
 * This maps a value of t (time along curve) to a value of u, where u is an uniformly
 * distributed index along the curve between 0 and 1
 * @param u point on curve between 0 and 1.
 * @param arcLengths aggregated curve segment lengths
 */
export function getUtoTmapping(u:number, arcLengths:number[]) : number {
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

    if ( comparison < 0 ) {
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
 * This maps a value of u (uniformly distributed along curve) to a value of t,
 * where t is equally split between all segments.
 * @param t point on curve between 0 and 1.
 * @param arcLengths aggregated curve segment lengths
 */
export function getTtoUmapping(t:number, arcLengths:number[]) : number {
  if (t === 0) return 0;
  if (t === 1) return 1;

  const al = arcLengths.length - 1;
  const totalLength = arcLengths[al];

  const tIdx = t * al;

  const subIdx = Math.floor(tIdx);
  const l1 = arcLengths[subIdx];

  if (tIdx === subIdx) return l1 / totalLength;

  const l2 = arcLengths[subIdx + 1];
  const l = l1 + (tIdx - subIdx) * (l2 - l1);

  return l / totalLength;
}

/**
 * Find the point on the curve at position u, where u is a number between 0 and 1, and
 * is refering to the normalized length along the curve.
 * @param u position at curve (0 - 1)
 * @param points set of coordinates/control points making out the curve
 * @param tension curve tension (0 = Catmull-Rom curve, 1 = linear curve)
 * @param arcLengths optional list of pre-calculated curve segment lengths
 * @param func optional override function used to retrieve the x and y values of the point at t
 */
export function getPointAtU(u:number, points:number[][], tension?:number, arcLengths?:number[], func?:Function) : number[] {
  const t = getUtoTmapping(
    u,
    arcLengths || getArcLengths(points, 300, tension));
  const p = getPointAtT(t, points, tension, func);
  return p;
}

/**
 * Find the tangent on the curve at position u, where u is a number between 0 and 1, and
 * is refering to the normalized length along the curve.
 * @param u position at curve (0 - 1)
 * @param points set of coordinates/control points making out the curve
 * @param tension curve tension (0 = Catmull-Rom curve, 1 = linear curve)
 * @param arcLengths optional list of pre-calculated curve segment lengths
 */
export function getTangentAtU(u:number, points:number[][], tension?:number, arcLengths?:number[]) : number[] {
  if (tension === 1 && u === 0) {
    u += EPS;
  } else if (tension === 1 && u === 1) {
    u -= EPS;
  }
  return getPointAtU(u, points, tension, arcLengths, getDerivativeOfT);
}

/**
 * Find the normal on the curve at position u, where u is a number between 0 and 1, and
 * is refering to the normalized length along the curve.
 * @param u position at curve (0 - 1)
 * @param points set of coordinates/control points making out the curve
 * @param tension curve tension (0 = Catmull-Rom curve, 1 = linear curve)
 * @param arcLengths optional list of pre-calculated curve segment lengths
 */
export function getNormalAtU(u:number, points:number[][], tension?:number, arcLengths?:number[]) : number[] {
  const res = getTangentAtU(u, points, tension, arcLengths);
  const x = -res[1];
  res[1] = res[0];
  res[0] = x;
  return res;
}

/**
 * Find the angle on the curve at position u, where u is a number between 0 and 1, and
 * is refering to the normalized length along the curve.
 * @param u position at curve (0 - 1)
 * @param points set of coordinates/control points making out the curve
 * @param tension curve tension (0 = Catmull-Rom curve, 1 = linear curve)
 * @param arcLengths optional list of pre-calculated curve segment lengths
 */
export function getAngleAtU(u:number, points:number[][], tension?:number, arcLengths?:number[]) : number {
  const tan = getTangentAtU(u, points, tension, arcLengths);
  return Math.atan2(tan[1], tan[0]);
}

/**
 *
 * @param lookup
 * @param tension
 * @param v0
 * @param v1
 * @param v2
 * @param v3
 */
export function getTAtValue(lookup:number, tension:number, v0:number, v1:number, v2:number, v3:number) : number[] {
  const [a, b, c, d] = getCoefficients(v0, v1, v2, v3, lookup, tension);
  if (a === 0 && b === 0 && c === 0 && d === 0) {
    return [0]; // whole segment matches - how to deal with this?
  }
  const roots = getCubicRoots(a, b, c, d);
  return roots.filter(t => t > -EPS && t <= 1 + EPS).map(t => clamp(t, 0, 1));
}

export interface LookupOptions {
  axis?: number,
  tension?: number,
  margin?: number,
  max?: number,
  func?: (t:number, ten:number, v0:number, v1:number, v2:number, v3:number, idx?:number) => number|any,
  processBoth?: boolean,
  arcLengths?: number[],
}

/**
 *
 * @param lookup
 * @param points
 * @param options
 */
export function valuesLookup(lookup:number, points:number[][], options?:LookupOptions) : number[][] | number[] {

  const { func, axis, tension, margin, max, processBoth } = {
    axis: 0,
    tension: 0.5,
    margin: 0.5,
    max: 0,
    func: solveForT,
    ...options,
  };

  const k = axis;
  const l = k ? 0 : 1;

  const solutions = new Set<number|any>();

  for (let i = 1; i < points.length; i++) {
    const idx = max < 0 ? points.length - i : i;

    const p1 = points[idx - 1];
    const p2 = points[idx];

    let vmin, vmax;
    if (p1[k] < p2[k]) {
      vmin = p1[k];
      vmax = p2[k];
    } else {
      vmin = p2[k];
      vmax = p1[k];
    }

    if (lookup - margin <= vmax && lookup + margin >= vmin) {
      const p0 = points[idx - 1 === 0 ? 0 : idx - 2];
      const p3 = points[idx > points.length - 2 ? points.length - 1 : idx + 1];
      const ts = getTAtValue(lookup, tension, p0[k], p1[k], p2[k], p3[k]);

      // sort on t to solve in order of curve length if max != 0
      if (max < 0) ts.sort((a, b) => b - a);
      else if (max >= 0) ts.sort((a, b) => a - b);

      for (let j = 0; j < ts.length; j++) {
        const v = func(ts[j], tension, p0[l], p1[l], p2[l], p3[l], idx - 1);
        if (processBoth) {
          const av = func(ts[j], tension, p0[k], p1[k], p2[k], p3[k], idx - 1);
          const pt = axis === 0 ? [av, v] : [v, av];
          solutions.add(pt);
        } else {
          solutions.add(v);
        }
        if (solutions.size === Math.abs(max)) return Array.from(solutions);
      }
    }
  }

  return Array.from(solutions);
}

/**
 *
 * @param lookup
 * @param points
 * @param options
 */
export function lengthsLookup(lookup:number, points:number[][], options?: LookupOptions) : number[] {
  const ops = {
    axis: 0,
    tension: 0.5,
    margin: 0.5,
    ...options,
  };
  const arcLengths = ops.arcLengths || getArcLengths(points, 300, ops.tension)

  ops.func = (t, ten, v0, v1, v2, v3, idx) => getTtoUmapping(
    (t + idx) / (points.length - 1),
    arcLengths,
  );

  return valuesLookup(lookup, points, ops) as number[];
}

/**
 *
 * @param lookup
 * @param points
 * @param options
 */
export function tangentsLookup(lookup:number, points:number[][], options?:LookupOptions) : number[][] {
  return valuesLookup(lookup, points, {
    ...options,
    func: getDerivativeOfT,
    processBoth: true,
  }) as number[][];
}

/**
 *
 * @param lookup
 * @param points
 * @param options
 */
export function normalsLookup(lookup:number, points:number[][], options?:LookupOptions) : number[][] {
  const tans = tangentsLookup(lookup, points, options);
  return tans.map(v => orthogonal(v));
}

/**
 *
 * @param lookup
 * @param points
 * @param options
 */
export function angelsLookup(lookup:number, points:number[][], options?:LookupOptions) : number[] {
  const tans = tangentsLookup(lookup, points, options);
  return tans.map(tan => Math.atan2(tan[1], tan[0]));
}

export interface BBox {
  x1: number,
  y1: number,
  x2: number,
  y2: number,
}

export interface BBoxOptions {
  tension: number,
  from: number,
  to: number,
  arcLengths: number[],
}

/**
 *
 * @param points
 * @param options
 */
export function getBoundingBox(points:number[][], options?:BBoxOptions) : BBox {
  let { tension, from: u0, to: u1, arcLengths } = {
    tension: 0.5,
    from: 0,
    to: 1,
    arcLengths: null,
    ...options,
  };

  arcLengths = arcLengths || getArcLengths(points, 300, tension);

  const t0 = getUtoTmapping(u0, arcLengths);
  const t1 = getUtoTmapping(u1, arcLengths);

  const i0 = Math.floor((points.length - 1) * t0);
  const i1 = Math.ceil((points.length - 1) * t1);

  const start = getPointAtT(t0, points, tension);
  const end = getPointAtT(t1, points, tension);

  let x1 = Math.min(start[0], end[0]);
  let x2 = Math.max(start[0], end[0]);
  let y1 = Math.min(start[1], end[1]);
  let y2 = Math.max(start[1], end[1]);

  for (let i = i0 + 1; i <= i1; i++) {
    const p1 = points[i - 1];
    const p2 = points[i];

    if (i < i1) {
      if (p2[0] < x1) x1 = p2[0];
      if (p2[0] > x2) x2 = p2[0];
      if (p2[1] < y1) y1 = p2[1];
      if (p2[1] > y2) y2 = p2[1];
    }

    const w0 = (points.length - 1) * t0 - (i - 1);
    const w1 = (points.length - 1) * t1 - (i - 1);

    if (tension < 1) {
      const p0 = points[i - 2 < 0 ? 0 : i - 2];
      const p3 = points[i > points.length - 2 ? points.length - 1 : i + 1];
      const [ax, bx, cx] = getCoefficients(p0[0], p1[0], p2[0], p3[0], 0, tension);
      const [ay, by, cy] = getCoefficients(p0[1], p1[1], p2[1], p3[1], 0, tension);
      const xroots = getQuadRoots(3 * ax, 2 * bx, cx);
      const yroots = getQuadRoots(3 * ay, 2 * by, cy);

      const valid = t => t >= 0 && t <= 1 && (i - 1 !== i0 || t > w0) && (i !== i1 || t < w1);

      xroots.filter(valid).forEach(t => {
          const x = solveForT(t, tension, p0[0], p1[0], p2[0], p3[0]);
          if (x < x1) x1 = x;
          if (x > x2) x2 = x;
        });

      yroots.filter(valid).forEach(t => {
        const y = solveForT(t, tension, p0[1], p1[1], p2[1], p3[1]);
        if (y < y1) y1 = y;
        if (y > y2) y2 = y;
      });
    }
  }

  return { x1, y1, x2, y2 };
}

import {
  Vector,
} from './interfaces';

/**
 * Used to extrapolate points in the beginning and end segments of an open spline chain
 * @param u Point bias 1
 * @param v Point bias 2
 * @returns extrapolated point
 */
export function extrapolateControlPoint(u: Vector, v: Vector) : Vector {
  const e = new Array(u.length);
  for (let i = 0; i < u.length; i++) {
    e[i] = 2 * u[i] - v[i];
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
export function getControlPoints(idx: number, points: Vector[], closed: boolean) : Vector[] {
  const maxIndex = points.length - 1;

  let p0: Vector, p1: Vector, p2: Vector, p3: Vector;

  if (closed) {
    p0 = points[idx - 1 < 0 ? maxIndex : idx - 1];
    p1 = points[idx % points.length];
    p2 = points[(idx + 1) % points.length];
    p3 = points[(idx + 2) % points.length];
  } else {
    if (idx === maxIndex) throw Error('There is no spline segment at this index for a closed curve!');
    p1 = points[idx];
    p2 = points[idx + 1];
    //p2 = idx + 1 <= maxIndex ? points[idx + 1] : extrapolateControlPoint(points[0], p1);
    p0 = idx > 0 ? points[idx - 1] : extrapolateControlPoint(p1, p2);
    p3 = idx < maxIndex - 1 ? points[idx + 2] : extrapolateControlPoint(p2, p1);
  }

  return [p0, p1, p2, p3];
}

/**
 * Find the spline segment index and the corresponding segment weight/fraction at the provided curve time (ct)
 * @param ct non-uniform time along curve (0 - 1)
 * @param points set of coordinates/control points making out the curve
 * @param options
 * @returns segment index and time
 */
export function getSegmentIndexAndT(ct: number, points: Vector[], closed = false) : { index: number, weight: number } {
  const nPoints = closed ? points.length : points.length - 1;
  if (ct === 1.0) return { index: nPoints - 1, weight: 1.0 };

  const p = nPoints * ct;
  const index = Math.floor(p);
  const weight = p - index;
  return { index, weight };
}


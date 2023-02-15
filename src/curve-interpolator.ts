import {
  getControlPoints,
} from './core/spline-curve';

import {
  cross,
  dot,
  EPS,
  getQuadRoots,
  magnitude,
  normalize,
} from './core/math';

import {
  BBox,
  Vector,
  VectorType,
  SplineCurveOptions,
  CurveMapper,
} from './core/interfaces';
import { SegmentedCurveMapper } from './curve-mappers/segmented-curve-mapper';
import { derivativeAtT, findRootsOfT, secondDerivativeAtT, valueAtT } from './core/spline-segment';
import { NumericalCurveMapper } from './curve-mappers/numerical-curve-mapper';
import { clamp, copyValues, map } from './core/utils';

export interface CurveInterpolatorOptions extends SplineCurveOptions {
  arcDivisions?: number,
  numericalApproximationOrder?: number,
  numericalInverseSamples?: number,
  lmargin?: number,
}

/**
 * Cubic curve interpolator
 */
export default class CurveInterpolator {
  _lmargin: number;
  _curveMapper: CurveMapper;
  _bbox?: BBox;

  /**
   * Create a new interpolator instance
   * @param points control points
   * @param options curve interpolator options
   */
  constructor(points:Vector[], options: CurveInterpolatorOptions = {}) {
    options = {
      tension: 0.5,
      alpha: 0,
      closed: false,
      ...options,
    };

    const curveMapper = options.arcDivisions
      ? new SegmentedCurveMapper(options.arcDivisions, () => this._invalidateCache())
      : new NumericalCurveMapper(options.numericalApproximationOrder, options.numericalInverseSamples, () => this._invalidateCache());
    curveMapper.alpha = options.alpha;
    curveMapper.tension = options.tension;
    curveMapper.closed = options.closed;
    curveMapper.points = points;

    this._lmargin = options.lmargin || 1 - curveMapper.tension;
    this._curveMapper = curveMapper;
  }

  /**
   * Get the point along the curve corresponding to the value of t
   * Used internally by the getPointAt function.
   * @param t time along full curve (encodes segment index and segment t)
   * @param target optional target vector
   * @returns position as vector
   */
  _getPointAtT(t: number, target?: VectorType) : Vector {
    t = clamp(t, 0.0, 1.0);
    if (t === 0) {
      return copyValues(this.points[0], target);
    } else if (t === 1) {
      return copyValues(this.closed ? this.points[0] : this.points[this.points.length - 1], target);
    }
    return this._curveMapper.evaluateForT(valueAtT, t, target);
  }

  /**
   * Returns the time on curve at a position, given as a value between 0 and 1
   * @param position position on curve (0..1)
   */
  getT(position:number) : number {
    return this._curveMapper.getT(position);
  }

  /**
   *
   * @param position position on curve (0..1)
   * @returns length from start to position
   */
  getLengthAt(position = 1) : number {
    return this._curveMapper.lengthAt(position);
  }

  /**
   * Interpolate a point at the given position.
   * @param position position on curve (0..1)
   * @param target optional target
   */
  getPointAt<T extends VectorType>(position:number, target: T) : T
  getPointAt(position:number) : Vector
  getPointAt(position:number, target?:VectorType) : Vector {
    return this._getPointAtT(this.getT(position), target);
  }

  /**
   * Get the tangent at the given position.
   * @param position position on curve (0 - 1)
   * @param target optional target
   */
  getTangentAt<T extends VectorType>(position:number, target: T) : T
  getTangentAt(position: number) : Vector
  getTangentAt(position: number, target?: VectorType) : Vector {
    const t = clamp(this.getT(position), 0, 1);
    const tan = this._curveMapper.evaluateForT(derivativeAtT, t, target);
    return normalize(tan);
  }

  /**
   * Get the normal for 2D or 3D curve at the given position. In 3D the normal
   * points towards the center of the curvature.
   * @param position position on curve (0 - 1)
   * @param target optional target
   */
  getNormalAt<T extends VectorType>(position:number, target: T) : T
  getNormalAt(position: number) : Vector
  getNormalAt(position: number, target?: VectorType) : Vector {
    const t = clamp(this.getT(position), 0, 1);
    const dt = normalize(this._curveMapper.evaluateForT(derivativeAtT, t));

    if (dt.length < 2 || dt.length > 3) return undefined;

    const normal = target ? target : new Array(dt.length);
    if (dt.length === 2) {
      normal[0] = -dt[1];
      normal[1] = dt[0];
      return normal;
    }
    const ddt = normalize(this._curveMapper.evaluateForT(secondDerivativeAtT, t));

    return normalize(cross(cross(dt, ddt), dt), normal);
  }

  /**
   * Finds the curvature and radius at the specified position (0..1) on the curve. The unsigned curvature
   * is returned along with radius, tangent vector and, for 2D and 3D curves, a direction vector is included
   * (which points toward the center of the curvature).
   * @param position position on curve (0 - 1)
   * @returns object containing the unsigned curvature, radius + tangent and direction vectors
   */
  getCurvatureAt(position: number) {
    const t = clamp(this.getT(position), 0.0, 1.0);

    const dt = this._curveMapper.evaluateForT(derivativeAtT, t);
    const ddt = this._curveMapper.evaluateForT(secondDerivativeAtT, t);

    const tangent = normalize(dt, []);

    let curvature = 0, direction: Vector = undefined;

    if (dt.length === 2) {
      const denominator = Math.pow(dt[0] * dt[0] + dt[1] * dt[1], 3 / 2);
      if (denominator !== 0) {
        const signedCurvature = (dt[0] * ddt[1] - dt[1] * ddt[0]) / denominator;
        direction = signedCurvature < 0 ? [tangent[1], -tangent[0]] : [-tangent[1], tangent[0]]
        curvature = Math.abs(signedCurvature);
      }
    } else if (dt.length === 3) {
      const a = magnitude(dt);
      const cp = cross(dt, ddt);
      direction = normalize(cross(cp, dt))
      if (a !== 0) {
        curvature = magnitude(cp) / Math.pow(a, 3);
      }
    } else {
      const a = magnitude(dt);
      const b = magnitude(ddt);

      const denominator = Math.pow(a, 3);
      const dotProduct = dot(dt, ddt);
      if (denominator !== 0) {
        curvature = Math.sqrt(Math.pow(a, 2) * Math.pow(b, 2) - Math.pow(dotProduct, 2)) / denominator;
      }
    }
    const radius = curvature !== 0 ? 1 / curvature : 0;

    return { curvature, radius, tangent, direction };
  }

  /**
   * Get a bounding box for the curve or the segment given by the
   * from and to parameters
   * @param from position from
   * @param to position to
   */
  getBoundingBox(from = 0, to = 1) : BBox {
    if (from === 0 && to === 1 && this._bbox) {
      return this._bbox;
    }

    const min = [];
    const max = [];

    const t0 = this.getT(from), t1 = this.getT(to);

    const start = this._getPointAtT(t0);
    const end = this._getPointAtT(t1);

    const nPoints = this.closed ? this.points.length : this.points.length - 1;

    const i0 = Math.floor(nPoints * t0);
    const i1 = Math.ceil(nPoints * t1);

    for (let c = 0; c < start.length; c++) {
      min[c] = Math.min(start[c], end[c]);
      max[c] = Math.max(start[c], end[c]);
    }

    for (let i = i0 + 1; i <= i1; i++) {
      const [,, p2] = getControlPoints(i - 1, this.points, this.closed);

      if (i < i1) {
        for (let c = 0; c < p2.length; c++) {
          if (p2[c] < min[c]) min[c] = p2[c];
          if (p2[c] > max[c]) max[c] = p2[c];
        }
      }

      if (this.tension < 1) {
        const w0 = nPoints * t0 - (i - 1);
        const w1 = nPoints * t1 - (i - 1);

        const valid = (t: number) => t > -EPS && t <= 1 + EPS && (i - 1 !== i0 || t > w0) && (i !== i1 || t < w1);
        const coefficients = this._curveMapper.getCoefficients(i - 1);
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
    const bbox = { min, max };
    if (from === 0 && to === 1) this._bbox = bbox;

    return bbox;
  }

  /**
   * Get uniformaly sampled points along the curve. Returns samples + 1 points.
   * @param samples number of samples (segments)
   * @param returnType optional return type
   * @param from start at position
   * @param to end at position
   */
  getPoints<T extends VectorType>(samples:number, returnType: { new() : T }) : T[]
  getPoints<T extends VectorType>(samples:number, returnType: { new() : T }, from:number) : T[]
  getPoints<T extends VectorType>(samples:number, returnType: { new() : T }, from:number, to:number) : T[]
  getPoints()
  getPoints(samples:number)
  getPoints(samples:number, returnType: null, from:number, to:number) : Vector[]
  getPoints(samples = 100, returnType?: { new() : VectorType }, from = 0, to = 1) : Vector[] {
    if (!samples || samples <= 0) throw Error('Invalid arguments passed to getPoints(). You must specify at least 1 sample/segment.')
    if (from < 0 || to > 1 || to < from) return undefined;

    const pts = [];

    for (let d = 0; d <= samples; d++) {
      const u = from === 0 && to === 1 ?
        d / samples : from + ((d / samples) * (to - from));
      pts.push(this.getPointAt(u, returnType && new returnType()));
    }
    return pts;
  }

  /**
   * Find point(s) on the curve intersected by the given value along a given axis
   * @param v lookup value
   * @param axis index of axis [0=x, 1=y, 2=z ...]
   * @param max max solutions (i.e. 0=all, 1=first along curve, -1=last along curve)
   */
  lookup(v:number, axis = 0, max = 0, margin:number = this._lmargin) : Vector[] | Vector {
    const k = axis;
    const solutions = [];
    const nPoints = this.closed ? this.points.length : this.points.length - 1;

    for (let i = 0; i < nPoints && (max === 0 || solutions.length < Math.abs(max)); i += 1) {
      const idx = (max < 0 ? nPoints - (i + 1) : i);

      const [, p1, p2] = getControlPoints(idx, this.points, this.closed);
      const coefficients = this._curveMapper.getCoefficients(idx);

      let vmin: number, vmax: number;
      if (p1[k] < p2[k]) {
        vmin = p1[k];
        vmax = p2[k];
      } else {
        vmin = p2[k];
        vmax = p1[k];
      }

      if (v - margin <= vmax && v + margin >= vmin) {
        const ts = findRootsOfT(v, coefficients[k]);

        // sort on t to solve in order of curve length if max != 0
        if (max < 0) ts.sort((a, b) => b - a);
        else if (max >= 0) ts.sort((a, b) => a - b);

        for (let j = 0; j < ts.length; j++) {
          if (ts[j] === 0 && i > 0) continue; // avoid duplicate (0 would be found as 1 in previous iteration)
          const coord = [];
          for (let c = 0; c < coefficients.length; c++) {
            let val: number;
            if (c !== k) {
              val = valueAtT(ts[j], coefficients[c]);
            } else {
              val = v;
            }
            coord[c] = val;
          }
          solutions.push(coord);

          if (max !== 0 && solutions.length === Math.abs(max)) break;
        }
      }
    }

    return Math.abs(max) === 1 && solutions.length === 1 ? solutions[0] : solutions;
  }

  /**
   * Find positions (0-1) on the curve intersected by the given value along a given axis
   * @param v lookup value
   * @param axis index of axis [0=x, 1=y, 2=z ...]
   * @param max max solutions (i.e. 0=all, 1=first along curve, -1=last along curve)
   */
  lookupPositions(v:number, axis = 0, max = 0, margin:number = this._lmargin) : number[] {
    const k = axis;
    const solutions = new Set<number>();
    const nPoints = this.closed ? this.points.length : this.points.length - 1;

    for (let i = 0; i < nPoints && (max === 0 || solutions.size < Math.abs(max)); i += 1) {
      const idx = (max < 0 ? this.points.length - i : i);

      const [, p1, p2] = getControlPoints(i, this.points, this.closed);
      const coefficients = this._curveMapper.getCoefficients(i);

      let vmin: number, vmax: number;
      if (p1[k] < p2[k]) {
        vmin = p1[k];
        vmax = p2[k];
      } else {
        vmin = p2[k];
        vmax = p1[k];
      }

      if (v - margin <= vmax && v + margin >= vmin) {
        const ts = findRootsOfT(v, coefficients[k]);
        // sort on t to solve in order of curve length if max != 0
        if (max < 0) ts.sort((a, b) => b - a);
        else if (max >= 0) ts.sort((a, b) => a - b);

        for (let j = 0; j < ts.length; j++) {
          if (ts[j] === 0 && i > 0) continue; // avoid duplicate (0 would be found as 1 in previous iteration)
          const nt = (ts[j] + idx) / nPoints; // normalize t
          solutions.add(nt);

          if (max !== 0 && solutions.size === Math.abs(max)) break;
        }
      }
    }
    return Array.from(solutions).map(t => this._curveMapper.getU(t));
  }


  /**
   * Invalidates/clears cache
   */
  private _invalidateCache() {
    this._bbox = null;
    return this;
  }

  /**
   * Reset any pre-calculated/cached data
   */
  reset() {
    this._curveMapper.reset();
  }

  get points() { return this._curveMapper.points; }

  set points(pts:Vector[]) { this._curveMapper.points = pts; }

  get tension() { return this._curveMapper.tension; }

  set tension(t:number) { this._curveMapper.tension = t; }

  get alpha() { return this._curveMapper.alpha; }

  set alpha(a:number) { this._curveMapper.alpha = a; }

  get closed() { return this._curveMapper.closed; }

  set closed(isClosed:boolean) { this._curveMapper.closed = isClosed; }

  get length() {
    return this._curveMapper.lengthAt(1);
  }

  get minX() {
    const bbox = this.getBoundingBox();
    return bbox.min[0];
  }

  get maxX() {
    const bbox = this.getBoundingBox();
    return bbox.max[0];
  }

  get minY() {
    const bbox = this.getBoundingBox();
    return bbox.min[1];
  }

  get maxY() {
    const bbox = this.getBoundingBox();
    return bbox.max[1];
  }

  get minZ() {
    const bbox = this.getBoundingBox();
    return bbox.min[2];
  }

  get maxZ() {
    const bbox = this.getBoundingBox();
    return bbox.max[2];
  }
}

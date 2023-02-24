import {
  getControlPoints,
} from './core/spline-curve';

import {
  cross,
  distance,
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
import { clamp, copyValues } from './core/utils';

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
  _cache = new Map<string, object>();

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
   * Returns the time on curve at a position, given as a value between 0 and 1
   * @param position position on curve (0..1)
   * @param clampInput whether the input value should be clamped to a valid range or not
   */
  getTimeFromPosition(position:number, clampInput = false) : number {
    return this._curveMapper.getT(clampInput ? clamp(position, 0, 1) : position);
  }

  /**
   * Returns the normalized position u for a normalized time value t
   * @param t time on curve (0..1)
   * @param clampInput whether the input value should be clamped to a valid range or not
   * @returns position (u)
   */
  getPositionFromTime(t:number, clampInput = false) : number {
    return this._curveMapper.getU(clampInput ? clamp(t, 0, 1) : t);
  }

  /**
   * Returns the normalized position u for the specified length
   * @param t time on curve (0..1)
   * @param clampInput whether the input value should be clamped to a valid range or not
   * @returns position (u)
   */
  getPositionFromLength(length:number, clampInput = false) : number {
    const l = clampInput ? clamp(length, 0, this.length) : length;
    return this._curveMapper.getU(l / this.length);
  }

  /**
   *
   * @param position position on curve (0..1)
   * @returns length from start to position
   */
  getLengthAt(position = 1, clampInput = false) : number {
    return this._curveMapper.lengthAt(clampInput ? clamp(position, 0, 1) : position);
  }

  /**
   * Returns the time (t) of the knot at the specified index
   * @param index index of knot (control/input point)
   * @returns time (t)
   */
  getTimeAtKnot(index: number) : number {
    if (index < 0 || index > this.points.length - 1) throw Error('Invalid index!');
    if (index === 0) return 0; // first knot
    if (!this.closed && index === this.points.length - 1) return 1; // last knot

    const nCount = this.closed ? this.points.length : this.points.length - 1;

    return index / nCount;
  }

  /**
   * Returns the position (u) of the knot at the specified index
   * @param index index of knot (control/input point)
   * @returns position (u)
   */
  getPositionAtKnot(index: number) : number {
    return this.getPositionFromTime(this.getTimeAtKnot(index));
  }

  /**
   * Get the point along the curve corresponding to the value of t (time along curve)
   * This function is only useful when you need to address the curve by time, where time
   * will vary depending on segment length and curvature. To address the curve normalized
   * for length (constant speed and uniform spacing), use the getPointAt function instead.
   * @param t time along full curve (encodes segment index and segment t)
   * @param target optional target vector
   * @returns position as vector
   */
  getPointAtTime(t: number, target?: VectorType) : Vector {
    t = clamp(t, 0.0, 1.0);
    if (t === 0) {
      return copyValues(this.points[0], target);
    } else if (t === 1) {
      return copyValues(this.closed ? this.points[0] : this.points[this.points.length - 1], target);
    }
    return this._curveMapper.evaluateForT(valueAtT, t, target);
  }

  /**
   * Interpolate a point at the given position.
   * @param position position on curve (0..1)
   * @param target optional target
   */
  getPointAt<T extends VectorType>(position:number, target: T) : T
  getPointAt(position:number) : Vector
  getPointAt(position:number, target?:VectorType) : Vector {
    return this.getPointAtTime(this.getTimeFromPosition(position), target);
  }

  /**
   * Get the tangent at the given position.
   * @param position position on curve (0 - 1)
   * @param target optional target
   */
  getTangentAt<T extends VectorType>(position:number, target: T) : T
  getTangentAt(position: number) : Vector
  getTangentAt(position: number, target?: VectorType) : Vector {
    const t = clamp(this.getTimeFromPosition(position), 0, 1);
    return this.getTangentAtTime(t, target);
  }

  /**
   * Get the tangent at the given time.
   * @param t time at curve (0 - 1)
   * @param target optional target
   */
  getTangentAtTime<T extends VectorType>(t:number, target: T) : T
  getTangentAtTime(t: number) : Vector
  getTangentAtTime(t: number, target?: VectorType) : Vector {
    const dt = this._curveMapper.evaluateForT(derivativeAtT, t, target);
    return normalize(dt);
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
    const t = clamp(this.getTimeFromPosition(position), 0, 1);
    return this.getNormalAtTime(t, target);
  }

  /**
   * Get the normal for 2D or 3D curve at the given time (t). In 3D the normal
   * points towards the center of the curvature.
   * @param t time at curve (0 - 1)
   * @param target optional target
   */
  getNormalAtTime<T extends VectorType>(t:number, target: T) : T
  getNormalAtTime(t: number) : Vector
  getNormalAtTime(t: number, target?: VectorType) : Vector {
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
    const t = clamp(this.getTimeFromPosition(position), 0.0, 1.0);
    return this.getCurvatureAtTime(t);
  }

  /**
   * Finds the curvature and radius at the specified time (0..1) on the curve. The unsigned curvature
   * is returned along with radius, tangent vector and, for 2D and 3D curves, a direction vector is included
   * (which points toward the center of the curvature).
   * @param t time (t) along curve (0 - 1)
   * @returns object containing the unsigned curvature, radius + tangent and direction vectors
   */
  getCurvatureAtTime(t: number) {
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
   * Get the derivative at the given position.
   * @param position position on curve (0 - 1)
   * @param target optional target
   */
  getDerivativeAt<T extends VectorType>(position:number, target: T) : T
  getDerivativeAt(position: number) : Vector
  getDerivativeAt(position: number, target?: VectorType) : Vector {
    const t = clamp(this.getTimeFromPosition(position), 0, 1);
    const dt = this._curveMapper.evaluateForT(derivativeAtT, t, target);
    return dt;
  }

  /**
   * Get the second derivative at the given position.
   * @param position position on curve (0 - 1)
   * @param target optional target
   */
  getSecondDerivativeAt<T extends VectorType>(position:number, target: T) : T
  getSecondDerivativeAt(position: number) : Vector
  getSecondDerivativeAt(position: number, target?: VectorType) : Vector {
    const t = clamp(this.getTimeFromPosition(position), 0, 1);
    const ddt = this._curveMapper.evaluateForT(secondDerivativeAtT, t, target);
    return ddt;
  }

  /**
   * Get a bounding box for the curve or the segment given by the
   * from and to parameters
   * @param from position from
   * @param to position to
   */
  getBoundingBox(from = 0, to = 1) : BBox {
    if (from === 0 && to === 1 && this._cache.has('bbox')) {
      return this._cache.get('bbox') as BBox;
    }

    const min = [];
    const max = [];

    const t0 = this.getTimeFromPosition(from), t1 = this.getTimeFromPosition(to);

    const start = this.getPointAtTime(t0);
    const end = this.getPointAtTime(t1);

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
    if (from === 0 && to === 1) this._cache.set('bbox', bbox);

    return bbox;
  }

  /**
   * Get uniformly sampled points along the curve. Returns samples + 1 points.
   * @param segments number of samples (segments)
   * @param returnType optional return type
   * @param from start at position
   * @param to end at position
   */
  getPoints<T extends VectorType>(segments:number, returnType: { new() : T }) : T[]
  getPoints<T extends VectorType>(segments:number, returnType: { new() : T }, from:number) : T[]
  getPoints<T extends VectorType>(segments:number, returnType: { new() : T }, from:number, to:number) : T[]
  getPoints()
  getPoints(segments:number)
  getPoints(segments:number, returnType: null, from:number, to:number) : Vector[]
  getPoints(segments = 100, returnType?: { new() : VectorType }, from = 0, to = 1) : Vector[] {
    if (!segments || segments <= 0) throw Error('Invalid arguments passed to getPoints(). You must specify at least 1 sample/segment.')
    if (from < 0 || to > 1 || to < from) return undefined;

    const pts = [];

    for (let d = 0; d <= segments; d++) {
      const u = from === 0 && to === 1 ?
        d / segments : from + ((d / segments) * (to - from));
      pts.push(this.getPointAt(u, returnType && new returnType()));
    }
    return pts;
  }

  /**
   * Get the nearest position on the curve from a point. This is an approximation and its
   * accuracy is determined by the threshold value (smaller number requires more passes but is more precise)
   * @param point Vector
   * @param threshold Precision
   * @returns Object with position (u), distance and the point at u/t
   */
  getNearestPosition(point: Vector, threshold = 0.00001, samples?: number) : { u: number, point: Vector, distance: number } {
    if (threshold <= 0 || !Number.isFinite(threshold)) throw Error('Invalid threshold. Must be a number greater than zero!');

    samples = samples || 10 * this.points.length - 1;
    const pu:VectorType = new Array(point.length) as unknown as VectorType;
    let minDist = Infinity;
    let minU = 0;

    const lut = this.createLookupTable(u => this.getPointAt(u), samples, { cacheKey: `lut_nearest_${samples}` });

    // first pass: find the closest point out of uniform samples along the curve
    Array.from(lut.keys()).forEach(key => {
      const c = lut.get(key);
      const dist = distance(point, c);
      if (dist < minDist) {
        minDist = dist;
        minU = key;
        return true;
      }
    });

    let minT = this.getTimeFromPosition(minU);

    const bisect = (t:number) => {
      if (t >= 0 && t <= 1) {
        this.getPointAtTime(t, pu);
        const dist = distance(point, pu);
        if (dist < minDist) {
          minDist = dist;
          minT = t;
          return true;
        }
      }
    }

    const count = 100;
    // second pass: iteratively refine solution until we reach desired precision.
    let step = 1 / (count * 2);
    while (step > threshold) {
      if (!bisect(minT - step) && !bisect(minT + step))
        step /= 2;
    }

    minU = this._curveMapper.getU(minT);

    return { u: minU, distance: minDist, point: pu };
  }

  /**
  * Find points on the curve intersecting a specific value along a given axis. The axis is given as
  * an index from 0 - n, i.e. 0 = x-axis, 1 = y-axis, 2 = z-axis etc.
  *
  * The max parameter is used to specify the maximum number of solutions you want returned, where max=0
  * returns all solutions and a negative number will return the max number of solutions starting from
  * the end of the curve and a positive number starting from the beginning of the curve. Note that If
  * max = 1 or -1, this function returns the point (unwrapped) or null if no intersects exist. In any
  * other case an array will be returned, regardless of there's multiple, a single or no solutions.
  * @param v lookup value
  * @param axis index of axis [0=x, 1=y, 2=z ...]
  * @param max max solutions (i.e. 0=all, 1=first along curve, -1=last along curve)
  */
  getIntersects(v:number, axis = 0, max = 0, margin:number = this._lmargin) : Vector[] | Vector {
    const solutions = this.getIntersectsAsTime(v, axis, max, margin).map(t => this.getPointAtTime(t));
    return Math.abs(max) === 1 ? (solutions.length === 1 ? solutions[0] : null) : solutions;
  }

  /**
   * Find positions (0-1) on the curve intersected by the given value along a given axis
   * @param v lookup value
   * @param axis index of axis [0=x, 1=y, 2=z ...]
   * @param max max solutions (i.e. 0=all, 1=first along curve, -1=last along curve)
   */
  getIntersectsAsPositions(v:number, axis = 0, max = 0, margin:number = this._lmargin) : number[] {
    return this.getIntersectsAsTime(v, axis, max, margin).map(t => this.getPositionFromTime(t));
  }

  /**
   * Find intersects as time (0-1) on the curve intersected by the given value along a given axis
   * @param v lookup value
   * @param axis index of axis [0=x, 1=y, 2=z ...]
   * @param max max solutions (i.e. 0=all, 1=first along curve, -1=last along curve)
   */
  getIntersectsAsTime(v:number, axis = 0, max = 0, margin:number = this._lmargin) : number[] {
    const k = axis;
    const solutions = new Set<number>();
    const nPoints = this.closed ? this.points.length : this.points.length - 1;

    for (let i = 0; i < nPoints && (max === 0 || solutions.size < Math.abs(max)); i += 1) {
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
          const nt = (ts[j] + idx) / nPoints; // normalize t
          solutions.add(nt);

          if (max !== 0 && solutions.size === Math.abs(max)) break;
        }
      }
    }
    return Array.from(solutions);
  }

  /**
   * Create and cache a lookup table of n=samples points, indexed by position (u)
   * @param func function generating lookup table value
   * @param samples number of samples (segments)
   * @param options object of { from, to, cacheKey } - if cacheKey is included, the map will be stored in the internal cache
   * @returns Map of positions -> points
   */
  createLookupTable<T>(func: (u:number) => T, samples: number, options?: { from?: number, to?: number, cacheKey?: string }) : Map<number, T> {
    if (!samples || samples <= 1) throw Error('Invalid arguments passed to createLookupTable(). You must specify at least 2 samples.')
    const { from, to, cacheKey } = {
      from: 0,
      to: 1,
      ...options,
    };
    
    if (from < 0 || to > 1 || to < from) return undefined;    

    let lut = null;

    if (!cacheKey || !this._cache.has(cacheKey)) {
      lut = new Map();

      for (let d = 0; d < samples; d++) {
        const u = from === 0 && to === 1 ?
          d / (samples - 1) : from + ((d / (samples - 1)) * (to - from));
        const value = func(u);
        lut.set(u, value);
      }
      if (cacheKey) this._cache.set(cacheKey, lut);
    } else if (cacheKey && this._cache.has(cacheKey)) {
      lut = this._cache.get(cacheKey) as Map<number, T>;
    }

    return lut;
  }

  /**
   * Convenience function for iterating over multiple values for a set of samples along the curve.
   * The forEach function takes a user defined callback function, which will be called for each position
   * along the curve with its position (u), time (t), sample index (i) and the previous mapped value (prev)
   * @param func callback function
   * @param samples number of (evenly spaced) samples OR an array of user specified positions (u)
   * @param from from position
   * @param to to position
   * @returns array of mapped objects
   */
  forEach<T>(func: ({ u, t, i, prev }) => T, samples: (number | number[]), from = 0, to = 1) : void {
    let positions = [];
    if (Number.isFinite(samples)) {
      if (samples <= 1) throw Error('Invalid arguments passed to forEach(). You must specify at least 2 samples.')
      const nSamples = samples as number;
      for (let i = 0; i < samples; i++) {
        const u = from === 0 && to === 1 ?
          i / (nSamples - 1) : from + ((i / (nSamples - 1)) * (to - from));
        positions.push(u);
      }
    } else if(Array.isArray(samples)) {
      positions = samples;
    }

    let prev = null;
    positions.forEach((u, i) => {
      if (!Number.isFinite(u) || u < 0 || u > 1) throw Error('Invalid position (u) for sample in forEach!');
      const t = this.getTimeFromPosition(u);
      const current = func({ u, t, i, prev });
      prev = { u, t, i, value: current };
    });
  }

  /**
   * Convenience function for returning multiple values for a set of samples along the curve.
   * The map function takes a user defined mapping function, which will be called for each position
   * along the curve with its position (u), time (t), sample index (i) and the previous mapped value (prev)
   * @param func mapping function
   * @param samples number of (evenly spaced) samples OR an array of user specified positions (u)
   * @param from from position
   * @param to to position
   * @returns array of mapped objects
   */
  map<T>(func: ({ u, t, i, prev }) => T, samples: (number | number[]), from = 0, to = 1) : T[] {
    let positions = [];
    if (Number.isFinite(samples)) {
      if (samples <= 1) throw Error('Invalid arguments passed to map(). You must specify at least 2 samples.')
      const nSamples = samples as number;
      for (let i = 0; i < samples; i++) {
        const u = from === 0 && to === 1 ?
          i / (nSamples - 1) : from + ((i / (nSamples - 1)) * (to - from));
        positions.push(u);
      }
    } else if(Array.isArray(samples)) {
      positions = samples;
    }

    let prev = null;
    return positions.map((u, i) => {
      if (!Number.isFinite(u) || u < 0 || u > 1) throw Error('Invalid position (u) for sample in map()!');
      const t = this.getTimeFromPosition(u);
      const current = func({ u, t, i, prev });
      prev = { u, t, i, value: current };
      return current;
    });
  }

  /**
   * Convenience function for reducing multiple values for a set of samples along the curve.
   * This function takes a user defined reduce function, which will be called for each position
   * along the curve with its position (u), time (t), sample index (i) and the previous mapped value (prev)
   * @param func reduce function
   * @param initialValue initial accumulator value
   * @param samples number of (evenly spaced) samples OR an array of user specified positions (u)
   * @param from from position
   * @param to to position
   * @returns array of mapped objects
   */
  reduce<T>(func: ({ acc, u, t, i }) => T, initialValue:T, samples: (number | number[]), from = 0, to = 1) : T {
    let positions = [];
    if (Number.isFinite(samples)) {
      if (samples <= 1) throw Error('Invalid arguments passed to map(). You must specify at least 2 samples.')
      const nSamples = samples as number;
      for (let i = 0; i < samples; i++) {
        const u = from === 0 && to === 1 ?
          i / (nSamples - 1) : from + ((i / (nSamples - 1)) * (to - from));
        positions.push(u);
      }
    } else if(Array.isArray(samples)) {
      positions = samples;
    }

    return positions.reduce((acc, u, i) => {
      if (!Number.isFinite(u) || u < 0 || u > 1) throw Error('Invalid position (u) for sample in map()!');
      const t = this.getTimeFromPosition(u);
      return func({ acc, u, t, i });
    }, initialValue);
  }


  /**
   * Invalidates/clears cache
   */
  private _invalidateCache() {
    this._cache = new Map<string, object>();
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

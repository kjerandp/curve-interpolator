import {
  getPointAtT,
  getTangentAtT,
  getBoundingBox,
  valuesLookup,
  getArcLengths,
  getUtoTmapping,
  positionsLookup,
} from './core';

import {
  normalize,
} from './math';

import {
  BBox,
  Vector,
  VectorType,
  CurveOptions,
} from './interfaces';

/**
 * Extrapolates input array if points have length less than 4 by copying first and last
 * points, so there is a minimum of 4 control points (required to do cubic spline calculations)
 * @param args input array
 */
function extrapolateArgs(args:Vector[]) : Vector[] {
  if (args.length < 4) {
    args.unshift(args[0]);
  }
  while (args.length < 4) {
    args.push(args[args.length - 1]);
  }
  return args;
}

export interface CurveInterpolatorOptions extends CurveOptions {
  arcDivisions?: number,
  lmargin?: number,
}

/**
 * Cubic curve interpolator
 */
export default class CurveInterpolator {
  _lmargin: number;
  _points: Vector[];
  _tension: number;
  _arcDivisions: number;
  _closed: boolean;
  _cache: { arcLengths?: number[], bbox?: BBox; };

  /**
   * Create a new interpolator instance
   * @param points control points
   * @param options curve interpolator options
   */
  constructor(points:Vector[], options: CurveInterpolatorOptions = {}) {
    options = {
      tension: 0.5,
      arcDivisions: 300,
      closed: false,
      ...options,
    };

    this._cache = {};
    this._tension = options.tension;
    this._arcDivisions = options.arcDivisions;
    this._lmargin = options.lmargin || 1 - this._tension;
    this._closed = options.closed;

    this.points = points;
  }

  /**
   * Returns the time on curve at a position, given as a value between 0 and 1
   * @param position position on curve
   */
  getT(position:number) : number {
    return getUtoTmapping(
      position,
      this.arcLengths,
    );
  }

  /**
   * Interpolate a point at the given position.
   * @param position position on curve (0 - 1)
   * @param target optional target
   */
  getPointAt<T extends VectorType>(position:number, target: T) : T
  getPointAt(position:number) : Vector
  getPointAt(position:number, target?:VectorType) : Vector {
    const options = {
      tension: this.tension,
      closed: this.closed,
    };
    return getPointAtT(this.getT(position), this.points, options, target);
  }

  /**
   * Get the tangent at the given position.
   * @param position position on curve (0 - 1)
   * @param target optional target
   */
  getTangentAt<T extends VectorType>(position:number, target: T) : T
  getTangentAt(position: number) : Vector
  getTangentAt(position: number, target:Vector = null) : Vector {
    const tan = getTangentAtT(
      this.getT(position),
      this.points,
      { tension: this.tension, closed: this.closed },
      target,
    );
    return normalize(tan);
  }

  /**
   * Get a bounding box for the curve or the segment given by the
   * from and to parameters
   * @param from position from
   * @param to position to
   */
  getBoundingBox(from:number = 0, to:number = 1) : BBox {
    if (from === 0 && to === 1 && this._cache.bbox) {
      return this._cache.bbox;
    }

    const bbox = getBoundingBox(
      this.points,
      {
        from,
        to,
        tension: this.tension,
        closed: this.closed,
        arcLengths: this.arcLengths,
      },
    );
    if (from === 0 && to === 1) this._cache.bbox = bbox;

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
  getPoints(samples:number)
  getPoints(samples:number, returnType: null, from:number, to:number) : Vector[]
  getPoints(samples:number = 100, returnType?: { new() : VectorType }, from:number = 0, to:number = 1) : Vector[] {
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
  lookup(v:number, axis:number = 0, max:number = 0, margin:number = this._lmargin) : Vector[] | Vector {
    const matches = valuesLookup(
      v,
      this.points,
      {
        axis,
        tension: this.tension,
        closed: this.closed,
        max,
        margin,
      },
    );

    return Math.abs(max) === 1 && matches.length === 1 ? matches[0] : matches;
  }

  /**
   * Find positions (0-1) on the curve intersected by the given value along a given axis
   * @param v lookup value
   * @param axis index of axis [0=x, 1=y, 2=z ...]
   * @param max max solutions (i.e. 0=all, 1=first along curve, -1=last along curve)
   */
  lookupPositions(v:number, axis:number = 0, max:number = 0, margin:number = this._lmargin) : number[] {
    const matches = positionsLookup(
      v,
      this.points,
      {
        axis,
        arcLengths: this.arcLengths,
        tension: this.tension,
        closed: this.closed,
        max,
        margin,
      },
    );

    return matches;
  }

  /**
   * Invalidates/clears cache
   */
  invalidateCache() {
    Object.keys(this._cache).forEach(key => {
      delete this._cache[key];
    });
    return this;
  }

  get points() { return this._points; }
  get tension() { return this._tension; }
  get closed() { return this._closed; }
  get arcDivisions() { return this._arcDivisions; }

  get arcLengths() {
    if (this._cache.arcLengths) {
      return this._cache.arcLengths;
    }
    const arcLengths = getArcLengths(
      this.points,
      this.arcDivisions,
      { tension: this.tension, closed: this.closed },
    );
    this._cache.arcLengths = arcLengths;
    return arcLengths;
  }

  get length() {
    const lengths = this.arcLengths;
    return lengths[lengths.length - 1];
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

  set points(pts:Vector[]) {
    if (pts.length > 0 && pts.length < 4) {
      pts = extrapolateArgs(pts);
    }
    this._points = pts;
    this.invalidateCache();
  }

  set tension(t:number) {
    if (t !== this._tension) {
      this._tension = t;
      this.invalidateCache();
    }
  }

  set arcDivisions(n:number) {
    if (n !== this._arcDivisions) {
      this._arcDivisions = n;
      this.invalidateCache();
    }
  }

  set closed(isClosed:boolean) {
    if (isClosed !== this._closed) {
      this._closed = isClosed;
      this.invalidateCache();
    }
  }
}

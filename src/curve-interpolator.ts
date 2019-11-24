import {
  getPointAtT,
  getTangentAtT,
  getNormalAtT,
  getAngleAtT,
  getBoundingBox,
  valuesLookup,
  getArcLengths,
  getUtoTmapping,
} from './core';

import {
  normalize,
} from './math';

import {
  BBox,
  Vector,
  VectorType,
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


/**
 * Cubic curve interpolator
 */
export default class CurveInterpolator {
  _lmargin: number;
  _points: Vector[];
  _tension: number;
  _arcDivisions: number;
  _cache: { arcLengths?: number[], bbox?: BBox; };

  /**
   * Create a new interpolator instance
   * @param points control points
   * @param tension curve tension (0 = Catmull-Rom, 1 = linear)
   * @param arcDivisions number of segments used to estimate curve length
   */
  constructor(points:Vector[], tension = 0.5, arcDivisions = 300) {
    this._cache = {};
    this.tension = tension;
    this.arcDivisions = arcDivisions;
    this.points = points;
    this._lmargin = 0.5;
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
    return getPointAtT(this.getT(position), this.points, this.tension, target);
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
      this.tension,
      target,
    );
    return normalize(tan);
  }

  /**
   * Get the normal at the given position.
   * @param position position on curve (0 - 1)
   * @param target optional target
   */
  getNormalAt<T extends VectorType>(position:number, target: T) : T
  getNormalAt(position: number) : Vector
  getNormalAt(position:number, target?:Vector) : Vector {
    const nrm = getNormalAtT(
      this.getT(position),
      this.points,
      this.tension,
      target,
    );
    return normalize(nrm);
  }

  /**
   * Get the angle (in radians) at the given position.
   * @param position position on curve (0 - 1)
   * @param target optional target
   */
  getAngleAt(position:number) : number {
    const angle = getAngleAtT(
      this.getT(position),
      this.points,
      this.tension,
    );
    return angle;
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
        tension: this.tension,
        from,
        to,
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
  getPoints(samples:number = 100, returnType?: { new() : VectorType }, from:number = 0, to:number = 1, ) : Vector[] {
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
   * Find at which value(s) of x the curve is intersected by the given value
   * along the y-axis
   * @param y value at y-axis
   * @param max max solutions (i.e. 0=all, 1=first along curve, -1=last along curve)
   */
  x(y:number, max:number = 0) : number[] | number {
    const matches = valuesLookup(
      y,
      this.points,
      {
        axis: 1,
        tension: this.tension,
        max,
        margin: this._lmargin,
      },
    ) as number[];

    return Math.abs(max) === 1 ? matches[0] : matches;
  }

  /**
   * Find at which value(s) of y the curve is intersected by the given value
   * along the x-axis
   * @param x value at x-axis
   * @param max max solutions (i.e. 0=all, 1=first along curve, -1=last along curve)
   */
  y(x: number, max:number = 0) : number[] | number {
    const matches = valuesLookup(
      x,
      this.points,
      {
        axis: 0,
        tension: this.tension,
        max,
        margin: this._lmargin,
      },
    ) as number[];

    return Math.abs(max) === 1 ? matches[0] : matches;
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
  get arcDivisions() { return this._arcDivisions; }

  get arcLengths() {
    if (this._cache.arcLengths) {
      return this._cache.arcLengths;
    }
    const arcLengths = getArcLengths(this.points, this.arcDivisions, this.tension);
    this._cache.arcLengths = arcLengths;
    return arcLengths;
  }

  get length() {
    const lengths = this.arcLengths;
    return lengths[lengths.length - 1];
  }

  get minX() {
    const bbox = this.getBoundingBox();
    return bbox.x1;
  }

  get maxX() {
    const bbox = this.getBoundingBox();
    return bbox.x2;
  }

  get minY() {
    const bbox = this.getBoundingBox();
    return bbox.y1;
  }

  get maxY() {
    const bbox = this.getBoundingBox();
    return bbox.y2;
  }

  set points(pts:Vector[]) {
    if (pts.length > 0 && pts.length < 4) {
      pts = extrapolateArgs(pts);
    }
    this.invalidateCache();
    this._points = pts;
  }

  set tension(t:number) {
    if (t !== this._tension) {
      this.invalidateCache();
      this._tension = t;
    }
  }
  set arcDivisions(n:number) {
    if (n !== this._arcDivisions) {
      this._arcDivisions = n;
      this.invalidateCache();
    }
    this._arcDivisions = n;
  }
}

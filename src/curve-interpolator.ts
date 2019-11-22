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
  _cache: { arcLengths: number[]; };

  constructor(points, tension = 0.5, arcDivisions = 300) {
    this._cache = {
      arcLengths: undefined,
    };
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

  getPointAt<T extends VectorType>(position:number, target: T) : T
  getPointAt(position:number) : Vector
  getPointAt(position:number, target?:VectorType) : Vector {
    return getPointAtT(this.getT(position), this.points, this.tension, target);
  }

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

  getAngleAt(position:number) : number {
    const angle = getAngleAtT(
      this.getT(position),
      this.points,
      this.tension,
    );
    return angle;
  }

  getBoundingBox(from:number = 0, to:number = 1) : BBox {
    return getBoundingBox(
      this.points,
      {
        tension: this.tension,
        from,
        to,
        arcLengths: this.arcLengths,
      },
    );
  }

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

  set points(pts:Vector[]) {
    if (pts.length > 0 && pts.length < 4) {
      pts = extrapolateArgs(pts);
    }
    this._points = pts;
  }

  set tension(t:number) {
    if (t !== this._tension) {
      this._tension = t;
      delete this._cache.arcLengths;
    }
  }
  set arcDivisions(n:number) {
    if (n !== this._arcDivisions) {
      this._arcDivisions = n;
      delete this._cache.arcLengths;
    }
    this._arcDivisions = n;
  }
}

import {
  getPointAtU,
  getTangentAtU,
  getNormalAtU,
  getAngleAtU,
  getBoundingBox,
  BBox,
  valuesLookup,
  getArcLengths,
} from './core';

import {
  normalize,
} from './math';

function extrapolateArgs(args:number[][]) : number[][] {
  if (args.length < 4) {
    args.unshift(args[0]);
  }
  while (args.length < 4) {
    args.push(args[args.length - 1]);
  }
  return args;
}

export default class CurveInterpolator {
  lmargin: number;
  _points: any;
  _tension: any;
  _arcDivisions: any;
  _cache: { arcLengths: any; };

  constructor(points, tension = 0.5, arcDivisions = 300) {
    this._cache = {
      arcLengths: undefined,
    };
    this.tension = tension;
    this.arcDivisions = arcDivisions;
    this.points = points;

    this.lmargin = 0.5;
  }

  getPointAt(position:number) : number[] {
    return getPointAtU(
      position,
      this.points,
      this.tension,
      this.arcLengths,
    );
  }

  getPoints(samples:number = 100, from:number = 0, to:number) : number[][] {

    if (from < 0 || to > 1 || to < from) return undefined;

    const pts = new Array(samples + 1);

    for (let d = 0; d <= samples; d++) {
      const u = from === 0 && to === 1 ?
        d / samples : from + ((d / samples) * (to - from));
      pts[d] = this.getPointAt(u);
    }
    return pts;
  }

  getTangentAt(position: number) : number[] {
    const tan = getTangentAtU(
      position,
      this.points,
      this.tension,
      this.arcLengths,
    );
    return normalize(tan);
  }

  getNormalAt(position:number) : number[] {
    const nrm = getNormalAtU(
      position,
      this.points,
      this.tension,
      this.arcLengths,
    );
    return normalize(nrm);
  }

  getAngleAt(position:number) : number {
    const angle = getAngleAtU(
      position,
      this.points,
      this.tension,
      this.arcLengths,
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

  x(y:number, max:number = 0) : number[] | number {
    const matches = valuesLookup(
      y,
      this.points,
      {
        axis: 1,
        tension: this.tension,
        max,
        margin: this.lmargin,
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
        margin: this.lmargin,
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

  set points(pts:number[][]) {
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

import { CurveMapper, NumArray4, Vector } from "../core/interfaces";
import { copyValues } from "../core/utils";
import { getControlPoints, getSegmentIndexAndT } from "../core/spline-curve";
import { calculateCoefficients, derivativeAtT, evaluateForT, valueAtT } from "../core/spline-segment";
import { clamp } from "../core/utils";

export abstract class AbstractCurveMapper implements CurveMapper {
  _subDivisions: number;
  _cache: object;
  _points: Vector[];
  _alpha = 0.0;
  _tension = 0.5;
  _closed = false;
  _onInvalidateCache: () => void = null;

  constructor(onInvalidateCache: () => void = null) {
    this._onInvalidateCache = onInvalidateCache;
    this._cache = {
      arcLengths: null,
      coefficients: null,
    };
  }

  protected _invalidateCache() : void {
    if (!this.points) return;
    this._cache = {
      arcLengths: null,
      coefficients: null,
    };
    if (this._onInvalidateCache) this._onInvalidateCache();
  }

  abstract lengthAt(u: number) : number;
  abstract getT(u: number) : number;
  abstract getU(t: number) : number;

  get alpha() { return this._alpha; }
  get tension() { return this._tension; }
  get points() { return this._points; }
  get closed() { return this._closed; }

  getPointAtT(t: number, target?: Vector) : Vector {
    t = clamp(t, 0.0, 1.0);
    if (t === 0) {
      return copyValues(this.points[0], target);
    } else if (t === 1) {
      return copyValues(this.closed ? this.points[0] : this.points[this.points.length - 1], target);
    }
    const { index, weight } = getSegmentIndexAndT(t, this.points, this.closed);
    const coefficients = this.getCoefficients(index);
    return evaluateForT(valueAtT, weight, coefficients, target);
  }

  getTangentAtT(t: number, target?: Vector) : Vector {
    t = clamp(t, 0.0, 1.0);
    const { index, weight } = getSegmentIndexAndT(t, this.points, this.closed);
    const coefficients = this.getCoefficients(index);
    return evaluateForT(derivativeAtT, weight, coefficients, target);
  }

  getCoefficients(idx: number) {
    if (!this.points) return undefined;
    if (!this._cache['coefficients']) {
      this._cache['coefficients'] = new Map<number, NumArray4[]>();
    }
    if (!this._cache['coefficients'].has(idx)) {
      const [p0, p1, p2, p3] = getControlPoints(idx, this.points, this.closed);
      const coefficients = calculateCoefficients(p0, p1, p2, p3, { tension: this.tension, alpha: this.alpha });
      this._cache['coefficients'].set(idx, coefficients);
    }
    return this._cache['coefficients'].get(idx);
  }

  setPoints(points: Vector[]) : void {
    if (!points || points.length < 2) throw Error('At least 2 control points are required!');
    this._points = points;
    this._invalidateCache();
  }

  setAlpha(alpha: number) : void {
    if (Number.isFinite(alpha) && alpha !== this._alpha) {
      this._invalidateCache();
      this._alpha = alpha;
    }
  }

  setTension(tension: number) : void {
    if (Number.isFinite(tension) && tension !== this._tension) {
      this._invalidateCache();
      this._tension = tension;
    }
  }

  setClosed(closed: boolean) : void {
    closed = !!closed;
    if (this._closed !== closed) {
      this._invalidateCache();
      this._closed = closed;
    }
  }
}

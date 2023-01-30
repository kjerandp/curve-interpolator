import { CurveMapper, NumArray4, Vector } from "../core/interfaces";
import { copyValues } from "../core/utils";
import { getControlPoints, getSegmentIndexAndT } from "../core/spline-curve";
import { calculateCoefficients, derivativeAtT, evaluateForT, valueAtT } from "../core/spline-segment";
import { clamp } from "../core/utils";

/**
 * The curve mapper's main responsibility is to map between normalized
 * curve position (u) to curve segments and segment position (t). Since
 * it requires access to control points and curve parameters, it also keeps
 * this data along with an internal cache. For this reason, the common
 * functionality has been but into this abstract class definition, so that
 * the mapping specific implementation can be held at a minimum by extending
 * this class.
 */
export abstract class AbstractCurveMapper implements CurveMapper {
  _subDivisions: number;
  _cache: object;
  _points: Vector[];
  _alpha = 0.0;
  _tension = 0.5;
  _closed = false;
  _onInvalidateCache: () => void = null;

  /**
   * AbstractCurveMapper Constructor
   * @param onInvalidateCache callback function to be invoked when cache needs to be reset
   */
  constructor(onInvalidateCache: () => void = null) {
    this._onInvalidateCache = onInvalidateCache;
    this._cache = {
      arcLengths: null,
      coefficients: null,
    };
  }

  /**
   * Clears cache and invoke callback if provided
   * @returns void
   */
  protected _invalidateCache() : void {
    if (!this.points) return;
    this._cache = {
      arcLengths: null,
      coefficients: null,
    };
    if (this._onInvalidateCache) this._onInvalidateCache();
  }

  /**
   * Returns the curve length in point coordinates from the global
   * curve position u, where u=1 is the full length of the curve.
   * @param u normalized position on curve (0..1)
   */
  abstract lengthAt(u: number) : number;
  abstract getT(u: number) : number;
  abstract getU(t: number) : number;

  /**
   * Curve alpha parameter (0=uniform, 0.5=centripetal, 1=chordal)
   */
  get alpha() { return this._alpha; }
  set alpha(alpha: number) {
    if (Number.isFinite(alpha) && alpha !== this._alpha) {
      this._invalidateCache();
      this._alpha = alpha;
    }
  }

  /**
   * Curve tension (0=Catmull-rom, 1=linear)
   */
  get tension() { return this._tension; }
  set tension(tension: number) {
    if (Number.isFinite(tension) && tension !== this._tension) {
      this._invalidateCache();
      this._tension = tension;
    }
  }

  /**
   * Control points for curve
   */
  get points() { return this._points; }
  set points(points: Vector[]) {
    if (!points || points.length < 2) throw Error('At least 2 control points are required!');
    this._points = points;
    this._invalidateCache();
  }

  /**
   * Determines whether the curve should be a closed curve or not
   */
  get closed() { return this._closed; }
  set closed(closed: boolean) {
    closed = !!closed;
    if (this._closed !== closed) {
      this._invalidateCache();
      this._closed = closed;
    }
  }

  /**
   * Get the point along the curve corresponding to the value of t
   * @param t time along full curve (encodes segment index and segment t)
   * @param target optional target vector
   * @returns position as vector
   */
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

  /**
   * Get the tangent along the curve corresponding to the value of t. Note
   * that this function does not return a normalized tangent vector!
   * @param t time along full curve (encodes segment index and segment t)
   * @param target optional target vector
   * @returns tangent as vector
   */
  getTangentAtT(t: number, target?: Vector) : Vector {
    t = clamp(t, 0.0, 1.0);
    const { index, weight } = getSegmentIndexAndT(t, this.points, this.closed);
    const coefficients = this.getCoefficients(index);
    return evaluateForT(derivativeAtT, weight, coefficients, target);
  }

  /**
   * Get the curve function coefficients at the given segment index. The coefficients
   * are calculated once per segment and put in cache until it is invalidated.
   * @param idx segment index
   * @returns coefficients for the curve function at the given segment index
   */
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
}

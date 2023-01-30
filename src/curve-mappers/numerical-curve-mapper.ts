import { AbstractCurveMapper } from "./abstract-curve-mapper";
import { SplineSegmentOptions } from "../core/interfaces";
import { getGaussianQuadraturePointsAndWeights } from "./gauss";
import { derivativeAtT, evaluateForT } from "../core/spline-segment";
import { magnitude } from "../core/math";
import { binarySearch } from "../core/utils";

export interface CurveLengthCalculationOptions extends SplineSegmentOptions {
  /* Gaussian quadrature weights and abscissae */
  gauss?: [number[], number[]];
  /* from t along arc */
  t0?: number,
  /* to t along arc */
  t1?: number,
}

/**
 * This curve mapper implementation uses a numerical integration method (Gauss Legendre)
 * in order to approximate curve segment lengths. For re-parameterization of the curve
 * function in terms of arc length, a number of precalculated lengths (samples) is used
 * to fit a monotone piecewise cubic function using the approach suggested here:
 * https://stackoverflow.com/questions/35275073/uniform-discretization-of-bezier-curve
 */
export class NumericalCurveMapper extends AbstractCurveMapper {
  _nSamples = 21;
  _gauss: number[][];

  /**
   *
   * @param onInvalidateCache callback function to be invoked when cache is invalidated
   * @param nQuadraturePoints the number of Gauss-Legendre Quadrature points to use for arc length approximation
   * @param nInverseSamples the number of arc length samples to use to fit an inverse function for calculating t from arc length
   */
  constructor(nQuadraturePoints = 24, nInverseSamples = 21, onInvalidateCache?: () => void) {
    super(onInvalidateCache);
    this._gauss = getGaussianQuadraturePointsAndWeights(nQuadraturePoints);
    this._nSamples = nInverseSamples;
  }

  /**
   * Clear cache
   */
  override _invalidateCache() {
    super._invalidateCache();
    this._cache['arcLengths'] = null;
    this._cache['samples'] = null;
  }

  get arcLengths() {
    if (!this._cache['arcLengths']) {
      this._cache['arcLengths'] = this.computeArcLengths();
    }
    return this._cache['arcLengths'];
  }

  /**
   * Get samples for inverse function from cache if present, otherwise calculate and put
   * in cache for re-use.
   * @param idx curve segment index
   * @returns Lengths, slopes and coefficients for inverse function
   */
  getSamples(idx: number) : [number[], number[], number[], number[]] {
    if (!this.points) return undefined;
    if (!this._cache['samples']) {
      this._cache['samples'] = new Map<number, [number[], number[], number[], number[]]>();
    }
    if (!this._cache['samples'].has(idx)) {
      const samples = this._nSamples;
      const lengths: number[] = [], slopes: number[] = [];
      const coefficients = this.getCoefficients(idx);
      for (let i = 0; i < samples; ++i) {
        const ti = i / (samples - 1);
        lengths.push(this.computeArcLength(idx, 0.0, ti));
        const dtln = magnitude(evaluateForT(derivativeAtT, ti, coefficients));
        slopes.push(dtln === 0 ? 0 : 1 / dtln);
      }

      // Precalculate the cubic interpolant coefficients
      const nCoeff = samples - 1;
      const dis = [];  // degree 3 coefficients
      const cis = [];  // degree 2 coefficients
      let li_prev = lengths[0];
      let tdi_prev = slopes[0];
      const step = 1.0 / nCoeff;

      for (let i = 0; i < nCoeff; ++i) {
        const li = li_prev;
        li_prev = lengths[i+1];
        const lDiff = li_prev - li;
        const tdi = tdi_prev;
        const tdi_next = slopes[i+1];
        tdi_prev = tdi_next;
        const si = step / lDiff;
        const di = (tdi + tdi_next - 2 * si) / (lDiff * lDiff);
        const ci = (3 * si - 2 * tdi - tdi_next) / lDiff;
        dis.push(di);
        cis.push(ci);
      }

      this._cache['samples'].set(idx, [lengths, slopes, cis, dis]);
    }
    return this._cache['samples'].get(idx);
  }

  /**
   * Computes the arc length of a curve segment
   * @param index index of curve segment
   * @param t0 calculate length from t
   * @param t1 calculate length to t
   * @returns arc length between t0 and t1
   */
  computeArcLength(index: number, t0 = 0.0, t1 = 1.0) : number {
    const coefficients = this.getCoefficients(index);
    const z = (t1 - t0) * 0.5;

    let sum = 0;
    for (let i = 0; i < this._gauss.length; i++ ) {
      const [T, C] = this._gauss[i];
      const t = z * T + z + t0;
      const dtln = magnitude(evaluateForT(derivativeAtT, t, coefficients));
      sum += C * dtln;
    }
    return z * sum;
  }

  /**
   * Calculate a running sum of arc length for mapping a position on the curve (u)
   * to the position at the corresponding curve segment (t).
   * @returns array with accumulated curve segment arc lengths
   */
  computeArcLengths() : number[] {
    if (!this.points) return undefined;
    const lengths = [];
    lengths.push(0);

    const nPoints = this.closed ? this.points.length : this.points.length - 1;
    let tl = 0;
    for (let i = 0; i < nPoints; i++) {
      const length = this.computeArcLength(i);
      tl += length;
      lengths.push(tl);
    }
    return lengths;
  }

  /**
   * Calculate t from arc length for a curve segment
   * @param idx segment index
   * @param len length
   * @returns time (t) along curve segment matching the input length
   */
  inverse(idx: number, len: number) : number {
    const nCoeff = this._nSamples - 1;
    const step = 1.0 / nCoeff;
    const [lengths, slopes, cis, dis] = this.getSamples(idx);
    const length = lengths[lengths.length - 1];

    if (len >= length) {
      return 1.0;
    }

    if (len <= 0) {
      return 0.0;
    }

    // Find the cubic segment which has 'len'
    const i = Math.max(0, binarySearch(len, lengths));
    const ti = i * step;
    if (lengths[i] === len) {
      return ti;
    }
    const tdi = slopes[i];
    const di = dis[i];
    const ci = cis[i];
    const ld = len - lengths[i];

    return ((di * ld + ci) * ld + tdi) * ld + ti;
  }

  /**
   * Get curve length at u
   * @param u normalized uniform position along the spline curve
   * @returns length in point coordinates
   */
  lengthAt(u: number) : number {
    return u * this.arcLengths[this.arcLengths.length - 1];
  }

  /**
   * Maps a uniform time along the curve to non-uniform time (t)
   * @param u normalized uniform position along the spline curve
   * @returns t encoding segment index and local time along curve
   */
  getT(u: number) : number {
    const arcLengths = this.arcLengths;
    const il = arcLengths.length;
    const targetArcLength = u * arcLengths[il - 1];

    const i = binarySearch(targetArcLength, arcLengths);
    const ti = i / (il - 1);
    if (arcLengths[i] === targetArcLength) {
      return ti;
    }

    const len = targetArcLength - arcLengths[i];
    const fraction = this.inverse(i, len);
    return (i + fraction) / (il - 1);
  }

  /**
   * Maps a non-uniform time along the curve to uniform time (u)
   * @param t non-uniform time along curve
   * @returns uniform time along curve
   */
  getU(t: number) : number {
    if (t === 0) return 0;
    if (t === 1) return 1;

    const arcLengths = this.arcLengths;
    const al = arcLengths.length - 1;
    const totalLength = arcLengths[al];

    // need to denormalize t to find the matching length
    const tIdx = t * al;

    const subIdx = Math.floor(tIdx);
    const l1 = arcLengths[subIdx];

    if (tIdx === subIdx) return l1 / totalLength;

    const t0 = tIdx - subIdx;
    const fraction = this.computeArcLength(subIdx, 0, t0);

    return (l1 + fraction) / totalLength;
  }
}

import { AbstractCurveMapper } from "./abstract-curve-mapper";
import { SplineSegmentOptions } from "../core/interfaces";
import { getGaussianQuadraturePointsAndWeights } from "./gauss";
import { derivativeAtT, evaluateForT } from "../core/spline-segment";
import { length } from "../core/math";
import { binarySearch } from "../core/utils";

export interface CurveLengthCalculationOptions extends SplineSegmentOptions {
  /* Gaussian quadrature weights and abscissae */
  gauss?: [number[], number[]];
  /* from t along arc */
  t0?: number,
  /* to t along arc */
  t1?: number,
}

export class NumericalCurveMapper extends AbstractCurveMapper {
  _nSamples = 21;
  _gauss: number[][];

  constructor(onInvalidateCache?: () => void, order = 24, nSamples = 21) {
    super(onInvalidateCache);
    this._gauss = getGaussianQuadraturePointsAndWeights(order);
    this._nSamples = nSamples;
  }

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
        const dtln = length(evaluateForT(derivativeAtT, ti, coefficients));
        slopes.push(dtln === 0 ? 0 : 1 / dtln);
      }

      // Precalculate the cubic interpolant coefficients
      const nCoeff = samples - 1;
      const dis = [];  // degree 3 coeffiecients
      const cis = [];  // degree 2 coeffiecients
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

  computeArcLength(index: number, t0 = 0.0, t1 = 1.0) : number {
    const coefficients = this.getCoefficients(index);
    const z = (t1 - t0) * 0.5;

    let sum = 0;
    for (let i = 0; i < this._gauss.length; i++ ) {
      const [T, C] = this._gauss[i];
      const t = z * T + z + t0;
      const dtln = length(evaluateForT(derivativeAtT, t, coefficients));
      sum += C * dtln;
    }
    return z * sum;
  }

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

  lengthAt(u: number) : number {
    return u * this.arcLengths[this.arcLengths.length - 1];
  }

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

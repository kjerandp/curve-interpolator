import { AbstractCurveMapper } from "./abstract-curve-mapper";
import { Vector } from "../core/interfaces";
import { distance } from "../core/math";
import { binarySearch } from "../core/utils";

/**
 * Approximate spline curve by subdividing it into smaller linear
 * line segments. Used to approximate length and mapping between
 * uniform (u) and non-uniform (t) time along curve.
 */
export class LinearCurveMapper extends AbstractCurveMapper {

  _subDivisions: number;

  /**
   *
   * @param subDivisions number of sub divisions to use
   * @param onInvalidateCache callback function to be invoked when cache is invalidated
   */
  constructor(subDivisions = 300, onInvalidateCache: () => void = null) {
    super(onInvalidateCache);
    this._subDivisions = subDivisions;
  }

  get arcLengths() {
    if (!this._cache['arcLengths']) {
      this._cache['arcLengths'] = this.computeArcLengths();
    }
    return this._cache['arcLengths'];
  }

  /**
   * Clear cache
   */
  override _invalidateCache() {
    super._invalidateCache();
    this._cache['arcLengths'] = null;
  }

  /**
   * Break curve into segments and return the curve length at each segment index.
   * Used for mapping between t and u along the curve.
   */
  computeArcLengths() {
    const lengths = [];
    let current: Vector, last = this.getPointAtT(0);
    let sum = 0;

    lengths.push(0);

    for (let p = 1; p <= this._subDivisions; p++) {
      current = this.getPointAtT(p / this._subDivisions);
      sum += distance(current, last);
      lengths.push(sum);
      last = current;
    }
    return lengths;
  }

  /**
   * Get curve length at u
   * @param u normalized uniform position along the spline curve
   * @returns length in point coordinates
   */
  lengthAt(u: number) {
    const arcLengths = this.arcLengths;
    return u * arcLengths[arcLengths.length - 1];
  }

  /**
   * Maps a uniform time along the curve to non-uniform time (t)
   * @param u normalized uniform position along the spline curve
   * @returns t encoding segment index and local time along curve
   */
  getT(u: number) {
    const arcLengths = this.arcLengths;
    const il = arcLengths.length;
    const targetArcLength = u * arcLengths[il - 1];

    const i = binarySearch(targetArcLength, arcLengths);
    if (arcLengths[i] === targetArcLength) {
      return i / (il - 1);
    }

    // we could get finer grain at lengths, or use simple interpolation between two points
    const lengthBefore = arcLengths[i];
    const lengthAfter = arcLengths[i + 1];
    const segmentLength = lengthAfter - lengthBefore;

    // determine where we are between the 'before' and 'after' points
    const segmentFraction = (targetArcLength - lengthBefore) / segmentLength;

    // add that fractional amount to t
    return (i + segmentFraction) / (il - 1);
  }

  /**
   * Maps a non-uniform time along the curve to uniform time (u)
   * @param t non-uniform time along curve
   * @returns uniform time along curve
   */
  getU(t: number) {
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

    // measure the length between t0 at subIdx and t
    const t0 = subIdx / al;
    const p0 = this.getPointAtT(t0);
    const p1 = this.getPointAtT(t);
    const l = l1 + distance(p0, p1);

    //const l2 = arcLengths[subIdx + 1];
    //const l = l1 + (tIdx - subIdx) * (l2 - l1);

    return l / totalLength;

  }
}

import CurveInterpolator from '../curve-interpolator';
import { Vector, VectorType, BBox } from '../core/interfaces';
import { orthogonal, normalize } from '../core/math';

/**
 * Bounding box interface
 */
export interface BBoxLegacy extends BBox {
  x1: number,
  y1: number,
  x2: number,
  y2: number,
}

/**
 * @deprecated Use CurveInterpolator
 * Legacy support for v1 interface (2d curves)
 */
export default class CurveInterpolator2D extends CurveInterpolator {
  constructor(points: Vector[], tension = 0.5, arcDivisions = 300, closed = false, alpha = 0) {
    super(points.map(p => [p[0], p[1]]), { tension, alpha, arcDivisions, closed });
  }

  /**
   * Find at which value(s) of x the curve is intersected by the given value
   * along the y-axis
   * @param y value at y-axis
   * @param max max solutions (i.e. 0=all, 1=first along curve, -1=last along curve)
   */
  x(y: number, max = 0, margin: number = this._lmargin) : number | number[] {
    const res = this.lookup(y, 1, max, margin);

    if (Math.abs(max) === 1) {
      return res[0] as number;
    }
    return (res as number[]).map(d => d[0]);
  }

  /**
   * Find at which value(s) of y the curve is intersected by the given value
   * along the x-axis
   * @param x value at x-axis
   * @param max max solutions (i.e. 0=all, 1=first along curve, -1=last along curve)
   */
  y(x: number, max = 0, margin: number = this._lmargin) : number | number[] {
    const res = this.lookup(x, 0, max, margin);

    if (Math.abs(max) === 1) {
      return res[1] as number;
    }
    return (res as number[]).map(d => d[1]);
  }

  /**
   * Get the normal at the given position.
   * @param position position on curve (0 - 1)
   * @param target optional target
   */
  getNormalAt<T extends VectorType>(position:number, target: T) : T
  getNormalAt(position: number) : Vector
  getNormalAt(position:number, target?:Vector) : Vector {
    const tan = this.getTangentAt(position, target as VectorType);
    const nrm = orthogonal(tan);
    return normalize(nrm);
  }

  /**
   * Get the angle (in radians) at the given position.
   * @param position position on curve (0 - 1)
   * @param target optional target
   */
  getAngleAt(position:number) : number {
    const tan = this.getTangentAt(position);
    return Math.atan2(tan[1], tan[0]);
  }

  /**
   * Get a bounding box for the curve or the segment given by the
   * from and to parameters
   * @param from position from
   * @param to position to
   */
  getBoundingBox(from = 0, to = 1) : BBoxLegacy {
    const bbox = super.getBoundingBox(from, to);

    return {
      x1: bbox.min[0],
      x2: bbox.max[0],
      y1: bbox.min[1],
      y2: bbox.max[1],
      min: bbox.min,
      max: bbox.max,
    };
  }
}

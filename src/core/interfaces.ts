/**
 * Array of four number items
 */
export type NumArray4 = [number, number, number, number];

/**
 * Either a number array or an object implementing the VectorType interface
 */
export type Vector = (number[] | VectorType);

export type SegmentFunction = (t: number, coefficients: NumArray4) => number;
export interface CurveMapper {
  alpha: number,
  tension: number,
  points: Vector[],
  closed: boolean,

  evaluateForT: (func:SegmentFunction, t:number, target?:VectorType) => Vector,
  lengthAt: (u: number) => number,
  getT: (u: number) => number,
  getU: (t: number) => number,
  getCoefficients: (idx: number) => NumArray4[],
  reset: () => void,
}

/**
 * Any objects that supports indexing values by number may be used as input or return types.
 * See the Point class for an example.
 */
export interface VectorType {
  0: number,
  1: number,
  2?: number,
  3?: number,
  x?: number,
  y?: number,
  z?: number,
  w?: number,
  length: number,
}

export interface CurveParameters {
  /* curve tension (0 = Catmull-Rom curve, 1 = linear curve) */
  tension?: number,
  /* curve velocity vector modifier (0 = uniform, 0.5 = centripetal, 1 = chordal */
  alpha?: number,
}

/**
 * Options required to perform calculations on a curve segment.
 */
export interface SplineSegmentOptions extends CurveParameters {
  knotSequence?: NumArray4,
  target?: Vector,
}

/**
 * Spline Curve characteristics
 */
export interface SplineCurveOptions extends CurveParameters {
  /* flag to set if the curve should be closed or not */
  closed?: boolean,
}

/**
 * Used by the valuesLookup function to set axis, tension etc.
 */
export interface LookupOptions extends SplineCurveOptions {
  axis?: number,
  margin?: number,
  max?: number,
  processRefAxis?: boolean,
}

/**
 * Used by the positions lookup function
 */
export interface PositionLookupOptions extends SplineCurveOptions {
  axis?: number,
  margin?: number,
  max?: number,
}

/**
 * Bounding box interface
 */
export interface BBox {
  min: Vector,
  max: Vector,
}

/**
 * Options to control calculation of bounding box
 */
export interface BBoxOptions extends SplineCurveOptions{
  from?: number,
  to?: number,
}

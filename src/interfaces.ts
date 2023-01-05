/**
 * Array of four number items
 */
export type NumArray4 = [number, number, number, number];

/**
* Plugs point values into the derivative of the spline equation and return the result
* @param t interpolation time
* @param tension curve tension
* @param v0 value of first control point
* @param v1 value of second control point
* @param v2 value of third control point
* @param v3 value of fourth control point
* @param timeDeltas time deltas to use for curve velocity vectors
*/
export type PointFunction = (t: number, tension: number, timeDeltas: NumArray4, v0: number, v1: number, v2: number, v3: number, idx?: number) => number;

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

/**
 * Either a number array or an object implementing the VectorType interface
 */
export type Vector = (number[] | VectorType);

/**
 * Curve characteristics
 */
export interface CurveOptions {
  /* curve tension (0 = Catmull-Rom curve, 1 = linear curve) */
  tension?: number,
  /* curve velocity vector modifier (0 = uniform, 0.5 = centrepetal, 1 = chordal */
  alpha?: number,
  /* flag to set if the curve should be closed or not */
  closed?: boolean,
}

/**
 * Used by getPointAtT to control curve characteristics and
 * which function to use to process the curve coordinates.
 */
export interface InterpolationOptions extends CurveOptions {
  func?: PointFunction,
}

/**
 * Used by the valuesLookup function to set axis, tension etc.
 */
export interface LookupOptions extends CurveOptions {
  axis?: number,
  margin?: number,
  max?: number,
  func?: PointFunction,
  processRefAxis?: boolean,
}

/**
 * Used by the positions lookup function
 */
export interface PositionLookupOptions extends CurveOptions {
  axis?: number,
  margin?: number,
  max?: number,
  arcDivisions?: number,
  arcLengths?: number[],
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
export interface BBoxOptions extends CurveOptions{
  from?: number,
  to?: number,
  arcDivisions?: number,
  arcLengths?: number[],
}

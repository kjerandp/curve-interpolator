/**
* Plugs point values into the derivative of the spline equation and return the result
* @param t interpolation time
* @param tension curve tension
* @param v0 value of first control point
* @param v1 value of second control point
* @param v2 value of third control point
* @param v3 value of fourth control point
*/
export type PointFunction = (t: number, tension: number, v0: number, v1: number, v2: number, v3: number, idx?: number) => number;

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
 * Used by the valuesLookup function to set axis, tension etc.
 */
export interface LookupOptions {
  axis?: number,
  tension?: number,
  margin?: number,
  max?: number,
  func?: PointFunction,
  processRefAxis?: boolean,
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
export interface BBoxOptions {
  tension?: number,
  from?: number,
  to?: number,
  arcDivisions?: number,
  arcLengths?: number[],
}

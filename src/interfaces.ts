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

export interface VectorType {
  0: number,
  1: number,
  x?: number,
  y?: number,
}

export type Vector = (number[] | VectorType);

export interface LookupOptions {
  axis?: number,
  tension?: number,
  margin?: number,
  max?: number,
  func?: PointFunction,
  processXY?: boolean,
}

export interface BBox {
  x1: number,
  y1: number,
  x2: number,
  y2: number,
}

export interface BBoxOptions {
  tension?: number,
  from?: number,
  to?: number,
  arcDivisions?: number,
  arcLengths?: number[],
}

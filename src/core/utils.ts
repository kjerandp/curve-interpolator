import { Vector } from "./interfaces";

/**
 * Fill all components of a vector with a value
 * @param v vector
 * @param val fill value
 */
export function fill(v:Vector, val:number) : Vector {
  for (let i = 0; i < v.length; i++) {
    v[i] = val;
  }
  return v;
}

/**
 * Map all components of a vector using provided mapping function.
 * @param v vector
 * @param func mapping function
 */
export function map(v:Vector, func: (c:number, i:number) => number) : Vector {
  for (let i = 0; i < v.length; i++) {
    v[i] = func(v[i], i);
  }
  return v;
}

/**
 * Reduce a vector to a single value using the provided reduce function.
 * @param v vector
 * @param func reduce function
 * @param r initial value
 */
export function reduce(v:Vector, func: (s: number, c:number, i:number) => number, r = 0) : number {
  for (let i = 0; i < v.length; i++) {
    r = func(r, v[i], i);
  }
  return r;
}

/**
 * Copy values from one vector to another. If target is not provided it will be created.
 * @param source source vector
 * @param target target vector
 * @returns vector
 */
export function copyValues(source: Vector, target?: Vector) : Vector {
  target = target || new Array(source.length);
  for (let i = 0; i < source.length; i++) {
    target[i] = source[i];
  }
  return target;
}

/**
 * Reduce the set of coordinates for a curve by eliminating points that are not
 * contributing to the shape of the curve, i.e. multiple points making out a linear
 * segment.
 * @param inputArr set of coordinates
 * @param maxOffset threshold to use for determining if a point is part of a linear line segment
 * @param maxDistance points will not be removed if the distance equals or is greater than the given maxDistance
 */
export function simplify2d(inputArr:number[][], maxOffset = 0.001, maxDistance = 10) : number[][] {
  if (inputArr.length <= 4) return inputArr;
  const [o0, o1] = inputArr[0];
  const arr = inputArr.map(d => [d[0] - o0, d[1] - o1]);
  let [a0, a1] = arr[0];
  const sim = [inputArr[0]];

  for (let i = 1; i + 1 < arr.length; i++) {
    const [t0, t1] = arr[i];
    const [b0, b1] = arr[i + 1];

    if (b0 - t0 !== 0 || b1 - t1 !== 0) {
      // Proximity check
      const proximity =
        Math.abs(a0 * b1 - a1 * b0 + b0 * t1 - b1 * t0 + a1 * t0 - a0 * t1) /
        Math.sqrt((b0 - a0) ** 2 + (b1 - a1) ** 2);

      const dir = [a0 - t0, a1 - t1];
      const len = Math.sqrt(dir[0] ** 2 + dir[1] ** 2);

      if (proximity > maxOffset || len >= maxDistance) {
        sim.push([t0 + o0, t1 + o1]);
        [a0, a1] = [t0, t1];
      }
    }
  }
  const last = arr[arr.length - 1];
  sim.push([last[0] + o0, last[1] + o1]);

  return sim;
}

/**
 * Clamp an input value to min and max
 * @param value input value
 * @param min min value
 * @param max max value
 */
export function clamp(value:number, min = 0, max = 1) : number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

/**
 * Finds the index in accumulatedValues of the highest value that is less than or equal to targetValue
 * @param targetValue search term
 * @param accumulatedValues array of accumulated values to search in
 * @returns
 */
export function binarySearch(targetValue: number, accumulatedValues: number[]) {
  const min = accumulatedValues[0];
  const max = accumulatedValues[accumulatedValues.length - 1];
  if (targetValue >= max) {
    return accumulatedValues.length - 1;
  }

  if (targetValue <= min) {
    return 0;
  }

  let left = 0;
  let right = accumulatedValues.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const lMid = accumulatedValues[mid];

    if (lMid < targetValue) {
      left = mid + 1;
    } else if (lMid > targetValue) {
      right = mid - 1;
    } else {
      return mid;
    }
  }

  return Math.max(0, right);
}

import { solveForT } from './math';

/**
 *
 * @param t
 * @param points
 * @param tension
 * @param type
 * @param func
 */
export function getPointAtT<T>(t:number, points:Array<number[]|any>, tension:number, returnType: new(...args:any[]) => T, func:Function = solveForT) {
  const p = (points.length - 1) * t;
  const idx = Math.floor(p);
  const weight = p - idx;

  const p0 = points[idx === 0 ? idx : idx - 1];
  const p1 = points[idx];
  const p2 = points[idx > points.length - 2 ? points.length - 1 : idx + 1];
  const p3 = points[idx > points.length - 3 ? points.length - 1 : idx + 2];

  const x = func(weight, tension, p0[0], p1[0], p2[0], p3[0]);
  const y = func(weight, tension, p0[1], p1[1], p2[1], p3[1]);


  const point = new returnType(x, y);

  return point;
}

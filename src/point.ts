/**
 * Sample class that may be used as Return type.
 * @example interp.getPointAt(0.2, new Point());
 * @example interp.getPoints(1000, Point);
 */
export default class Point {
  x: number;
  y: number;

  constructor(x:number = 0, y:number = 0) {
    this.x = x;
    this.y = y;
  }

  get 0() {
    return this.x;
  }

  set 0(x:number) {
    this.x = x;
  }

  get 1() {
    return this.y;
  }

  set 1(y:number) {
    this.y = y;
  }
}

/**
 * Simple extension to array to allow accessing components by x and y
 * @example new Point(3, 4).y // returns 4
 * @example new Point().x = 3 // assign 3 to index 0
 */
export default class Point extends Array {
  /**
   * Create a new Point instance
   * @param x x coordinate
   * @param y y coordinate
   */
  constructor(x:number, y:number) {
    if (x !== undefined && y !== undefined) {
      super(...[x, y]);
    } else {
      super(2);
      super.fill(0);
    }
  }

  get x() {
    return this[0];
  }

  set x(x) {
    this[0] = x;
  }

  get y() {
    return this[1];
  }

  set y(y) {
    this[1] = y;
  }

}

import * as math from './mathHelper';

export default class CurveInterpolator {
  constructor(inpPoints, tension = 0, arcLengthDivisions = 300) {
    this.tension = tension;
    this.arcLengthDivisions = arcLengthDivisions;

    this.cache = {
      xLookup: {},
      yLookup: {},
      arcLengths: undefined,
    };

    if (inpPoints.length < 4) {
      throw new Error('You must provide a minimum of 4 controlpoints');
    }

    let points = inpPoints;
    if (Array.isArray(inpPoints[0])) {
      points = inpPoints.map(p => ({ x: p[0], y: p[1] }));
    }
    // get extent and cache ordering

    points.forEach((p) => {
      if (this.minX === undefined || p.x < this.minX) {
        this.minX = p.x;
      }
      if (this.maxX === undefined || p.x > this.maxX) {
        this.maxX = p.x;
      }
      if (this.minY === undefined || p.y < this.minY) {
        this.minY = p.y;
      }
      if (this.maxY === undefined || p.y > this.maxY) {
        this.maxY = p.y;
      }
    });

    this.dx = this.maxX - this.minX;
    this.dy = this.maxY - this.minY;

    // add points to cache
    points.forEach((p) => {
      this.cache.xLookup[p.x] = p.y;
      this.cache.yLookup[p.y] = p.x;
      return p;
    });

    this.points = points;
  }

  _getPoint(t) {
    const { points } = this;
    const p = (points.length - 1) * t;

    const intPoint = Math.floor(p);
    const weight = p - intPoint;

    const p0 = points[intPoint === 0 ? intPoint : intPoint - 1];
    const p1 = points[intPoint];
    const p2 = points[intPoint > points.length - 2 ? points.length - 1 : intPoint + 1];
    const p3 = points[intPoint > points.length - 3 ? points.length - 1 : intPoint + 2];

    return ({
      x: math.getPointOnCurve(weight, p0.x, p1.x, p2.x, p3.x, this.tension),
      y: math.getPointOnCurve(weight, p0.y, p1.y, p2.y, p3.y, this.tension),
    });
  }

  _getLengths(divisions) {
    if (divisions === undefined) divisions = this.arcLengthDivisions;

    if (this.cache.arcLengths &&
      (this.cache.arcLengths.length === divisions + 1)) {
      return this.cache.arcLengths;
    }

    const _cache = [];
    let current,
      last = this._getPoint(0);
    let p,
      sum = 0;

    _cache.push(0);

    for (p = 1; p <= divisions; p++) {
      current = this._getPoint(p / divisions);
      sum += math.getDistance(current, last);
      _cache.push(sum);
      last = current;
    }

    this.cache.arcLengths = _cache;

    return _cache; // { sums: cache, sum: sum }; Sum is in the last element.
  }

  _getLtoTmapping(l, distance) {
    const arcLengths = this._getLengths();
    let i = 0;
    const il = arcLengths.length;

    let targetArcLength; // The targeted l distance value to get

    if (distance) {
      targetArcLength = distance;
    } else {
      targetArcLength = l * arcLengths[il - 1];
    }

    // binary search for the index with largest value smaller than target l distance

    let low = 0,
      high = il - 1,
      comparison;

    while (low <= high) {
      i = Math.floor(low + (high - low) / 2);
      comparison = arcLengths[i] - targetArcLength;

      if (comparison < 0) {
        low = i + 1;
      } else if (comparison > 0) {
        high = i - 1;
      } else {
        high = i;
        break;
        // DONE
      }
    }

    i = high;

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
    const t = (i + segmentFraction) / (il - 1);

    return t;
  }

  _getTangent(t, p0, p1, p2, p3) {
    const v = ({
      x: math.derivativeOfT(t, p0.x, p1.x, p2.x, p3.x, this.tension),
      y: math.derivativeOfT(t, p0.y, p1.y, p2.y, p3.y, this.tension),
    });
    return v;
  }

  getLength() {
    const lengths = this._getLengths();
    const length = lengths[lengths.length - 1];
    return length;
  }

  getExtent() {
    return ({
      minX: this.minX,
      maxX: this.maxX,
      minY: this.minY,
      maxY: this.maxY,
    });
  }

  getPointAt(l, optionalTarget) {
    const t = this._getLtoTmapping(l);
    const p = this._getPoint(t, optionalTarget);

    return p;
  }

  getPoints(divisions = 10, from = 0, to = 1) {
    if (from < 0 || to > 1 || to < from) return undefined;
    const points = [];
    for (let d = 0; d <= divisions; d++) {
      const l = from === 0 && to === 1 ?
        d / divisions : from + ((d / divisions) * (to - from));
      points.push(this.getPointAt(l));
    }
    return points;
  }

  getTangentAt(l) {
    const t = this._getLtoTmapping(l);
    const { points } = this;
    const p = (points.length - 1) * t;

    const intPoint = Math.floor(p);
    const weight = p - intPoint;

    const p0 = points[intPoint === 0 ? intPoint : intPoint - 1];
    const p1 = points[intPoint];
    const p2 = points[intPoint > points.length - 2 ? points.length - 1 : intPoint + 1];
    const p3 = points[intPoint > points.length - 3 ? points.length - 1 : intPoint + 2];

    const tan = this._getTangent(weight, p0, p1, p2, p3);
    return math.normalizeVector(tan);
  }

  getNormalAt(l) {
    const tan = this.getTangentAt(l);
    return ({ x: tan.y, y: -tan.x });
  }

  getTangentAtX(x, isNormalized = false) {
    const nx = isNormalized ? math.denormalizeValue(x, this.dx, this.minX) : x;
    const cp = math.determineControlPointsFrom(this.points, nx, p => p.x);
    const roots = math.solveForT(cp.p0.x, cp.p1.x, cp.p2.x, cp.p3.x, nx, this.tension);
    const t = math.selectRootValue(roots);
    if (t !== undefined) {
      return this._getTangent(t, cp.p0, cp.p1, cp.p2, cp.p3);
    }
    throw new Error(`Unable to find tangent at x = ${x}`);
  }

  getTangentAtY(y, isNormalized = false) {
    const ny = isNormalized ? math.denormalizeValue(y, this.dy, this.minY) : y;
    const cp = math.determineControlPointsFrom(this.points, ny, p => p.y);
    const roots = math.solveForT(cp.p0.y, cp.p1.y, cp.p2.y, cp.p3.y, ny, this.tension);
    const t = math.selectRootValue(roots);
    if (t !== undefined) {
      return this._getTangent(t, cp.p0, cp.p1, cp.p2, cp.p3);
    }
    throw new Error(`Unable to find tanget at y = ${y}`);
  }

  y(x, isNormalized = false) {
    const nx = isNormalized ? math.denormalizeValue(x, this.dx, this.minX) : x;
    if (this.cache.xLookup[nx] !== undefined) {
      return this.cache.xLookup[nx];
    }
    const cp = math.determineControlPointsFrom(this.points, nx, p => p.x);
    const roots = math.solveForT(cp.p0.x, cp.p1.x, cp.p2.x, cp.p3.x, nx, this.tension);
    const t = math.selectRootValue(roots);
    if (t !== undefined) {
      const y = math.getPointOnCurve(t, cp.p0.y, cp.p1.y, cp.p2.y, cp.p3.y, this.tension);
      this.cache.xLookup[nx] = y;
      return y;
    }
    throw new Error(`Unable to solve for x = ${x}`);
  }

  x(y, isNormalized = false) {
    const ny = isNormalized ? math.denormalizeValue(y, this.dy, this.minY) : y;
    if (this.cache.yLookup[ny] !== undefined) {
      return this.cache.yLookup[ny];
    }
    const cp = math.determineControlPointsFrom(this.points, ny, p => p.y);
    const roots = math.solveForT(cp.p0.y, cp.p1.y, cp.p2.y, cp.p3.y, ny, this.tension);
    const t = math.selectRootValue(roots);
    if (t !== undefined) {
      const x = math.getPointOnCurve(t, cp.p0.x, cp.p1.x, cp.p2.x, cp.p3.x, this.tension);
      this.cache.yLookup[ny] = x;
      return x;
    }
    throw new Error(`Unable to solve for y = ${y}`);
  }

  getYfromX(x, isNormalized = false) {
    return this.y(x, isNormalized);
  }

  getXfromY(y, isNormalized = false) {
    return this.x(y, isNormalized);
  }

  normalizeX(x) {
    return math.normalizeValue(x, this.dx, this.minX);
  }

  normalizeY(y) {
    return math.normalizeValue(y, this.dy, this.minY);
  }

  denormalizeX(x) {
    return math.denormalizeValue(x, this.dx, this.minX);
  }

  denormalizeY(y) {
    return math.denormalizeValue(y, this.dy, this.minY);
  }
}

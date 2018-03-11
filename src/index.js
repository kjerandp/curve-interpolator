
import * as math from './mathHelper';

export default class CurveInterpolator {
  constructor(points, tension = 0, arcLengthDivisions = 300) {
    this.tension = tension;
    this.arcLengthDivisions = arcLengthDivisions;

    // get extent and cache ordering
    this.sortedX = points.map((p, i) => ({ v: p.x, i })).sort((a, b) => a.v > b.v);
    this.sortedY = points.map((p, i) => ({ v: p.y, i })).sort((a, b) => a.v > b.v);

    this.minX = this.sortedX[0].v;
    this.maxX = this.sortedX[this.sortedX.length - 1].v;

    this.minY = this.sortedY[0].v;
    this.maxY = this.sortedY[this.sortedY.length - 1].v;

    this.dx = this.maxX - this.minX;
    this.dy = this.maxY - this.minY;

    // normalize points
    this.convertionFactor = Math.sqrt((this.dx * this.dx + this.dy * this.dy) / 2);
    this.points = points.map(p => ({
      x: math.normalizeValue(p.x, this.dx, this.minX),
      y: math.normalizeValue(p.y, this.dy, this.minY),
    }));
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

    if (this.cacheArcLengths &&
      (this.cacheArcLengths.length === divisions + 1)) {
      return this.cacheArcLengths;
    }

    const cache = [];
    let current,
      last = this._getPoint(0);
    let p,
      sum = 0;

    cache.push(0);

    for (p = 1; p <= divisions; p++) {
      current = this._getPoint(p / divisions);
      sum += math.getDistance(current, last);
      cache.push(sum);
      last = current;
    }

    this.cacheArcLengths = cache;

    return cache; // { sums: cache, sum: sum }; Sum is in the last element.
  }

  _getUtoTmapping(u, distance) {
    const arcLengths = this._getLengths();
    let i = 0;
    const il = arcLengths.length;

    let targetArcLength; // The targeted u distance value to get

    if (distance) {
      targetArcLength = distance;
    } else {
      targetArcLength = u * arcLengths[il - 1];
    }

    // binary search for the index with largest value smaller than target u distance

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

  getLength() {
    const lengths = this._getLengths();
    const length = lengths[lengths.length - 1];
    return length * this.convertionFactor;
  }

  getExtent() {
    return ({
      minX: this.minX,
      maxX: this.maxX,
      minY: this.minY,
      maxY: this.maxY,
    });
  }

  getPointAt(u, optionalTarget) {
    const t = this._getUtoTmapping(u);
    return this._getPoint(t, optionalTarget);
  }

  getNormalizedPoints(divisions) {
    if (divisions === undefined) divisions = 5;
    const points = [];
    for (let d = 0; d <= divisions; d++) {
      points.push(this.getPointAt(d / divisions));
    }
    return points;
  }

  getPoints(divisions) {
    return this.getNormalizedPoints(divisions)
      .map(p => ({
        x: this.denormalizeX(p.x),
        y: this.denormalizeY(p.y),
      }));
  }

  getYfromX(x, isNormalized = false) {
    const nx = isNormalized ? x : math.normalizeValue(x, this.dx, this.minX);
    const cp = math.determineControlPointsFrom(this.points, nx, p => p.x);
    const coeff = math.getCoefficients(cp.p0.x, cp.p1.x, cp.p2.x, cp.p3.x, nx, this.tension);
    const roots = math.getCubicRoots(coeff.a, coeff.b, coeff.c, coeff.d);
    const rootMatch = roots.filter(r => r.real >= 0 && r.real < 1 && r.imag === 0);
    if (rootMatch.length === 1) {
      const t = rootMatch[0].real;
      const y = math.getPointOnCurve(t, cp.p0.y, cp.p1.y, cp.p2.y, cp.p3.y, this.tension);
      return math.denormalizeValue(y, this.dy, this.minY);
    }
    throw new Error(`Unable to solve for x = ${x}`);
  }

  getXfromY(y, isNormalized = false) {
    const ny = isNormalized ? y : math.normalizeValue(y, this.dy, this.minY);
    const cp = math.determineControlPointsFrom(this.points, ny, p => p.y);
    const coeff = math.getCoefficients(cp.p0.y, cp.p1.y, cp.p2.y, cp.p3.y, ny, this.tension);
    const roots = math.getCubicRoots(coeff.a, coeff.b, coeff.c, coeff.d);
    const rootMatch = roots.filter(r => r.real >= 0 && r.real < 1.00001 && r.imag === 0);
    if (rootMatch.length === 1) {
      const t = Math.min(rootMatch[0].real, 1.0);
      const x = math.getPointOnCurve(t, cp.p0.x, cp.p1.x, cp.p2.x, cp.p3.x, this.tension);
      return math.denormalizeValue(x, this.dx, this.minX);
    }
    throw new Error(`Unable to solve for y = ${y}`);
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

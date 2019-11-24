import 'mocha';
import { expect } from 'chai';
import Point from '../src/point';
import CurveInterpolator from '../src/curve-interpolator';
import { points } from './test-data';

const EPS = 0.000001;

describe('curve-interpolator.ts', () => {
  it('should be able to instantiate class', () => {
    let result = new CurveInterpolator(points);
    expect(result).to.be.instanceof(CurveInterpolator);
    expect(result.tension).to.eq(0.5);
    expect(result.arcDivisions).to.eq(300);

    result = new CurveInterpolator(points, 0);
    expect(result).to.be.instanceof(CurveInterpolator);
    expect(result.tension).to.eq(0);
    expect(result.arcDivisions).to.eq(300);

    result = new CurveInterpolator(points, 0, 500);
    expect(result).to.be.instanceof(CurveInterpolator);
    expect(result.tension).to.eq(0);
    expect(result.arcDivisions).to.eq(500);
  });

  it('should be able to calculate the correct length', () => {
    let interp = new CurveInterpolator(points);

    expect(interp.length).to.be.approximately(56.620776, EPS);

    const prevLength = interp.length;

    interp = new CurveInterpolator(points, 0);
    expect(interp.length).to.be.greaterThan(prevLength);

    interp = new CurveInterpolator(points, 1);
    expect(interp.length).to.be.lessThan(prevLength);

    interp = new CurveInterpolator(points, 0.5, 1000);
    expect(interp.length).to.be.greaterThan(prevLength);

    interp = new CurveInterpolator(points, 0.5, 100);
    expect(interp.length).to.be.lessThan(prevLength);
  });

  it('should be able to get points on curve', () => {
    const interp = new CurveInterpolator(points, 0);

    const result = interp.getPointAt(0.7, new Point());
    expect(result.x).to.approximately(11.024214, EPS);
    expect(result.y).to.approximately(2.0070842, EPS);
  });

  it('should be able to get multiple, evenly distributed points, on curve', () => {
    const interp = new CurveInterpolator(points, 0);

    const result = interp.getPoints(100, Point);
    expect(result.length).to.eq(101);
    expect(result[0].x).to.eq(points[0][0]);
    expect(result[0].y).to.eq(points[0][1]);
    expect(result[result.length - 1].x).to.eq(points[points.length - 1][0]);
    expect(result[result.length - 1].y).to.eq(points[points.length - 1][1]);
    result.every(r => expect(r).to.be.instanceof(Point));
  });

  it('should be able to get bounds of curve', () => {
    const interp = new CurveInterpolator(points, 0);

    const bbox = interp.getBoundingBox();
    expect(bbox.x1).to.eq(1);
    expect(bbox.x2).to.be.approximately(19.2422599, EPS);
    expect(bbox.y1).to.be.approximately(1.3872035, EPS);
    expect(bbox.y2).to.eq(18);

    expect(interp.minX).to.be.eq(bbox.x1);
    expect(interp.maxX).to.be.eq(bbox.x2);
    expect(interp.minY).to.be.eq(bbox.y1);
    expect(interp.maxY).to.be.eq(bbox.y2);

    expect(interp.x(interp.maxY, 1)).to.be.approximately(1, EPS);
    expect(interp.x(interp.minY, 1)).to.be.approximately(16.054653, EPS);
    expect(interp.y(interp.maxX, 1)).to.be.approximately(2.8918343, EPS);
    expect(interp.y(interp.minX, 1)).to.be.approximately(18, EPS);
  });

  it('should clear cache if new points, tension or arcDivisions are set', () => {
    const interp = new CurveInterpolator(points, 0);

    expect(Object.keys(interp._cache).length).to.eq(0);
    interp.getPoints(100, Point);
    expect(interp._cache.arcLengths).to.not.be.undefined;
    expect(interp._cache.bbox).to.be.undefined;
    interp.maxX;
    expect(interp._cache.bbox).to.not.be.undefined;
    interp.tension = 0; // value not changed
    expect(Object.keys(interp._cache).length).to.eq(2);
    interp.tension = 0.5;
    expect(Object.keys(interp._cache).length).to.eq(0);

  });
});


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


});


import 'mocha';
import { expect } from 'chai';
import Point from '../src/point';
import CurveInterpolator from '../src/curve-interpolator';
import { points } from './test-data';
import { compareNumArrays } from './test-utils';

const EPS = 0.000001;

describe('curve-interpolator.ts', () => {
  it('should be able to instantiate class', () => {
    let result = new CurveInterpolator(points);
    expect(result).to.be.instanceof(CurveInterpolator);
    expect(result.tension).to.eq(0.5);
    expect(result.arcDivisions).to.eq(300);

    result = new CurveInterpolator(points, { tension: 0, alpha: 0 });
    expect(result).to.be.instanceof(CurveInterpolator);
    expect(result.tension).to.eq(0);
    expect(result.arcDivisions).to.eq(300);

    result = new CurveInterpolator(points, { tension: 0, alpha: 0, arcDivisions: 500 });
    expect(result).to.be.instanceof(CurveInterpolator);
    expect(result.tension).to.eq(0);
    expect(result.arcDivisions).to.eq(500);
  });

  it('should be able to calculate the correct length', () => {
    let interp = new CurveInterpolator(points);

    expect(interp.length).to.be.approximately(56.620824, EPS);

    const prevLength = interp.length;

    interp = new CurveInterpolator(points, { tension: 0, alpha: 0 });
    expect(interp.length).to.be.greaterThan(prevLength);

    interp = new CurveInterpolator(points, { tension: 1, alpha: 0 });
    expect(interp.length).to.be.lessThan(prevLength);

    interp = new CurveInterpolator(points, { tension: 0.5, alpha: 0, arcDivisions: 1000 });
    expect(interp.length).to.be.greaterThan(prevLength);

    interp = new CurveInterpolator(points, { tension: 0.5, alpha: 0, arcDivisions: 100 });
    expect(interp.length).to.be.lessThan(prevLength);
  });

  it('should be able to get points on curve', () => {
    const interp = new CurveInterpolator(points, { tension: 0, alpha: 0 });

    const result = interp.getPointAt(0.7, new Point());
    expect(result.x).to.approximately(11.0240761, EPS);
    expect(result.y).to.approximately(2.0071484, EPS);
  });

  it('should be able to get multiple, evenly distributed points, on curve', () => {
    const interp = new CurveInterpolator(points, { tension: 0, alpha: 0 });

    const result = interp.getPoints(100, Point);
    expect(result.length).to.eq(101);
    expect(result[0].x).to.eq(points[0][0]);
    expect(result[0].y).to.eq(points[0][1]);
    expect(result[result.length - 1].x).to.eq(points[points.length - 1][0]);
    expect(result[result.length - 1].y).to.eq(points[points.length - 1][1]);
    result.every(r => expect(r).to.be.instanceof(Point));

    expect(() => interp.getPoints(0)).to.throw();
    expect(() => interp.getPoints()).not.to.throw();
  });

  it('should be able to lookup values on curve', () => {
    const interp = new CurveInterpolator(points, { tension: 0, alpha: 0 });

    let actual = interp.lookup(2.2, 1, 0) as number[];
    compareNumArrays(actual.map(d => d[0]), [19.1250098, 10.682604]);
    expect(interp.lookup(2.2, 1, 1)[0]).to.be.approximately(19.125009, EPS);
    expect(interp.lookup(2.2, 1, -1)[0]).to.be.approximately(10.682604, EPS);

    actual = interp.lookup(1.1, 0, 0) as number[];

    compareNumArrays(actual.map(d => d[1]), [17.502159]);
    expect(interp.lookup(1.1, 0, 1)[1]).to.be.approximately(17.502159, EPS);
    expect(interp.lookup(1.1, 0, -1)[1]).to.be.approximately(17.502159, EPS);

  });

  it('should be able to get bounds of curve', () => {
    const interp = new CurveInterpolator(points, { tension: 0, alpha: 0 });

    const bbox = interp.getBoundingBox();
    expect(bbox.min[0]).to.eq(1);
    expect(bbox.max[0]).to.be.approximately(19.2422599, EPS);
    expect(bbox.min[1]).to.be.approximately(1.3872035, EPS);
    expect(bbox.max[1]).to.eq(18);
    expect(bbox.min[2]).to.be.undefined;
    expect(bbox.max[2]).to.be.undefined;

    expect(interp.minX).to.be.eq(bbox.min[0]);
    expect(interp.maxX).to.be.eq(bbox.max[0]);
    expect(interp.minY).to.be.eq(bbox.min[1]);
    expect(interp.maxY).to.be.eq(bbox.max[1]);

    expect(interp.lookup(interp.maxY, 1, 1)[0]).to.be.approximately(1, EPS);
    expect(interp.lookup(interp.minY, 1, 1)[0]).to.be.approximately(16.054653, EPS);
    expect(interp.lookup(interp.maxX, 0, 1)[1]).to.be.approximately(2.8918343, EPS);
    expect(interp.lookup(interp.minX, 0, 1)[1]).to.be.approximately(18, EPS);
  });

  it('should clear cache if new points, tension or arcDivisions are set', () => {
    const interp = new CurveInterpolator(points, { tension: 0, alpha: 0 });

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

  it('should work with less than 4 control points', () => {
    let interp = new CurveInterpolator([
      [888.48611, 481.364299],
      [389.28611, 489.364299],
      [389.28611, 158.964299],
    ], { tension: 0, alpha: 0 });

    let closeToStart = interp.getPointAt(0.02);
    let closeToEnd = interp.getPointAt(0.98);

    expect(closeToStart[0]).to.be.lessThan(888.48611);
    expect(closeToEnd[1]).to.be.greaterThan(158.964299);

    interp = new CurveInterpolator([
      [888.48611, 481.364299],
      [389.28611, 158.964299],
    ], { tension: 0, alpha: 0 });

    closeToStart = interp.getPointAt(0.02);
    closeToEnd = interp.getPointAt(0.98);

    expect(closeToStart[0]).to.be.lessThan(888.48611);
    expect(closeToEnd[1]).to.be.greaterThan(158.964299);

    interp = new CurveInterpolator([
      [888.48611, 481.364299],
    ], { tension: 0, alpha: 0 });

    closeToStart = interp.getPointAt(0.02);
    closeToEnd = interp.getPointAt(0.98);

    expect(closeToStart[0]).to.eq(888.48611);
    expect(closeToEnd[1]).to.eq(481.364299);
  });

  it('should not fail if adjacent input points are equal', () => {
    const testInput = [[0,0],[0,0],[0,0],[0.0400000000372529,0.029999999969732016],[0.07000000029802322,0.03999999997904524],[0.07000000029802322,0.029999999969732016],[0.02000000048428774,0.03999999997904524],[-0.0400000000372529,0.03999999997904524],[-0.0400000000372529,0.01999999996041879],[-0.0400000000372529,-0.030000000027939677],[0,-0.1000000000349246],[0.07000000029802322,-0.17999999999301508],[0.7800000002607703,-0.7700000000186265],[1.4900000002235174,-1.2000000000116415],[2.1200000001117587,-1.5800000000162981],[2.7200000006705523,-1.9100000000325963],[3.300000000745058,-2.220000000030268],[3.900000000372529,-2.6300000000046566],[4.490000000223517,-2.9100000000325963],[4.980000000447035,-3.1199999999953434],[5.430000000633299,-3.3800000000046566],[5.840000000782311,-3.60999999998603],[6.520000000484288,-4],[7.180000000633299,-4.340000000025611],[7.680000000633299,-4.809999999997672],[8.080000000074506,-5.320000000006985],[8.660000000149012,-5.960000000020955],[10.940000000409782,-9.309999999997672],[10.480000000447035,-9.429999999993015],[9.610000000335276,-9.679999999993015],[9.06000000052154,-9.840000000025611],[8.720000000670552,-9.989999999990687],[8.340000000782311,-10.299999999988358],[8,-10.679999999993015],[7.760000000707805,-10.980000000039581],[7.370000000111759,-11.570000000006985],[6.180000000633299,-12.190000000002328],[3.9900000002235174,-12.369999999995343],[1.6600000001490116,-12.35999999998603],[-0.5,-12.290000000037253],[-2.5899999998509884,-12.169999999983702],[-3.6099999994039536,-12.169999999983702],[-3.949999999254942,-12.190000000002328]];
    const interp = new CurveInterpolator(testInput, { tension: 0.5, alpha: 0.5 })
    const test = interp.getPointAt(0.00005);


  });
});


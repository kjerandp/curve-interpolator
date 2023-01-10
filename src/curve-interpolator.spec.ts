import 'mocha';
import { expect } from 'chai';
import Point from './core/point';
import CurveInterpolator from './curve-interpolator';
import { points } from '../test/test-data';
import { compareNumArrays } from '../test/test-utils';

const EPS = 0.001;

describe('curve-interpolator.ts', () => {
  it('should be able to instantiate class', () => {
    let result = new CurveInterpolator(points);
    expect(result).to.be.instanceof(CurveInterpolator);
    expect(result.tension).to.eq(0.5);

    result = new CurveInterpolator(points, { tension: 0, alpha: 0 });
    expect(result).to.be.instanceof(CurveInterpolator);
    expect(result.tension).to.eq(0);

    result = new CurveInterpolator(points, { tension: 0, alpha: 0, arcDivisions: 500 });
    expect(result).to.be.instanceof(CurveInterpolator);
    expect(result.tension).to.eq(0);
  });

  it('should be able to calculate the correct length', () => {
    let interp = new CurveInterpolator(points);

    expect(interp.length).to.be.approximately(56.63, 0.01);

    const prevLength = interp.length;

    interp = new CurveInterpolator(points, { tension: 0, alpha: 0 });
    expect(interp.length).to.be.greaterThan(prevLength);

    interp = new CurveInterpolator(points, { tension: 1, alpha: 0 });
    expect(interp.length).to.be.lessThan(prevLength);

    interp = new CurveInterpolator(points, { tension: 0, alpha: 0.5, arcDivisions: 1000 });
    expect(interp.length).to.be.greaterThan(prevLength);

    interp = new CurveInterpolator(points, { tension: 0.5, alpha: 0.5, arcDivisions: 100 });
    expect(interp.length).to.be.lessThan(prevLength);
  });

  it('should be able to get points on curve', () => {
    const interp = new CurveInterpolator(points, { tension: 0, alpha: 0 });

    const result = interp.getPointAt(0.7, new Point());
    expect(result.x).to.approximately(11.024, EPS);
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
    expect(interp.lookup(2.2, 1, 1)[0]).to.be.approximately(19.125, EPS);
    expect(interp.lookup(2.2, 1, -1)[0]).to.be.approximately(10.682, EPS);

    actual = interp.lookup(1.1, 0, 0) as number[];

    compareNumArrays(actual.map(d => d[1]), [17.502159]);
    expect(interp.lookup(1.1, 0, 1)[1]).to.be.approximately(17.502, EPS);
    const result = interp.lookup(1.1, 0, -1);
    expect(result[1]).to.be.approximately(17.502, EPS);

  });

  it('should be able to get bounds of curve', () => {
    const interp = new CurveInterpolator(points, { tension: 0, alpha: 0 });

    const bbox = interp.getBoundingBox();
    expect(bbox.min[0]).to.eq(1);
    expect(bbox.max[0]).to.be.approximately(19.242, EPS);
    expect(bbox.min[1]).to.be.approximately(1.387, EPS);
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

    expect(interp._bbox).to.be.null;
    interp.getPoints(100, Point);
    expect(interp._bbox).to.be.null;
    interp.maxX;
    expect(interp._bbox).to.not.be.null;
    interp.tension = 0; // value not changed
    expect(interp._bbox).to.not.be.null;
    interp.tension = 0.5;
    expect(interp._bbox).to.be.null;
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
  });

  it('should not fail if adjacent input points are equal', () => {
    const testInput = [[0,0],[0,0],[0,0],[0.0400000000372529,0.029999999969732016],[0.07000000029802322,0.03999999997904524],[0.07000000029802322,0.029999999969732016],[0.02000000048428774,0.03999999997904524],[-0.0400000000372529,0.03999999997904524],[-0.0400000000372529,0.01999999996041879],[-0.0400000000372529,-0.030000000027939677],[0,-0.1000000000349246],[0.07000000029802322,-0.17999999999301508],[0.7800000002607703,-0.7700000000186265],[1.4900000002235174,-1.2000000000116415],[2.1200000001117587,-1.5800000000162981],[2.7200000006705523,-1.9100000000325963],[3.300000000745058,-2.220000000030268],[3.900000000372529,-2.6300000000046566],[4.490000000223517,-2.9100000000325963],[4.980000000447035,-3.1199999999953434],[5.430000000633299,-3.3800000000046566],[5.840000000782311,-3.60999999998603],[6.520000000484288,-4],[7.180000000633299,-4.340000000025611],[7.680000000633299,-4.809999999997672],[8.080000000074506,-5.320000000006985],[8.660000000149012,-5.960000000020955],[10.940000000409782,-9.309999999997672],[10.480000000447035,-9.429999999993015],[9.610000000335276,-9.679999999993015],[9.06000000052154,-9.840000000025611],[8.720000000670552,-9.989999999990687],[8.340000000782311,-10.299999999988358],[8,-10.679999999993015],[7.760000000707805,-10.980000000039581],[7.370000000111759,-11.570000000006985],[6.180000000633299,-12.190000000002328],[3.9900000002235174,-12.369999999995343],[1.6600000001490116,-12.35999999998603],[-0.5,-12.290000000037253],[-2.5899999998509884,-12.169999999983702],[-3.6099999994039536,-12.169999999983702],[-3.949999999254942,-12.190000000002328]];
    const interp = new CurveInterpolator(testInput, { tension: 0.5, alpha: 0.5 })
    const test = interp.getPointAt(0.00005);
  });

  it('should work with tension = 1', () => {
    const p = [[0,0,0],[0.001176470599602908,-29.126470588235293,0.10941176488995552],[0.002352941199205816,-58.252941176470586,0.21882352977991104],[0.0035294117406010628,-87.37941176470588,0.32823529466986656],[0.00470588228199631,-116.50588235294117,0.4376470595598221],[0.005882352939806879,-145.63235294117646,0.547058823518455],[0.0070588234812021255,-174.75882352941176,0.6564705884084105],[0.008235294139012694,-203.88529411764705,0.7658823532983661],[0.009411764680407941,-233.01176470588234,0.8752941181883216],[0.01058823528001085,-262.13823529411764,0.9847058830782771],[0.011764705879613757,-291.2647058823529,1.0941176479682326],[0.012941176421009004,-320.3911764705882,1.2035294119268656],[0.014117647020611912,-349.5176470588235,1.3129411758854985],[0.01529411762021482,-378.6441176470588,1.422352940775454],[0.016470588219817728,-407.7705882352941,1.5317647056654096],[0.017647058761212975,-436.8970588235294,1.6411764714866877],[0.018823529360815883,-466.0235294117647,1.7505882354453206],[0.01999999996041879,-495.15,1.8600000003352761],[0.01999999996041879,-521.89,2.040000000037253],[0,-549.58,2.169999999925494],[0.01999999996041879,-579.06,2.2199999997392297],[0.059999999997671694,-606.59,2.169999999925494],[0.06999999994877726,-635.55,2.0600000005215406],[0.08999999996740371,-664.76,1.8900000005960464],[0.17999999999301508,-692.47,1.6600000001490116],[0.2699999999604188,-721.47,1.4300000006332994],[0.29999999998835847,-748.52,1.2199999997392297],[0.3299999999580905,-779.35,0.9699999997392297],[0.40999999997438863,-806.7,0.7599999997764826],[0.4899999999906868,-836.74,0.5600000005215406],[0.5899999999674037,-864.82,0.39000000059604645],[0.7599999999511056,-892.86,0.2800000002607703],[0.9699999999720603,-922,0.20000000018626451],[1.1300000000046566,-951.12,0.15000000037252903],[1.25,-979.71,0.1699999999254942],[1.3800000000046566,-1008.57,0.24000000022351742],[1.4499999999534339,-1036.37,0.2900000000372529],[1.4699999999720603,-1049.46,0.2999999998137355],[1.5199999999604188,-1091.28,0.21999999973922968],[1.5499999999883585,-1118.48,0.15000000037252903],[1.529999999969732,-1149.07,0.08999999985098839],[1.4499999999534339,-1177.91,0.03000000026077032],[1.3800000000046566,-1205.34,-0.03000000026077032],[1.3199999999487773,-1236.32,-0.10999999940395355],[1.2599999999511056,-1263.09,-0.18999999947845936],[1.1900000000023283,-1292.94,-0.2599999997764826],[1.1499999999650754,-1319.55,-0.30999999959021807],[1.099999999976717,-1350,-0.34999999962747097],[1.0399999999790452,-1378.12,-0.3799999998882413],[0.9899999999906868,-1405.86,-0.4100000001490116],[0.9499999999534339,-1434.19,-0.4500000001862645],[0.9199999999837019,-1464.55,-0.5],[0.9099999999743886,-1492.35,-0.5499999998137355],[0.8999999999650754,-1521,-0.5800000000745058],[0.8800000000046566,-1549.88,-0.6200000001117587],[0.8599999999860302,-1578.65,-0.6699999999254942],[0.8399999999674037,-1606.91,-0.7000000001862645],[0.8199999999487773,-1636.33,-0.7400000002235174],[0.7899999999790452,-1664.14,-0.7900000000372529],[0.75,-1692.65,-0.849999999627471],[0.7199999999720603,-1721.68,-0.8899999996647239],[0.6999999999534339,-1750.71,-0.9299999997019768],[0.6799999999930151,-1779.58,-1],[0.6399999999557622,-1807.34,-1.0800000000745058],[0.6099999999860302,-1836.66,-1.1799999997019768],[0.5699999999487773,-1865.4,-1.290000000037253],[0.5399999999790452,-1892.57,-1.3999999994412065],[0.5,-1921.01,-1.5099999997764826],[0.44999999995343387,-1951.25,-1.5800000000745058],[0.3800000000046566,-1980.29,-1.6600000001490116],[0.25999999995110556,-2008.06,-1.7800000002607703],[0.09999999997671694,-2037.2,-1.9500000001862645],[-0.030000000027939677,-2064.63,-2.1799999997019768],[-0.1600000000325963,-2093.37,-2.519999999552965],[-0.39000000001396984,-2157.53,-3.099999999627471],[-0.49000000004889444,-2187.44,-3.2299999995157123],[-0.6000000000349246,-2214.39,-3.309999999590218],[-0.6900000000023283,-2244.35,-3.3700000001117587],[-0.7700000000186265,-2273.05,-3.4299999997019768],[-0.8600000000442378,-2299.35,-3.5],[-0.9800000000395812,-2329.52,-3.5699999993667006],[-1.1100000000442378,-2359.15,-3.639999999664724],[-1.2300000000395812,-2386.98,-3.709999999962747],[-1.290000000037253,-2415.74,-3.8399999998509884],[-1.3400000000256114,-2443.64,-4.040000000037253],[-1.4300000000512227,-2473.09,-4.309999999590218],[-1.5,-2500.42,-4.599999999627471],[-1.5800000000162981,-2533.3,-4.959999999962747],[-1.6700000000419095,-2559.55,-5.209999999962747],[-1.8000000000465661,-2587.8,-5.419999999925494],[-1.8699999999953434,-2602.96,-5.5499999998137355],[-1.970000000030268,-2622.96,-5.729999999515712]];
    const lerp = new CurveInterpolator(p, { tension: 0.999993, alpha: 0.0, closed: false, arcDivisions: 0 });
    lerp.getPointAt(0.14435536318988135);

  });
});


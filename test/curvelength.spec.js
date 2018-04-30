import { expect } from 'chai';
import CurveInterpolator from '../src';
import { log } from './testfiles/logdata.json';

function testCurve(points) {
  // linear calculation of length
  let l = 0;
  for (let i = 1; i < points.length; i++) {
    const p1 = points[i - 1];
    const p2 = points[i];
    const w = p2[0] - p1[0];
    const h = p2[1] - p1[1];
    l += Math.sqrt(w ** 2 + h ** 2);
  }

  const intpA = new CurveInterpolator(points);
  const intpB = new CurveInterpolator(points, 0.5);
  const intpC = new CurveInterpolator(points, 1);

  expect(intpA.getLength()).to.be.closeTo(l, 0.1);
  expect(intpB.getLength()).to.be.closeTo(l, 0.07);
  expect(intpC.getLength()).to.be.closeTo(l, 0.05);

  expect(intpA.getLength()).to.be.greaterThan(intpB.getLength());
  expect(intpA.getLength()).to.be.greaterThan(intpC.getLength());
  expect(intpB.getLength()).to.be.greaterThan(intpC.getLength());
}

describe('should calculate the correct length of a curve', () => {
  it('is true for test curve 1', () => {
    const points = [
      [1, 1],
      [4, 2],
      [6, 4],
      [7, 8],
      [8, 13],
      [9, 27],
    ];

    testCurve(points);
  });

  it('is true for test curve 2', () => {
    let l = 0;
    let o = log[0];
    // curtain projection of a 3d curve to 2d
    const points = log.map((p) => {
      l += Math.sqrt(((p.x_offset - o.x_offset) ** 2) + ((p.y_offset - o.y_offset) ** 2));
      o = p;
      return [l, p.tvd];
    });

    testCurve(points);
  });
});

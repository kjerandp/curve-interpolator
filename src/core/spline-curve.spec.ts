import 'mocha';
import { expect } from 'chai';
import {
  compareNumArrays,
} from '../../test/test-utils';
import { points, points3d } from '../../test/test-data';
import { extrapolateControlPoint, getControlPoints, getSegmentIndexAndT } from './spline-curve';


const EPS = 0.000001;

describe('spline-curve.ts', () => {
  it('should be able to extrapolate a weighted point based on existing adjacent control points', () => {
    expect(extrapolateControlPoint([2, 5], [4, 9])).to.deep.eq([0, 1]);
    expect(extrapolateControlPoint([4, 9], [2, 5, ])).to.deep.eq([6, 13]);
    expect(extrapolateControlPoint([-2, 0], [0, 0])).to.deep.eq([-4, 0]);
  });

  it('should find the associated control points for a spline segment from its index', () => {
    const points = [[2, 4], [4, 3], [4, -2], [1, 6]];

    expect(getControlPoints(0, points, false)).to.deep.eq([
      [0, 5], // extrapolated
      [2, 4],
      [4, 3],
      [4, -2],
    ]);

    expect(getControlPoints(1, points, false)).to.deep.eq([
      [2, 4],
      [4, 3],
      [4, -2],
      [1, 6],
    ]);

    expect(getControlPoints(2, points, false)).to.deep.eq([
      [4, 3],
      [4, -2],
      [1, 6],
      [-2, 14], // extrapolated
    ]);

    // for open curves, there is no curve segment defined for index beyond points.length - 1
    expect(() => getControlPoints(3, points, false)).to.throw;

    // closed curve
    expect(getControlPoints(0, points, true)).to.deep.eq([
      [1, 6],
      [2, 4],
      [4, 3],
      [4, -2],
    ]);

    expect(getControlPoints(1, points, true)).to.deep.eq([
      [2, 4],
      [4, 3],
      [4, -2],
      [1, 6],
    ]);

    expect(getControlPoints(2, points, true)).to.deep.eq([
      [4, 3],
      [4, -2],
      [1, 6],
      [2, 4],
    ]);

    expect(getControlPoints(3, points, true)).to.deep.eq([
      [4, -2],
      [1, 6],
      [2, 4],
      [4, 3],
    ]);
  });

  it('should find the associated segment index and weight (local t) based on a global t', () => {
    const points = [[2, 4], [4, 3], [4, -2], [1, 6]];

    expect(getSegmentIndexAndT(0, points, false)).to.deep.eq({ index: 0, weight: 0 });
    expect(getSegmentIndexAndT(0.5, points, false)).to.deep.eq({ index: 1, weight: 0.5 });
    expect(getSegmentIndexAndT(0.84, points, false)).to.deep.eq({ index: 2, weight: 0.52 });
    expect(getSegmentIndexAndT(1, points, false)).to.deep.eq({ index: 2, weight: 1 });

    expect(getSegmentIndexAndT(0, points, true)).to.deep.eq({ index: 0, weight: 0 });
    expect(getSegmentIndexAndT(0.5, points, true)).to.deep.eq({ index: 2, weight: 0 });
    expect(getSegmentIndexAndT(0.99, points, true)).to.deep.eq({ index: 3, weight: 0.96 });
    expect(getSegmentIndexAndT(1, points, true)).to.deep.eq({ index: 3, weight: 1 });
  });
});

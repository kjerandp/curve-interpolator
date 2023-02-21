import 'mocha';
import { expect } from 'chai';
import {
  compareNumArrays,
} from '../../test/test-utils';
import { points, points3d } from '../../test/test-data';
import {
  getPointAtT,
  getTangentAtT,
 } from './legacy-curve-functions';
import Point from '../core/point';

const EPS = 0.000001;

describe('legacy-curve-functions', () => {

  it('should be able to find the point on curve at t', () => {
    let arr = getPointAtT(0, points, { tension: 0.5, alpha: 0 });
    compareNumArrays(arr, [1, 18]);

    arr = getPointAtT(1, points, { tension: 0.5, alpha: 0 });
    compareNumArrays(arr, [12, 10]);

    arr = getPointAtT(0.3, points, { tension: 0.5, alpha: 0 });
    compareNumArrays(arr, [7.387999, 8.64200]);

    const point = getPointAtT(0.5, points, { tension: 0.5, alpha: 0 }, new Point());
    expect(point).to.be.instanceOf(Point);
    expect(point.x).to.equal(12);
    expect(point.y).to.equal(7);
  });

  it('should be able to find the point on closed curve at t', () => {
    const start = getPointAtT(0, points, { tension: 0.5, alpha: 0, closed: true });
    compareNumArrays(start, [1, 18]);

    const end = getPointAtT(1, points, { tension: 0.5, alpha: 0, closed: true });
    compareNumArrays(end, [1, 18]);

    const arr = getPointAtT(0.96, points, { tension: 0, alpha: 0, closed: true });
    compareNumArrays(arr, [9.686496, 11.5460799]);

  });

  it('should be able to find the point on a 3d curve at t', () => {
    let arr = getPointAtT(0, points3d, { tension: 0.5, alpha: 0 });
    compareNumArrays(arr, [1, 0, 1]);

    arr = getPointAtT(1, points3d, { tension: 0.5, alpha: 0 });
    compareNumArrays(arr, [10, -4.8, 10]);

    arr = getPointAtT(0.3, points3d, { tension: 0.5, alpha: 0 });
    compareNumArrays(arr, [1.0074, -2.06175, 1.96525]);

    const point = getPointAtT(0.5, points3d, { tension: 0.5, alpha: 0 }, new Point());
    // 1.35625, -4.03125, 2.984375
    expect(point).to.be.instanceOf(Point);
    expect(point.x).to.be.approximately(1.35625, EPS);
    expect(point.y).to.be.approximately(-4.03125, EPS);
    expect(point.z).to.be.approximately(2.984375, EPS);
  });

  it('should be able to find the tangent on curve at t', () => {
    let tan = getTangentAtT(0, points, { tension: 0.5, alpha: 0 });
    compareNumArrays(tan, [0.5, -2.5]);

    tan = getTangentAtT(1, points, { tension: 0.5, alpha: 0 });
    compareNumArrays(tan, [-1.25, -0.75]);

    tan = getTangentAtT(0.3, points, { tension: 0.5, alpha: 0 });
    compareNumArrays(tan, [1.109999, -1.384999]);

    tan = getTangentAtT(0.5, points, { tension: 0.5, alpha: 0 });
    compareNumArrays(tan, [0.75, -0.75]);
  });
});

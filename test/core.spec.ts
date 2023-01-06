import 'mocha';
import { expect } from 'chai';
import {
  compareNumArrays,
} from './test-utils';
import { points, points3d } from './test-data';
import {
  getPointAtT,
  getTangentAtT,
  getArcLengths,
  getUtoTmapping,
  getTtoUmapping,
 } from '../src/core';
import { Point } from '../src';

const EPS = 0.000001;

describe('core.ts', () => {

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
    compareNumArrays(tan, [-0.625, -0.375]);

    tan = getTangentAtT(0.3, points, { tension: 0.5, alpha: 0 });
    compareNumArrays(tan, [1.109999, -1.384999]);

    tan = getTangentAtT(0.5, points, { tension: 0.5, alpha: 0 });
    compareNumArrays(tan, [0.75, -0.75]);
  });

  it('should be able to divide a curve into segments and estimate each segments length', () => {
    const arcLengths = getArcLengths(points, 10, { tension: 0, alpha: 0 });

    expect(arcLengths.length).to.equal(11);
    expect(arcLengths[0]).to.equal(0);
    expect(arcLengths[10]).to.be.approximately(48.44474, EPS);
  });

  it('should be able to divide a 3d curve into segments and estimate each segments length', () => {
    const arcLengths = getArcLengths(points3d, 10, { tension: 0, alpha: 0 });

    expect(arcLengths.length).to.equal(11);
    expect(arcLengths[0]).to.equal(0);
    expect(arcLengths[10]).to.be.approximately(23.019964, EPS);
  });

  it('should be able to map between t and u indexes', () => {
    const arcLengths = getArcLengths(points, 300, { tension: 0, alpha: 0 });

    expect(getUtoTmapping(0, arcLengths)).to.equal(0);
    expect(getUtoTmapping(1, arcLengths)).to.equal(1);
    expect(getUtoTmapping(0.1, arcLengths)).to.approximately(0.065653, EPS);
    expect(getUtoTmapping(0.2, arcLengths)).to.approximately(0.188370, EPS);
    expect(getUtoTmapping(0.3, arcLengths)).to.approximately(0.364322, EPS);
    expect(getUtoTmapping(0.4, arcLengths)).to.approximately(0.544484, EPS);
    expect(getUtoTmapping(0.5, arcLengths)).to.approximately(0.625274, EPS);
    expect(getUtoTmapping(0.6, arcLengths)).to.approximately(0.695089, EPS);
    expect(getUtoTmapping(0.7, arcLengths)).to.approximately(0.758911, EPS);
    expect(getUtoTmapping(0.8, arcLengths)).to.approximately(0.810916, EPS);
    expect(getUtoTmapping(0.9, arcLengths)).to.approximately(0.866147, EPS);
  });

  it('should be able to map between u and t indexes', () => {
    const arcLengths = getArcLengths(points, 300, { tension: 0, alpha: 0 });

    expect(getTtoUmapping(0, arcLengths)).to.equal(0);
    expect(getTtoUmapping(1, arcLengths)).to.equal(1);
    expect(getTtoUmapping(0.1, arcLengths)).to.approximately(0.131273, EPS);
    expect(getTtoUmapping(0.2, arcLengths)).to.approximately(0.206082, EPS);
    expect(getTtoUmapping(0.3, arcLengths)).to.approximately(0.264353, EPS);
    expect(getTtoUmapping(0.4, arcLengths)).to.approximately(0.320257, EPS);
    expect(getTtoUmapping(0.5, arcLengths)).to.approximately(0.360028, EPS);
    expect(getTtoUmapping(0.6, arcLengths)).to.approximately(0.471680, EPS);
    expect(getTtoUmapping(0.7, arcLengths)).to.approximately(0.609124, EPS);
    expect(getTtoUmapping(0.8, arcLengths)).to.approximately(0.771924, EPS);
    expect(getTtoUmapping(0.9, arcLengths)).to.approximately(0.934861, EPS);
  });
});

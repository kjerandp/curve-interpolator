import 'mocha';
import { expect } from 'chai';
import {
  compareNumArrays,
  // compareNumArraysUnordered,
} from './test-utils';
import { points } from './test-data';
import {
  getPointAtT,
  getTangentAtT,
  getNormalAtT,
  getAngleAtT,
  getArcLengths,
  getUtoTmapping,
  getTtoUmapping,
 } from '../src/core';
import { Point } from '../src';

const EPS = 0.000001;

describe('core.ts', () => {

  it('should be able to find the point on curve at t', () => {
    let arr = getPointAtT(0, points, 0.5);
    compareNumArrays(arr, [1, 18]);

    arr = getPointAtT(1, points, 0.5);
    compareNumArrays(arr, [12, 10]);

    arr = getPointAtT(0.3, points, 0.5);
    compareNumArrays(arr, [7.387999, 8.64200]);

    const point = getPointAtT(0.5, points, 0.5, new Point());
    expect(point).to.be.instanceOf(Point);
    expect(point.x).to.equal(12);
    expect(point.y).to.equal(7);

  });

  it('should be able to find the tangent on curve at t', () => {
    let tan = getTangentAtT(0, points, 0.5);
    compareNumArrays(tan, [0.25, -1.25]);

    tan = getTangentAtT(1, points, 0.5);
    compareNumArrays(tan, [-0.625, -0.375]);

    tan = getTangentAtT(0.3, points, 0.5);
    compareNumArrays(tan, [1.109999, -1.384999]);

    tan = getTangentAtT(0.5, points, 0.5);
    compareNumArrays(tan, [0.75, -0.75]);
  });

  it('should be able to find the normal on curve at t', () => {
    let nrm = getNormalAtT(0, points, 0.5);
    compareNumArrays(nrm, [1.25, 0.25]);

    nrm = getNormalAtT(1, points, 0.5);
    compareNumArrays(nrm, [0.375, -0.625]);

    nrm = getNormalAtT(0.3, points, 0.5);
    compareNumArrays(nrm, [1.384999, 1.109999]);

    nrm = getNormalAtT(0.5, points, 0.5);
    compareNumArrays(nrm, [0.75, 0.75]);
  });

  it('should be able to find the angle on curve at t', () => {
    let angle = getAngleAtT(0, points, 0.5);
    expect(angle).to.be.approximately(-1.37340, EPS);

    angle = getAngleAtT(1, points, 0.5);
    expect(angle).to.be.approximately(-2.601173, EPS);

    angle = getAngleAtT(0.3, points, 0.5);
    expect(angle).to.be.approximately(-0.895175, EPS);

    angle = getAngleAtT(0.5, points, 0.5);
    expect(angle).to.be.approximately(-0.785398, EPS);
  });

  it('should be able to divide a curve into segments and estimate each segments length', () => {
    const arcLengths = getArcLengths(points, 10, 0);

    expect(arcLengths.length).to.equal(11);
    expect(arcLengths[0]).to.equal(0);
    expect(arcLengths[10]).to.be.approximately(48.44474, EPS);
  });

  it('should be able to map between t and u indexes', () => {
    const arcLengths = getArcLengths(points, 300, 0);

    expect(getUtoTmapping(0, arcLengths)).to.equal(0);
    expect(getUtoTmapping(1, arcLengths)).to.equal(1);
    expect(getUtoTmapping(0.1, arcLengths)).to.approximately(0.065653, EPS);
    expect(getUtoTmapping(0.2, arcLengths)).to.approximately(0.188368, EPS);
    expect(getUtoTmapping(0.3, arcLengths)).to.approximately(0.364321, EPS);
    expect(getUtoTmapping(0.4, arcLengths)).to.approximately(0.544482, EPS);
    expect(getUtoTmapping(0.5, arcLengths)).to.approximately(0.625273, EPS);
    expect(getUtoTmapping(0.6, arcLengths)).to.approximately(0.695087, EPS);
    expect(getUtoTmapping(0.7, arcLengths)).to.approximately(0.758909, EPS);
    expect(getUtoTmapping(0.8, arcLengths)).to.approximately(0.810915, EPS);
    expect(getUtoTmapping(0.9, arcLengths)).to.approximately(0.866145, EPS);
  });

  it('should be able to map between u and t indexes', () => {
    const arcLengths = getArcLengths(points, 300, 0);

    expect(getTtoUmapping(0, arcLengths)).to.equal(0);
    expect(getTtoUmapping(1, arcLengths)).to.equal(1);
    expect(getTtoUmapping(0.1, arcLengths)).to.approximately(0.131273, EPS);
    expect(getTtoUmapping(0.2, arcLengths)).to.approximately(0.206082, EPS);
    expect(getTtoUmapping(0.3, arcLengths)).to.approximately(0.264353, EPS);
    expect(getTtoUmapping(0.4, arcLengths)).to.approximately(0.320257, EPS);
    expect(getTtoUmapping(0.5, arcLengths)).to.approximately(0.360030, EPS);
    expect(getTtoUmapping(0.6, arcLengths)).to.approximately(0.471682, EPS);
    expect(getTtoUmapping(0.7, arcLengths)).to.approximately(0.609126, EPS);
    expect(getTtoUmapping(0.8, arcLengths)).to.approximately(0.771927, EPS);
    expect(getTtoUmapping(0.9, arcLengths)).to.approximately(0.934864, EPS);
  });
});

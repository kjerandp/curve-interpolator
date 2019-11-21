import 'mocha';
import {
  getQuadRoots,
  getCubicRoots,
  getCoefficients,
  solveForT,
  getDerivativeOfT,
  distance,
  normalize,
  orthogonal,
  clamp,
} from '../src/math';
import { expect } from 'chai';
import {
  compareNumArrays,
  compareNumArraysUnordered,
} from './utils';

const EPS = 0.000001;

describe('math.ts', () => {

  it('should solve 2nd degree equation', () => {

    // 3x^2 + 2x - 2
    let result = getQuadRoots(3, 2, -2);
    compareNumArraysUnordered(result, [0.54858, -1.21525]);

    // 2x^2 + 4x - 4
    result = getQuadRoots(2, 4, -4);
    compareNumArraysUnordered(result, [0.732050, -2.73205]);
  });

  it('should solve 3nd degree equation', () => {

    // 2x^3 + 3x^2 – 11x – 6
    let result = getCubicRoots(2, 3, -11, -6);
    compareNumArraysUnordered(result, [2, -0.5, -3]);

    // x^3 - 7x^2 + 4x + 12
    result = getCubicRoots(1, -7, 4, 12);
    compareNumArraysUnordered(result, [-1, 2, 6]);

    // x^3 + 12
    result = getCubicRoots(1, 0, 0, 12);
    compareNumArraysUnordered(result, [-2.289428]);

    // 2x^2 + 4x - 4
    result = getCubicRoots(0, 2, 4, -4);
    compareNumArraysUnordered(result, [0.732050, -2.73205]);

    // 2x - 4
    result = getCubicRoots(0, 0, 2, -4);
    compareNumArraysUnordered(result, [2]);

    // -4
    result = getCubicRoots(0, 0, 0, -4);
    compareNumArraysUnordered(result, []);
  });

  it('should find spline coefficients', () => {
    let result = getCoefficients(2, 3, 4, 5, 0, 0);
    compareNumArrays(result, [0, 0, 1, 3]);

    result = getCoefficients(2, 3, 4, 5, 0, 0.5);
    compareNumArrays(result, [-1, 1.5, 0.5, 3]);

    result = getCoefficients(2, 3, 4, 5, 0, 1);
    compareNumArrays(result, [-2, 3, 0, 3]);

    result = getCoefficients(2, 3, 4, 5, 4.5);
    compareNumArrays(result, [-1, 1.5, 0.5, -1.5]);
  });

  it('should be able to calculate value of spline equation given a value for t', () => {
    let result = solveForT(0, 0.5, 2, 3, 4, 5);
    expect(result).to.equal(3);

    result = solveForT(0.25, 0.5, 2, 3, 4, 5);
    expect(result).to.equal(3.203125);

    result = solveForT(0.5, 0.5, 2, 3, 4, 5);
    expect(result).to.equal(3.5);

    result = solveForT(0.75, 0.5, 2, 3, 4, 5);
    expect(result).to.equal(3.796875);

    result = solveForT(0.25, 0, 2, 3, 4, 5);
    expect(result).to.equal(3.25);

    result = solveForT(0.5, 0, 2, 3, 4, 5);
    expect(result).to.equal(3.5);

    result = solveForT(0.75, 0, 2, 3, 4, 5);
    expect(result).to.equal(3.75);

    result = solveForT(1, 0.5, 2, 3, 4, 5);
    expect(result).to.equal(4);
  });

  it('should be able to calculate value of the derivative of a spline equation given a value for t', () => {
    let result = getDerivativeOfT(0, 0.5, 2, 3, 4, 5);
    expect(result).to.equal(0.5);

    result = getDerivativeOfT(0.25, 0.5, 2, 3, 4, 5);
    expect(result).to.equal(1.0625);

    result = getDerivativeOfT(0.5, 0.5, 2, 3, 4, 5);
    expect(result).to.equal(1.25);

    result = getDerivativeOfT(0.75, 0.5, 2, 3, 4, 5);
    expect(result).to.equal(1.0625);

    result = getDerivativeOfT(0.25, 0, 2, 3, 4, 5);
    expect(result).to.equal(1);

    result = getDerivativeOfT(0.5, 0, 2, 3, 4, 5);
    expect(result).to.equal(1);

    result = getDerivativeOfT(0.75, 0, 2, 3, 4, 5);
    expect(result).to.equal(1);

    result = getDerivativeOfT(1, 0.5, 2, 3, 4, 5);
    expect(result).to.equal(0.5);
  });

  it('should be able to calculate the distance between two points', () => {
    let result = distance([0, 0], [-3, 0]);
    expect(result).to.equal(3);

    result = distance([3, 0], [0, 3]);
    expect(result).to.be.approximately(4.24264, EPS);

    result = distance([2, 1], [2, 1]);
    expect(result).to.equal(0);
  });

  it('should be able to normalize vectors', () => {
    let result = normalize([-3, 0]);
    expect(result).to.eql([-1, 0]);

    result = normalize([0, 0]);
    expect(result).to.eql([0, 0]);

    result = normalize([3, 0]);
    expect(result).to.be.eql([1, 0]);

    result = normalize([2, 2]);
    compareNumArrays(result, [0.707106, 0.707106]);

    result = normalize([-2, 4]);
    compareNumArrays(result, [-0.447213, 0.89442719]);
  });

  it('should be able to rotate vectors 90 degrees', () => {
    let result = orthogonal([-3, 1]);
    expect(result).to.eql([-1, -3]);

    result = orthogonal([2, 2]);
    expect(result).to.eql([-2, 2]);
  });

  it('should be able to clamp values', () => {
    let result = clamp(-3, 0, 1);
    expect(result).to.equal(0);

    result = clamp(3, 0, 1);
    expect(result).to.equal(1);

    result = clamp(0.8, 0, 1);
    expect(result).to.equal(0.8);
  });
});

import 'mocha';
import {
  getQuadRoots,
  getCubicRoots,
  distance,
  normalize,
  orthogonal,
  sumOfSquares,
  magnitude,
  dot,
  rotate3d,
} from './math';
import { expect } from 'chai';
import {
  compareNumArrays,
  compareNumArraysUnordered,
} from '../../test/test-utils';

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

  it('should be able to calculate the distance between two points', () => {
    let result = distance([0, 0], [-3, 0]);
    expect(result).to.equal(3);

    result = distance([3, 0], [0, 3]);
    expect(result).to.be.approximately(4.24264, EPS);

    result = distance([2, 1], [2, 1]);
    expect(result).to.equal(0);

    result = distance([2, 1, -3], [2, 1, 8]);
    expect(result).to.equal(11);

    result = distance([0, 0, 0], [2, 1, 2]);
    expect(result).to.equal(3);
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

    result = normalize([0, 0, 0]);
    expect(result).to.eql([0, 0, 0]);

    result = normalize([3, 0, 0]);
    expect(result).to.be.eql([1, 0, 0]);

    result = normalize([2, 2, 1]);
    compareNumArrays(result, [2/3, 2/3, 1/3]);

    result = normalize([-2, 2, 5]);
    compareNumArrays(result, [-0.3481553119, 0.3481553119, 0.87038828]);
  });

  it('should be able to rotate vectors 90 degrees', () => {
    let result = orthogonal([-3, 1]);
    expect(result).to.eql([-1, -3]);

    result = orthogonal([2, 2]);
    expect(result).to.eql([-2, 2]);

    expect(() => orthogonal([1, 2, 3])).to.throw('Only supported for 2d vectors');
  });

  it('should compute sum of squares (distance squared) between two vectors', () => {
    const a = [2, 4];
    const b = [-3, 7];
    const sumSq = sumOfSquares(a, b);

    expect(sumSq).to.eq(34);
  });

  it('should compute the magnitude (absolute value) of a vector', () => {
    const a = [2, 4];
    expect(magnitude(a)).to.eq(Math.sqrt(20));
  });

  it('should compute the dot product between two vectors', () => {
    expect(dot([], [])).to.eq(0);
    expect(dot([2, -2], [4, 1])).to.eq(6);
    expect(dot([0, 0], [2, 1])).to.eq(0);
    expect(dot([-1, 3, 6], [2, 6, -3])).to.eq(-2);
  });

  it('should rotate a point at a given angle and rotation axis', () => {
    compareNumArrays(rotate3d([1, 0, 0], [0, 1, 0], Math.PI), [-1, 0, 0], EPS);
    compareNumArrays(rotate3d([1, 5, 0], [0, 1, 0], Math.PI), [-1, 5, 0], EPS);
    compareNumArrays(rotate3d([1, -2, 0], [0, 0, 1], Math.PI / 2), [2, 1, 0], EPS);
    compareNumArrays(rotate3d([1, -2, 0], [0, 0, 1], Math.PI / 3), [2.23205080, -0.1339746, 0], EPS);
  });
});

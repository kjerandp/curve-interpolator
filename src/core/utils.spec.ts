import 'mocha';
import { expect } from 'chai';
import { binarySearch, clamp, copyValues, fill, map, reduce } from './utils';

describe('utils.ts', () => {
  it('should be able fill a vector components with a single value', () => {
    expect(fill([1, 2, 3], 0)).to.deep.eq([0, 0, 0]);
    expect(fill([0, 0, 0, 0], 2)).to.deep.eq([2, 2, 2, 2]);
  });

  it('should be possible to map over the components of a vector and produce a new vector', () => {
    expect(map([1,2,3], (c, i) => c + i)).to.deep.eq([1, 3, 5]);
  });

  it('should be possible to reduce a vector to a single value', () => {
    expect(reduce([1, 2, 3], (s, c) => s + c)).to.deep.eq(6);
  });

  it('should be able to copy values from one vector to another', () => {
    const source = [1, 2, 3];
    const target = copyValues(source);

    expect(target).to.not.be.eq(source);
    expect(target).to.deep.eq(source);
  });

  it('should be able to find closest index in an accumulated sum array using binary search', () => {
    const arr = [1, 3, 6, 8, 12];
    expect(binarySearch(5, arr)).to.eq(1);
    expect(binarySearch(8, arr)).to.eq(3);
    expect(binarySearch(7, arr)).to.eq(2);
    expect(binarySearch(18, arr)).to.eq(4);
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

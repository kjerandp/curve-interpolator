import 'mocha';
// import Point from '../src/point';
import { expect } from 'chai';
import {
  compareNumArrays,
  compareNumArraysUnordered,
} from './utils';
import { getPointAtT } from '../src/core';

const points = [[1, 18],[2, 13],[2.5, 10],[4, 7.5],[5, 8.5],[7, 9],[8, 8],[10, 8.5],[11, 8],[12, 7],[14, 5],[18, 6],[19, 2],[14, 1.5],[10, 3],[10, 10],[14, 12],[14.5, 11.5],[12, 10]];

class Point extends Array {
  get x() { return this[0] }
}

describe('core.ts', () => {

  it('should ', () => {

    const point = getPointAtT(0.3, points, 0.5, Point);
    expect(point).to.be.instanceOf(Point);
  });
});

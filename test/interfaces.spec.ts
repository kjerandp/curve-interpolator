import 'mocha';
import { expect } from 'chai';
import {
  Vector,
} from '../src/interfaces';
import Point from '../src/point';
import { distance } from '../src/math';



describe('interfaces.ts', () => {
  it('should be able to use array as well as other types for Vector', () => {
    const arr:Vector = [1, 3];
    const point:Vector = new Point(2, -3);

    expect(arr).to.be.instanceof(Array);
    expect(point).to.be.instanceof(Point);

    expect(distance(arr, point)).to.be.an('number');
  });
});


import 'mocha';
import { expect } from 'chai';
import {
  Vector,
} from './interfaces';
import Point from './point';
import { distance } from './math';



describe('interfaces.ts', () => {
  it('should be able to use array as well as other types for Vector', () => {
    const arr:Vector = [1, 3];
    const point:Vector = new Point(2, -3);

    expect(arr).to.be.instanceof(Array);
    expect(point).to.be.instanceof(Point);

    expect(distance(arr, point)).to.be.an('number');
  });
});


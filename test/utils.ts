import { expect } from 'chai';

export function compareNumArrays(result: number[], expected: number[], delta: number = 0.00001) : boolean {
  return result.every(((d, i) => expect(d).to.be.closeTo(expected[i], delta)));
}
export function compareNumArraysUnordered(result: number[], expected: number[], delta: number = 0.00001) : boolean {
  return expect(result.every(d => expected.some(e => Math.abs(d - e) <= delta))).to.be.true;
}


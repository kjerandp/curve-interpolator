import { expect } from 'chai';

export function compareNumArrays(result: any, expected: any, delta: number = 0.00001) : boolean {
  return result.every(((d, i) => expect(d).to.be.closeTo(expected[i], delta)));
}

export function compareNumArraysUnordered(result: any, expected: any, delta: number = 0.00001) : Chai.Assertion {
  const res = result.every(d => expected.some(e => Math.abs(d - e) <= delta));
  return expect(res).to.be.true;
}



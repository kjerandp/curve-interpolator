import 'mocha';
import { expect } from 'chai';
import { clamp } from './utils';

describe('utils.ts', () => {
  it('should be able to clamp values', () => {
    let result = clamp(-3, 0, 1);
    expect(result).to.equal(0);

    result = clamp(3, 0, 1);
    expect(result).to.equal(1);

    result = clamp(0.8, 0, 1);
    expect(result).to.equal(0.8);
  });
});

import 'mocha';
import { calculateCoefficients, derivativeAtT, evaluateForT, secondDerivativeAtT, findRootsOfT, valueAtT } from './spline-segment';
import { expect } from 'chai';
import {
  compareNumArrays,
} from '../../test/test-utils';
import { points, points3d } from '../../test/test-data';

describe('spline-segment.ts', () => {
  it('should find curve coefficients', () => {
    let result = calculateCoefficients([2], [3], [4], [5], { tension: 0 });
    compareNumArrays(result[0], [0, 0, 1, 3]);

    result = calculateCoefficients([2], [3], [4], [5], { tension: 0.5 });
    compareNumArrays(result[0], [-1, 1.5, 0.5, 3]);

    result = calculateCoefficients([2], [3], [4], [5], { tension: 1 });
    compareNumArrays(result[0], [-2, 3, 0, 3]);

    result = calculateCoefficients([2], [3], [4], [5], { tension: 0.5 });
    result[0][3] -= 4.5; //if we need to include a target value (lookup)
    compareNumArrays(result[0], [-1, 1.5, 0.5, -1.5]);
  });

  it('should be possible to calculate value of spline equation given a value for t', () => {
    const [coefficients1] = calculateCoefficients([2], [3], [4], [5], { tension: 0.5 });
    const [coefficients2] = calculateCoefficients([2], [3], [4], [5], { tension: 0.0 });

    let result = valueAtT(0, coefficients1);
    expect(result).to.equal(3);

    result = valueAtT(0.25, coefficients1);
    expect(result).to.equal(3.203125);

    result = valueAtT(0.5, coefficients1);
    expect(result).to.equal(3.5);

    result = valueAtT(0.75, coefficients1);
    expect(result).to.equal(3.796875);

    result = valueAtT(0.25, coefficients2);
    expect(result).to.equal(3.25);

    result = valueAtT(0.5, coefficients2);
    expect(result).to.equal(3.5);

    result = valueAtT(0.75, coefficients2);
    expect(result).to.equal(3.75);

    result = valueAtT(1.0, coefficients2);
    expect(result).to.equal(4);
  });

  it('should be possible to calculate value of the derivative of a curve equation given a value for t', () => {
    const [coefficients1] = calculateCoefficients([2], [3], [4], [5], { tension: 0.5 });
    const [coefficients2] = calculateCoefficients([2], [3], [4], [5], { tension: 0.0 });

    let result = derivativeAtT(0, coefficients1);
    expect(result).to.equal(0.5);

    result = derivativeAtT(0.25, coefficients1);
    expect(result).to.equal(1.0625);

    result = derivativeAtT(0.5, coefficients1);
    expect(result).to.equal(1.25);

    result = derivativeAtT(0.75, coefficients1);
    expect(result).to.equal(1.0625);

    result = derivativeAtT(0.25, coefficients2);
    expect(result).to.equal(1);

    result = derivativeAtT(0.5, coefficients2);
    expect(result).to.equal(1);

    result = derivativeAtT(0.75, coefficients2);
    expect(result).to.equal(1);

    result = derivativeAtT(1.0, coefficients1);
    expect(result).to.equal(0.5);
  });

  it('should be possible to calculate value of the second derivative of a curve equation given a value for t', () => {
    const [coefficients1] = calculateCoefficients([2], [3], [4], [5], { tension: 0.5 });
    const [coefficients2] = calculateCoefficients([2], [3], [4], [5], { tension: 0.0 });

    let result = secondDerivativeAtT(0, coefficients1);
    expect(result).to.equal(3);

    result = secondDerivativeAtT(0.25, coefficients1);
    expect(result).to.equal(1.5);

    result = secondDerivativeAtT(0.5, coefficients1);
    expect(result).to.equal(0);

    result = secondDerivativeAtT(0.75, coefficients1);
    expect(result).to.equal(-1.5);

    result = secondDerivativeAtT(0.25, coefficients2);
    expect(result).to.equal(0);

    result = secondDerivativeAtT(0.5, coefficients2);
    expect(result).to.equal(0);

    result = secondDerivativeAtT(0.75, coefficients2);
    expect(result).to.equal(0);

    result = secondDerivativeAtT(1.0, coefficients1);
    expect(result).to.equal(-3);
  });

  it('should be possible  to execute spline functions for multi-dimensional vectors', () => {
    const [p0, p1, p2, p3] = points.slice(0, 4);
    const [q0, q1, q2, q3] = points3d.slice(0,4);

    const coefficients2d = calculateCoefficients(p0, p1, p2, p3, { tension: 0, alpha: 0.5 });
    const coefficients3d = calculateCoefficients(q0, q1, q2, q3, { tension: 0, alpha: 0.5 });

    expect(coefficients2d.length).to.eq(2);
    expect(coefficients3d.length).to.eq(3);

    let result = evaluateForT(valueAtT, 0.5, coefficients2d);
    compareNumArrays(result, [2.20, 11.43], 0.01);

    result = evaluateForT(derivativeAtT, 0.5, coefficients2d);
    compareNumArrays(result, [0.34, -2.96], 0.01);

    result = evaluateForT(secondDerivativeAtT, 0.5, coefficients2d);
    compareNumArrays(result, [0.40, 0.60], 0.01);

    result = evaluateForT(valueAtT, 0.5, coefficients3d);
    compareNumArrays(result, [0.99, -1.51, 1.56], 0.01);

    result = evaluateForT(derivativeAtT, 0.5, coefficients3d);
    compareNumArrays(result, [-0.02, -0.97, 1.38], 0.01);

    result = evaluateForT(secondDerivativeAtT, 0.5, coefficients3d);
    compareNumArrays(result, [0.10, 0.11, -0.45], 0.01);
  });

  it('should be able to solve cubic equation and return roots', () => {
    const [coefficients] = calculateCoefficients([10], [5], [-5], [-8], { tension: 0, alpha: 0.5 });

    let result = findRootsOfT(0, coefficients);
    compareNumArrays(result, [0.4865], 0.001);

    result = findRootsOfT(2.5, coefficients);
    compareNumArrays(result, [0.2598], 0.001);

    result = findRootsOfT(6, coefficients);
    expect(result).to.deep.eq([]);
  });
});

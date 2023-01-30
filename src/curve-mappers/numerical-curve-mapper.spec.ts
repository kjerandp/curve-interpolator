import 'mocha';
import { expect } from 'chai';
import { points, points3d } from '../../test/test-data';
import { NumericalCurveMapper } from './numerical-curve-mapper';
import { AbstractCurveMapper } from './abstract-curve-mapper';

const EPS = 0.001;

describe('numerical-curve-mapper.ts', () => {
  it('should be able to instantiate class', () => {
    const mapper = new NumericalCurveMapper();
    expect(mapper).to.not.be.null;
    expect(mapper).to.be.instanceOf(AbstractCurveMapper);
  });

  it('should be able to instantiate class with parameters', () => {
    const mapper = new NumericalCurveMapper(5, 18);
    expect(mapper._gauss).to.deep.eq([[-0.906179845938664,0.23692688505618908],[-0.5384693101056831,0.47862867049936647],[0,0.5688888888888889],[0.5384693101056831,0.47862867049936647],[0.906179845938664,0.23692688505618908]]);
    expect(mapper._nSamples).to.eq(18);
  });

  it('should be able to compute arc lengths', () => {
    const mapper = new NumericalCurveMapper();
    mapper.tension = 0.5;
    mapper.points = points;

    const totalLength = mapper.arcLengths[mapper.arcLengths.length - 1];
    expect(totalLength).to.be.closeTo(56.6333, EPS);
    expect(mapper.lengthAt(1)).to.eq(totalLength);
    expect(mapper.lengthAt(0.25)).to.be.closeTo(totalLength * 0.25, EPS);
    expect(mapper.lengthAt(0.5)).to.be.closeTo(totalLength * 0.5, EPS);
    expect(mapper.lengthAt(0.75)).to.be.closeTo(totalLength * 0.75, EPS);

    // setting tension to 0 should result in a longer curve, invalidating the existing cached arcLengths
    mapper.tension = 0;
    expect(mapper.arcLengths[mapper.arcLengths.length - 1]).to.be.greaterThan(totalLength);
  });

  it('should be able to compute samples for inverse function', () => {
    const mapper = new NumericalCurveMapper();
    mapper.tension = 0.0;
    mapper.alpha = 0.5;
    mapper.points = points;

    const [lengths, slopes, cis, dis] = mapper.getSamples(1);
    expect(lengths.length).to.eq(mapper._nSamples);
    expect(slopes.length).to.eq(mapper._nSamples);
    expect(cis.length).to.eq(mapper._nSamples - 1);
    expect(dis.length).to.eq(mapper._nSamples - 1);
  });

  it('should be able to convert between t and u - 2d', () => {
    const mapper = new NumericalCurveMapper();
    mapper.tension = 0.5;
    mapper.points = points;

    expect(mapper.getT(0)).to.eq(0);
    expect(mapper.getT(1)).to.eq(1);
    expect(mapper.getU(0)).to.eq(0);
    expect(mapper.getU(1)).to.eq(1);

    expect(mapper.getT(0.82)).to.not.be.NaN;
    for (let i = 0; i <= 100; i += 1) {
      const u = Math.random();
      const t = mapper.getT(u);
      expect(mapper.getU(t)).to.be.closeTo(u, EPS);
    }

  });

  it('should be able to convert between t and u - 3d', () => {
    const mapper = new NumericalCurveMapper();
    mapper.tension = 0.5;
    mapper.points = points3d;

    expect(mapper.getT(0)).to.eq(0);
    expect(mapper.getT(1)).to.eq(1);
    expect(mapper.getU(0)).to.eq(0);
    expect(mapper.getU(1)).to.eq(1);

    for (let i = 0; i <= 100; i += 1) {
      const u = Math.random();
      const t = mapper.getT(u);
      expect(mapper.getU(t)).to.be.closeTo(u, 0.001);
    }

  });

  it('should be able to divide a curve into segments and estimate each segments length', () => {
    const mapper = new NumericalCurveMapper();
    mapper.tension = 0;
    mapper.points = points;

    const arcLengths = mapper.computeArcLengths();

    expect(arcLengths.length).to.equal(points.length);
    expect(arcLengths[0]).to.equal(0);
    expect(arcLengths[arcLengths.length - 1]).to.be.approximately(57.816979, EPS);
  });

  it('should be able to divide a 3d curve into segments and estimate each segments length', () => {
    const mapper = new NumericalCurveMapper();
    mapper.tension = 0;
    mapper.points = points3d;

    const arcLengths = mapper.computeArcLengths();

    expect(arcLengths.length).to.equal(points3d.length);
    expect(arcLengths[0]).to.equal(0);
    expect(arcLengths[arcLengths.length - 1]).to.be.approximately(24.173807, EPS);
  });

  it('should be able to map between t and u indexes', () => {
    const mapper =new NumericalCurveMapper();
    mapper.tension = 0;
    mapper.points = points;

    expect(mapper.getT(0)).to.equal(0);
    expect(mapper.getT(1)).to.equal(1);
    expect(mapper.getT(0.1)).to.approximately(0.065657, EPS);
    expect(mapper.getT(0.2)).to.approximately(0.188452, EPS);
    expect(mapper.getT(0.3)).to.approximately(0.364337, EPS);
    expect(mapper.getT(0.4)).to.approximately(0.544511, EPS);
    expect(mapper.getT(0.5)).to.approximately(0.625298, EPS);
    expect(mapper.getT(0.6)).to.approximately(0.695084, EPS);
    expect(mapper.getT(0.7)).to.approximately(0.758899, EPS);
    expect(mapper.getT(0.8)).to.approximately(0.810906, EPS);
    expect(mapper.getT(0.9)).to.approximately(0.866135, EPS);
  });

  it('should be able to map between u and t indexes', () => {
    const mapper =new NumericalCurveMapper();
    mapper.tension = 0;
    mapper.points = points;

    expect(mapper.getU(0)).to.equal(0);
    expect(mapper.getU(1)).to.equal(1);
    expect(mapper.getU(0.1)).to.approximately(0.131242, EPS);
    expect(mapper.getU(0.2)).to.approximately(0.206059, EPS);
    expect(mapper.getU(0.3)).to.approximately(0.264334, EPS);
    expect(mapper.getU(0.4)).to.approximately(0.320241, EPS);
    expect(mapper.getU(0.5)).to.approximately(0.360005, EPS);
    expect(mapper.getU(0.6)).to.approximately(0.471656, EPS);
    expect(mapper.getU(0.7)).to.approximately(0.609148, EPS);
    expect(mapper.getU(0.8)).to.approximately(0.771937, EPS);
    expect(mapper.getU(0.9)).to.approximately(0.934866, EPS);
  });
});

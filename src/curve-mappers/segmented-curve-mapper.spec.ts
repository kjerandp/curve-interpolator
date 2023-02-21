import 'mocha';
import { expect } from 'chai';
import { points, points3d } from '../../test/test-data';
import { SegmentedCurveMapper } from './segmented-curve-mapper';
import { AbstractCurveMapper } from './abstract-curve-mapper';

const EPS = 0.000001;

describe('segmented-curve-mapper.ts', () => {
  it('should be able to instantiate class', () => {
    const mapper = new SegmentedCurveMapper();
    expect(mapper).to.not.be.null;
    expect(mapper).to.be.instanceOf(AbstractCurveMapper);
  });

  it('should be able to compute arc lengths', () => {
    const divisions = 200;
    const mapper = new SegmentedCurveMapper(divisions);

    mapper.tension = 0.5;
    mapper.points = points;

    expect(mapper.arcLengths.length).to.eq(divisions + 1);

    expect(mapper.arcLengths[0]).to.eq(0);

    const totalLength = mapper.arcLengths[mapper.arcLengths.length - 1];
    expect(totalLength).to.be.closeTo(56.6, 0.1);
    expect(mapper.lengthAt(1)).to.eq(totalLength);
    expect(mapper.lengthAt(0.25)).to.be.closeTo(totalLength * 0.25, 0.1);
    expect(mapper.lengthAt(0.5)).to.be.closeTo(totalLength * 0.5, 0.1);
    expect(mapper.lengthAt(0.75)).to.be.closeTo(totalLength * 0.75, 0.1);

    // setting tension to 0 should result in a longer curve, invalidating the existing cached arcLengths
    mapper.tension = 0;
    expect(mapper.arcLengths[mapper.arcLengths.length - 1]).to.be.greaterThan(totalLength);
  });

  it('should be able to convert between t and u - 2d', () => {
    const mapper = new SegmentedCurveMapper(300);
    mapper.tension = 0.5;
    mapper.points = points;

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

  it('should be able to convert between t and u - 3d', () => {
    const mapper = new SegmentedCurveMapper(300);
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
    const mapper = new SegmentedCurveMapper(300);
    mapper.tension = 0;
    mapper.points = points;

    const arcLengths = mapper.computeArcLengths();

    expect(arcLengths.length).to.equal(301);
    expect(arcLengths[0]).to.equal(0);
    expect(arcLengths[arcLengths.length - 1]).to.be.approximately(57.8, 0.1);
  });

  it('should be able to divide a 3d curve into segments and estimate each segments length', () => {
    const mapper = new SegmentedCurveMapper(300);
    mapper.tension = 0;
    mapper.points = points3d;

    const arcLengths = mapper.computeArcLengths();

    expect(arcLengths.length).to.equal(301);
    expect(arcLengths[0]).to.equal(0);
    expect(arcLengths[arcLengths.length - 1]).to.be.approximately(24.17, 0.1);
  });

  it('should be able to map between t and u indexes', () => {
    const mapper = new SegmentedCurveMapper(300);
    mapper.tension = 0;
    mapper.points = points;

    expect(mapper.getT(0)).to.equal(0);
    expect(mapper.getT(1)).to.equal(1);
    expect(mapper.getT(0.1)).to.approximately(0.065653, EPS);
    expect(mapper.getT(0.2)).to.approximately(0.188370, EPS);
    expect(mapper.getT(0.3)).to.approximately(0.364322, EPS);
    expect(mapper.getT(0.4)).to.approximately(0.544484, EPS);
    expect(mapper.getT(0.5)).to.approximately(0.625274, EPS);
    expect(mapper.getT(0.6)).to.approximately(0.695089, EPS);
    expect(mapper.getT(0.7)).to.approximately(0.758911, EPS);
    expect(mapper.getT(0.8)).to.approximately(0.810916, EPS);
    expect(mapper.getT(0.9)).to.approximately(0.866147, EPS);
  });

  it('should be able to map between u and t indexes', () => {
    const mapper = new SegmentedCurveMapper(300);
    mapper.tension = 0;
    mapper.points = points;

    expect(mapper.getU(0)).to.equal(0);
    expect(mapper.getU(1)).to.equal(1);
    expect(mapper.getU(0.1)).to.approximately(0.131273, EPS);
    expect(mapper.getU(0.2)).to.approximately(0.206082, EPS);
    expect(mapper.getU(0.3)).to.approximately(0.264353, EPS);
    expect(mapper.getU(0.4)).to.approximately(0.320257, EPS);
    expect(mapper.getU(0.5)).to.approximately(0.360028, EPS);
    expect(mapper.getU(0.6)).to.approximately(0.471680, EPS);
    expect(mapper.getU(0.7)).to.approximately(0.609124, EPS);
    expect(mapper.getU(0.8)).to.approximately(0.771924, EPS);
    expect(mapper.getU(0.9)).to.approximately(0.934861, EPS);
  });
});

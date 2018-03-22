import polyRoots from 'minimatrix-polyroots';

export const denormalizeValue = (v, dv, c) => v * dv + c;

export const normalizeValue = (v, dv, c) => (v - c) / dv;

export const determineControlPointsFrom = (points, v, f) => {
  let idx = null;
  let a, b;

  for (let i = 1; i < points.length - 1; i++) {
    a = f(points[i - 1]);
    b = f(points[i]);
    if (v >= Math.min(a, b) && v <= Math.max(a, b)) {
      idx = i - 1;
      break;
    }
  }
  if (idx === null) {
    idx = points.length - 2;
  }
  const cp = {
    p0: points[idx === 0 ? 0 : idx - 1],
    p1: points[idx],
    p2: points[idx > points.length - 2 ? idx : idx + 1],
    p3: points[idx > points.length - 3 ? idx : idx + 2],
  };
  return cp;
};

export function getDistance(u, v) {
  const dx = u.x - v.x,
    dy = u.y - v.y;
  const squared = dx * dx + dy * dy;
  return Math.sqrt(squared);
}

export function getLength(v) {
  const squared = v.x * v.x + v.y * v.y;
  return Math.sqrt(squared);
}


export function getVector(u, v) {
  const vector = {
    x: u.x - v.x,
    y: u.y - v.y,
  };

  // normalize
  const l = getLength(vector);
  vector.x /= l;
  vector.y /= l;

  return vector;
}

export const getCoefficients = (p0, p1, p2, p3, v = 0, tension = 0) => {
  const v0 = (1 - tension) * (p2 - p0) * 0.5;
  const v1 = (1 - tension) * (p3 - p1) * 0.5;

  const a = (2 * p1 - 2 * p2 + v0 + v1);
  const b = (-3 * p1 + 3 * p2 - 2 * v0 - v1);

  return ({
    a,
    b,
    c: v0,
    d: p1 - v,
  });
};

export const getPointOnCurve = (t, p0, p1, p2, p3, tension = 0) => {
  const t2 = t * t;
  const t3 = t * t2;
  const coeff = getCoefficients(p0, p1, p2, p3, 0, tension);
  return coeff.a * t3 + coeff.b * t2 + coeff.c * t + coeff.d;
};

export const selectRootValue = (roots) => {
  const rootMatch = roots.filter(r => r.real >= 0 && r.real < 1.0001 && r.imag === 0);
  if (rootMatch.length === 1) {
    return rootMatch[0].real;
  } else if (rootMatch.length > 1) {
    return rootMatch.reduce((t, r) => Math.min(r.real, t), 0);
  }
  return undefined;
};

export const solveForT = (p0, p1, p2, p3, v, tension = 0) => {
  const coeff = getCoefficients(p0, p1, p2, p3, v, tension);
  return polyRoots.getCubicRoots(coeff.a, coeff.b, coeff.c, coeff.d);
};

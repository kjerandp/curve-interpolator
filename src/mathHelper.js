const EPS = Math.pow(2, -52);

const evaluate = (x, A, B, C, D) => {
  const q0 = A * x;
  const B1 = q0 + B;
  const C2 = B1 * x + C;
  return {
    Q: C2 * x + D,
    dQ: (q0 + B1) * x + C2,
    B1,
    C2,
  };
};

const nearestInt = (n) => {
  const l = Math.floor(n);
  const h = Math.ceil(n);
  const dl = Math.abs(n - l);
  const dh = Math.abs(n - h);
  return (dl > dh ? dh : dl);
};

const disc = (A, B, C) => {
  let a = A;
  let b = B;
  let c = C;

  const isIntCoeffs = Math.abs(Math.floor(A) - A) === 0 &&
    Math.abs(Math.floor(b) - b) === 0 &&
    Math.abs(Math.floor(C) - C) === 0;

  if (isIntCoeffs) {
    if (a * c > 0) {
      a = Math.abs(A);
      c = Math.abs(C);
    }
    let loopCondition = false;
    do {
      loopCondition = false;
      if (a < c) {
        const tmp = a;
        a = c;
        c = tmp;
      }
      const n = nearestInt(b / c);
      if (n !== 0) {
        const alpha = a - n * b;
        if (alpha >= -a) {
          b -= n * c;
          a = alpha - n * b;
          if (a > 0) {
            loopCondition = true;
          }
        }
      }
    } while (loopCondition);
  }
  return b * b - a * c;
};

const qdrtc = (A, B, C) => {
  const b = -B / 2;
  const q = disc(A, b, C);
  let X1 = 0;
  let Y1 = 0;
  let X2 = 0;
  let Y2 = 0;

  if (q < 0) {
    const X = b / A;
    const Y = Math.sqrt(-q) / A;
    X1 = X;
    Y1 = Y;
    X2 = X;
    Y2 = -Y;
  } else {
    Y1 = 0;
    Y2 = 0;
    const r = b + Math.sign(b) * Math.sqrt(q);
    if (r === 0) {
      X1 = C / A;
      X2 = -C / A;
    } else {
      X1 = C / r;
      X2 = r / A;
    }
  }
  return [{
    real: X1,
    imag: Y1,
  },
  {
    real: X2,
    imag: Y2,
  }];
};

export const getCubicRoots = (A, B, C, D) => {
  let X;
  let a;
  let b1;
  let c2;
  if (A === 0) {
    X = undefined;
    a = B;
    b1 = C;
    c2 = D;
  } else if (D === 0) {
    X = 0;
    a = A;
    b1 = B;
    c2 = C;
  } else {
    a = A;
    X = -(B / A) / 3;
    let evalInfo = evaluate(X, A, B, C, D);
    let q = evalInfo.Q;
    let dq = evalInfo.dQ;
    b1 = evalInfo.B1;
    c2 = evalInfo.C2;

    let t = q / A;
    let r = Math.pow(Math.abs(t), 1 / 3);
    const s = Math.sign(t);
    t = -dq / A;
    if (t > 0) {
      r = 1.324717957244746 * Math.max(r, Math.sqrt(t));
    }
    let x0 = X - s * r;
    if (x0 !== X) {
      const den = 1 + (100 * EPS);
      do {
        X = x0;
        evalInfo = evaluate(X, A, B, C, D);
        q = evalInfo.Q;
        dq = evalInfo.dQ;
        b1 = evalInfo.B1;
        c2 = evalInfo.C2;
        x0 = (dq === 0 ? X : X - (q / dq) / den);
      } while (s * x0 > s * X);
      if (Math.abs(A) * X * X > Math.abs(D / X)) {
        c2 = -D / X;
        b1 = (c2 - C) / X;
      }
    }
  }
  const roots = [];
  if (X !== undefined) {
    roots.push({
      real: X,
      imag: 0,
    });
  }
  const quadInfo = qdrtc(a, b1, c2);
  return roots.concat(quadInfo);
};

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
    return rootMatch.reduce((t, r) => Math.max(r.real, t), 0);
  }
  return undefined;
};


import fs from 'fs';
import path from 'path';
import CurveInterpolator from '../src';

const points = [
  { x: 0, y: 4 },
  { x: 1, y: 2 },
  { x: 3, y: 6.5 },
  { x: 4, y: 8 },
  { x: 5.5, y: 4 },
  { x: 7, y: 3 },
  { x: 8, y: 0 },
];
const l = 0.73;
const interpolator = new CurveInterpolator(points, 0.50);
const data = {
  controlPoints: points,
  sample1: [{
    x: 6,
    y: interpolator.getYfromX(6),
  }],
  sample2: [{
    x: interpolator.getXfromY(4.5),
    y: 4.5,
  }],
  sample3: [interpolator.getPointAt(l)],
  sample4: interpolator.getPoints(1000),
  sample5: interpolator.getTangentAt(l),
};

fs.writeFileSync(path.join(__dirname, './static/data.json'), JSON.stringify(data));

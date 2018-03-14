
import fs from 'fs';
import path from 'path';
import CurveInterpolator from '../src';

// const data = [
//   { x: -2, y: 1 },
//   { x: 0, y: 5.5 },
//   { x: 3, y: 6 },
//   { x: 8, y: 3 },
//   { x: 13, y: 2.5 },
// ];
const data = [
  { x: 0, y: 4 },
  { x: 1, y: 2 },
  { x: 3, y: 6.5 },
  { x: 4, y: 8 },
  { x: 5.5, y: 4 },
  { x: 7, y: 3 },
  { x: 8, y: 0 },
];
const interpolator = new CurveInterpolator(data, 0.15);

it('Should have some test data', () => {
  fs.writeFileSync(path.join(__dirname, './static/data.json'), JSON.stringify(data));
});

it('Should interpolate by x', () => {
  const interpolated = [];
  for (let x = 0; x <= 1; x += 0.025) {
    interpolated.push({
      x: interpolator.denormalizeX(x),
      y: interpolator.getYfromX(x, true),
    });
  }
  fs.writeFileSync(path.join(__dirname, './static/interpolated_x.json'), JSON.stringify(interpolated));
});

it('Should interpolate by y', () => {
  const interpolated = [
    {
      x: interpolator.getXfromY(2.8),
      y: 2.8,
    },
    {
      x: interpolator.getXfromY(5),
      y: 5,
    },
    {
      x: interpolator.getXfromY(1.5),
      y: 1.5,
    },
    {
      x: interpolator.getXfromY(6),
      y: 6,
    },
    {
      x: interpolator.getXfromY(1),
      y: 1,
    },
  ];

  fs.writeFileSync(path.join(__dirname, './static/interpolated_y.json'), JSON.stringify(interpolated));
});

it('Should interpolate by t', () => {
  const interpolated = interpolator.getPoints(80);
  fs.writeFileSync(path.join(__dirname, './static/interpolated_t.json'), JSON.stringify(interpolated));
});

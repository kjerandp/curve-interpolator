# Curve Interpolator

A lib for interpolating values over a cubic Cardinal/Catmull-Rom spline curve.

## Installation
```bash
npm install --save curve-interpolator
```
## Basic usage
Reference the CurveInterpolator class:
```js
// commonjs
const CurveInterpolator = require('curve-interpolator').CurveInterpolator;

// es6
import { CurveInterpolator } from 'curve-interpolator';

```

Define controlpoints you want the curve to pass through and pass it to the constructor of the CurveInterpolator to create an instance:

```js
const points = [
  [0, 4],
  [1, 2],
  [3, 6.5],
  [4, 8],
  [5.5, 4],
  [7, 3],
  [8, 0],
  ...
];

const tension = 0.2;
const interp = new CurveInterpolator(points, tension);

// get single point
const position = 0.3 // [0 - 1]
const pt = interp.getPointAt(position)

// get points evently distributed along the curve
const nPoints = 1000;
const pts = interp.getPoints(nPoints - 1);

// lookup values along x and y axises
const yintersects = interp.y(position);

/*
max number of solutions (0 = all (default), 1 = first, -1 = last)
A negative max value counts solutions from end of curve
*/
const max = -1;
const xintersects = interp.x(position, max);

// get bounding box
const bbox = interp.getBoundingBox();
```

Online example on ObservableHQ:
https://observablehq.com/@kjerandp/curve-interpolator-v1

## Docs
Docs are generated using typedoc in `./docs`. To create:
```bash
npm run docs
```
Online: https://kjerandp.github.io/curve-interpolator/

## License
MIT

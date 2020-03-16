![](https://github.com/kjerandp/curve-interpolator/workflows/Node%20CI/badge.svg)
![](https://img.shields.io/npm/v/curve-interpolator)
# Curve Interpolator

A lib for interpolating values over a cubic Cardinal/Catmull-Rom spline curve of n-dimenesions.

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

const interp = new CurveInterpolator(points, { tension: 0.2 });

// get single point
const position = 0.3 // [0 - 1]
const pt = interp.getPointAt(position)

// get points evently distributed along the curve
const segments = 1000;
const pts = interp.getPoints(segments);

// lookup values along x and y axises
const axis = 1;
const yintersects = interp.lookup(7, axis);

/*
max number of solutions (0 = all (default), 1 = first, -1 = last)
A negative max value counts solutions from end of curve
*/
const axis = 0;
const max = -1;
const xintersects = interp.lookup(3.2, axis, max);

// get bounding box
const bbox = interp.getBoundingBox();
```

Online example on ObservableHQ:
- https://observablehq.com/@kjerandp/curveinterpolator-v2
- https://observablehq.com/@kjerandp/curve-interpolator-v1

## Docs
Docs are generated using typedoc in `./docs`. To create:
```bash
npm run docs
```
Online: https://kjerandp.github.io/curve-interpolator/

## License
MIT

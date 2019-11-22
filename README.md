# Curve Interpolator

A lib for interpolating values over a cubic Cardinal/Catmull-Rom spline curve.

## Installation
```
npm install --save curve-interpolator
```
## Usage
Reference the CurveInterpolator class:
```js
// commonjs
const CurveInterpolator = require('curve-interpolator');

// es6
import CurveInterpolator from 'curve-interpolator';

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

const interp = new CurveInterpolator(points);
```

## License
MIT

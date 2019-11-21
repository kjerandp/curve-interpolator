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
];

const interp = new CurveInterpolator(points);
```

You can now interpolate points by x, y or u (length):

```js
// x (first)
const y = interp.x(6, 1);
// returns: 3.6042079967035523

// y (last)
const x = interp.y(4.5, -1);
// returns: 2.15115721043274

// u - a value between 0 and 1, where  
//     u = 0 is at the beginning of the curve and
//     u = 1 is at the end of the curve
const point = interp.getPointAt(0.73);
// returns: [5.513154875514987, 3.9793004099653295]

// get a number of equally spaced points along the curve
const pointsOnCurve = interp.getPoints(1000);
// returns 1001 points on the curve (1000 segments/divisions)

// get tangent at length l
const vector = interp.getTangentAt(0.73);
// returns [0.557245952465003, -0.830347486574971]
```
![Graph](https://raw.githubusercontent.com/kjerandp/curve-interpolator/master/test/static/graph.png)

In this graph the control points are plotted as black dots and connected with a blue line. The red curve is made out of the 1001 equally spaced points from the example above.

## License
MIT

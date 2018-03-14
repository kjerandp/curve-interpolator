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
    { x: 0, y: 4 },
    { x: 1, y: 2 },
    { x: 3, y: 6.5 },
    { x: 4, y: 8 },
    { x: 5.5, y: 4 },
    { x: 7, y: 3 },
    { x: 8, y: 0 },
];

const interp = new CurveInterpolator(points);
```

You can now interpolate points by x, y or t:

```js
// x
const y = interp.getYfromX(6);
// returns: 3.5265251581944383

// y
const x = interp.getXfromY(4.5);
// returns: 2.1747870209623072

// t - a value between 0 and 1, where  
//     t=0 is at the beginning of the curve and
//     t=1 is at the end of the curve
const point = interp.getPointAt(0.9);
// returns: { x: 7.475143644790929, y: 1.7870044081993317 }

// get a number of equally spaced points along the curve
const pointsOnCurve = interp.getPoints(500);
// returns 501 points on the curve
```
![Graph](https://raw.githubusercontent.com/kjerandp/curve-interpolator/master/test/static/graph.png)

In this graph the control points are plotted as black dots and connected with a blue line. The red curve is made out of the 500 equally spaced points from the example above.

## Methods
| Method    | Parameters   | Description                                                                      
|-----------------|------------------|----------------------------------------------------------------------------------
| **constructor()** || Create an instance of the curve interpolator class, i.e. ```const interp = new CurveInterpolator(points, tension);```  
|| _points_       | Array of objects containing x and y values                                       
|| [_tension_=0]  | Number [0,1] to control tension of the curve. 0 = Catmull-Rom curve, 1=no curvage. Default is 0.
| **getYfromX()** alias: **y()**  || Find the first value of Y that matches a given value of X on the curve. 
|| _y_            | Number
|| [_isNormalized=false_] | Set to true if you want to pass _y_ as a value between 0 and 1, where y=0 represents the beginning of the curve on the y-scale and y=1 represents the end of the curve on the y-scale.
| **getXfromY()** alias: **x()**  || Find the first value of X that matches a given value of Y on the curve. 
|| _x_            | Number
|| [_isNormalized=false_] | Set to true if you want to pass _x_ as a value between 0 and 1, where x=0 represents the beginning of the curve on the x-scale and x=1 represents the end of the curve on the x-scale.
| **getPointAt()** || Returns a point object with values for x and y at a specific point t on the curve. 
|| _t_            | A value between 0 and 1, where 0 is at the start point of the curve and 1 is at the end point, according to the length of the curve.
| **getPoints()** || Returns an array of points equally spaced along the curve. 
|| _divisions_            | The number of segments to divide the curve into, where the number of points returned equals to divisions + 1 (start and end point of each segment).
| **getLength()** || Returns the length of the curve.

## Note
This is still work in progress.

## Credits
Parts of this lib is based on the spline curve implementation in  [Three.js](https://github.com/mrdoob/three.js/). A big thanks to the author and contributors for a really awesome library!

## License
MIT

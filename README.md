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

You can now interpolate points by x, y or l (length):

```js
// x
const y = interp.getYfromX(6);
// returns: 3.6042079967035523

// y
const x = interp.getXfromY(4.5);
// returns: 2.15115721043274

// l - a value between 0 and 1, where  
//     l = 0 is at the beginning of the curve and
//     l = 1 is at the end of the curve
const point = interp.getPointAt(0.9);
// returns: {'x': 7.455605538078618, 'y': 1.7555441418042927}

// get a number of equally spaced points along the curve
const pointsOnCurve = interp.getPoints(1000);
// returns 1001 points on the curve (1000 segments/divisions)
```
![Graph](https://raw.githubusercontent.com/kjerandp/curve-interpolator/master/test/static/graph.png)

In this graph the control points are plotted as black dots and connected with a blue line. The red curve is made out of the 1001 equally spaced points from the example above.

## Methods
### constructor(points, [tension = 0])
Create an instance of the curve interpolator class, i.e. 
```js
const interp = new CurveInterpolator(points, tension);
```  
| Parameter     | Description
|---------------|--------------------------------------------|
| points    | Array of objects containing x and y values |
| tension   | Number [0,1] to control tension of the curve. 0 = Catmull-Rom curve, 1=no curvage. Default is 0.


### getYfromX(x, [isNormalized = false]) 

Alias: __y(x, [isNormalized = false])__

Find the first value of Y that matches a given value of X on the curve. 

| Parameter     | Description
|---------------|--------------------------------------------|
| x             | Number
| isNormalized  | Set to true if you want to pass _x_ as a value between 0 and 1, where x=0 represents the beginning of the curve on the x-scale and x=1 represents the end of the curve on the x-scale.


### getXfromY(y, [isNormalized = false]) 

Alias: __x(y, [isNormalized = false])__

Find the first value of X that matches a given value of Y on the curve. 

| Parameter     | Description
|---------------|--------------------------------------------|
| y             | Number
| isNormalized  | Set to true if you want to pass _y_ as a value between 0 and 1, where y=0 represents the beginning of the curve on the y-scale and y=1 represents the end of the curve on the y-scale.


### getPointAt(l) 

Returns a point object with values for x and y at a specific point l on the curve.

| Parameter     | Description
|---------------|--------------------------------------------|
| l             | A value between 0 and 1, where 0 is at the start point of the curve and 1 is at the end point, according to the length of the curve.


### getPoints(divisions) 

Returns an array of points equally spaced along the curve.

| Parameter     | Description
|---------------|--------------------------------------------|
| divisions             | The number of segments to divide the curve into, where the number of points returned equals to divisions + 1 (start and end point of each segment).

### getTangentAt(l) 

Find the tangent at a specific point l on the curve. Returns a normalized vector of [x, y].

| Parameter     | Description
|---------------|--------------------------------------------|
| l             | A value between 0 and 1, where 0 is at the start point of the curve and 1 is at the end point, according to the length of the curve.

### getLength() 

Returns the full length of the curve.


## Credits
Parts of this lib is based on the spline curve implementation in  [Three.js](https://github.com/mrdoob/three.js/). A big thanks to the author and contributors for a really awesome library!

## License
MIT

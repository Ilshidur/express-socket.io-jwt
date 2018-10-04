# express-socket.io-jwt

![stability-unstable](https://img.shields.io/badge/stability-unstable-yellow.svg)

[![npm version][version-badge]][version-url]
[![Known Vulnerabilities][vulnerabilities-badge]][vulnerabilities-url]
[![dependency status][dependency-badge]][dependency-url]
[![devdependency status][devdependency-badge]][devdependency-url]
[![build status][build-badge]][build-url]
[![Code Climate][maintainability-badge]][maintainability-url]
[![downloads][downloads-badge]][downloads-url]

[![NPM][npm-stats-badge]][npm-stats-url]

> Express + Socket.io synchronization using JWT. Use sockets in your express routes with `req.getSocket()`.

## Status

This is more a proof of concept than an actual package at the moment and is not entirely tested for great scaling.
Use it at your own risk.

## Features

* Works with Single Page Applications & server-rendered pages
* Compatible with Socket.io authorization middlewares
* Compatible with Socket.io adapters
* Compatible with Socket.io sticky sessions
* Handles multiple sockets for 1 HTTP request
* Compatible with cookies & LocalStorage use

## Compatibility

**Socket.io version >= 2.0**

## Examples

### Simple example

```javascript
const express = require('express');
const server = require('http').Server(app);
const io = require('socket.io')(server);
const socketAuth = require('express-socket.io-jwt');

const socketMiddleware = socketAuth.createMiddleware(io, {
  // Set a static JWT secret :
  secret: 'JWT_SECRET',
});

app.get('/ROUTE', socketMiddleware(), (req, res, next) => {
  // const userSocket = req.getSocket() ...
});

server.listen(3000);
```

### Full example

```javascript
const express = require('express');
const server = require('http').Server(app);
const io = require('socket.io')(server);
const socketAuth = require('express-socket.io-jwt');

const socketMiddleware = socketAuth.createMiddleware(io, {
  // Set a static JWT secret :
  secret: 'JWT_SECRET',
  // Optional : extracts the JWT from the socket request
  jwtFromRequest: ({ cookie, queryParams }, socket) => {
    return cookie.jwt; // For cookie usage
    return queryParams['token']; // For LocalStorage usage
  },
  // Optional :
  connectionNameFromRequest: ({ queryParams }) => queryParams.name,
  // Optional :
  onSocketParseError: (err, socket, next) => {
    console.error(err);
    return next(new Error('Could not decode socket token'));
  },
});

app.get('/ROUTE', socketMiddleware({ required: true, matchSocket: 'ip' }), async (req, res, next) => {
  // Extract the associated Socket of the request
  const socket = req.getSocket();
  const payload = await socket.payload;
  socket.emit('hello', `Hit to /ROUTE from ${payload.whateverProperty}`);

  // ...
});

server.listen(3000);
```

## API

```javascript
const socketAuth = require('express-socket.io-jwt');
```

### `socketAuth#createMiddleware(io, opts)`

Initializes a new middleware function.

*Returns a new middleware function `socketMiddleware()`.*

**Arguments :**

* `io` (**required**, Socket.io `Server`) : the socket.io server. Throws an error if not set.
* `opts` (**optional**, `object`, default `{}`) : optional initialization options
  * `secret` (**required**, `String`) : the JWT secret string.
  * `jwtFromRequest` (`function({ cookie, queryParams }, socket)`) : extracts the JWT from the socket connection's cookies or query parameters.
    * argument `cookie` (`object`) : user's cookies passed in the socket connection
    * argument `queryParams` (`object`) : query parameters passed in the socket connection initialization string
  * `connectionNameFromRequest` (`function({ cookie, queryParams }, socket)`) : extracts the "connection name" from the socket connection's cookies or query parameters. The connection name is set by the socket.io client and allows the handling of multiple socket.io connections for 1 user with `req.getSocket([connectionName])`.
    * argument `cookie` (`object`) : user's cookies passed in the socket connection
    * argument `queryParams` (`object`) : query parameters passed in the socket connection initialization string
  * `onSocketParseError` (`function(err, socket, next)`) : *TODO*

<hr />

```javascript
const socketMiddleware = socketAuth.createMiddleware(/* opts */);
```

### `socketMiddleware(opts)`

Middleware adding the `req.getSocket()` method, allowing the use of the client's socket in express routes.

*Returns a new middleware, ready to be used.*

**Arguments :**

* `opts` (**optional**, default `{}`) : optional initialization options
  * `required` (`Boolean`, default `true`) : if `true`, throws an error if the route is accessed without a corresponding socket connection
  * `matchSocket` (`String|function(req, socket) => Boolean`) : check if a HTTP request comes from the same user browser that holds the socket. By default, returns `true` if the `req` and `socket` IP matches. If `required` is set to `false`, the middleware will not throw and still call `next()`. Allowed values : `'ip'`, `'cookie'` or a function.
    * argument `req` (express `Request`) : user request
    * argument `socket` (socket.io `Socket`) : user socket.io connection

<hr />

```javascript
app.get('/ROUTE', socketMiddleware(), (req, res, next) => {
  // const userSocket = req.getSocket() ...
});
```

### `req.getSocket([connectionName])`

Gets a single socket associated to the user. The socket is validated through the `matchSocket` parameter of `socketMiddleware(opts)`.

*Returns a socket.io `Socket`. If no socket is found and the `required` parameter is falsy, returns `undefined`.*

**Arguments :**

* `connectionName` (**optional**, default `undefined`) : get a socket initiated with a connection name and passed to `connectionNameFromRequest()`.

## Scaling

When scaling the app across multiple Node.js instances, it is **required** to use sticky sessions for socket.io.

```javascript
const express = require('express');
const server = require('http').Server(app);
const io = require('socket.io')(server);
const socketAuth = require('express-socket.io-jwt');
// Use Redis PubSub to share events across Node.js processes
const redisAdapter = require('socket.io-redis');
// Use sticky sessions
const sticky = require('sticky-session');

const app = express();
const socketMiddleware = socketAuth.createMiddleware(io);

io.adapter(redisAdapter({ host: 'localhost', port: 6379 }));

app.use(socketMiddleware());

// [ Routes ... ]

sticky.listen(server, 3001);
```

## License

MIT License

Copyright (c) 2017-2018 **Nicolas COUTIN**

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

[version-badge]: https://img.shields.io/npm/v/express-socket.io-jwt.svg
[version-url]: https://www.npmjs.com/package/express-socket.io-jwt
[vulnerabilities-badge]: https://snyk.io/test/npm/express-socket.io-jwt/badge.svg
[vulnerabilities-url]: https://snyk.io/test/npm/express-socket.io-jwt
[dependency-badge]: https://david-dm.org/ilshidur/express-socket.io-jwt.svg
[dependency-url]: https://david-dm.org/ilshidur/express-socket.io-jwt
[devdependency-badge]: https://david-dm.org/ilshidur/express-socket.io-jwt/dev-status.svg
[devdependency-url]: https://david-dm.org/ilshidur/express-socket.io-jwt#info=devDependencies
[build-badge]: https://travis-ci.org/Ilshidur/express-socket.io-jwt.svg
[build-url]: https://travis-ci.org/Ilshidur/express-socket.io-jwt
[maintainability-badge]: https://api.codeclimate.com/v1/badges/1a591845db8b23c4cd06/maintainability
[maintainability-url]: https://codeclimate.com/github/Ilshidur/express-socket.io-jwt/maintainability
[downloads-badge]: https://img.shields.io/npm/dt/express-socket.io-jwt.svg
[downloads-url]: https://www.npmjs.com/package/express-socket.io-jwt
[npm-stats-badge]: https://nodei.co/npm/express-socket.io-jwt.png?downloads=true&downloadRank=true
[npm-stats-url]: https://nodei.co/npm/express-socket.io-jwt

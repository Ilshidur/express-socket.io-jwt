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

> Express + Socket.io synchronization. Use socket in your express routes.

## Status

This is more a proof of concept than an actual package at the moment and is not entirely tested for great scaling.
Use it at your own risk.

## Features

* Works with Single Page Applications & server-rendered pages
* Compatible with Socket.io authorization middlewares
* Compatible with Socket.io adapters
* Compatible with Socket.io sticky sessions
* Handles multiple sockets for 1 HTTP request
* Supports both cookies & LocalStorage from client

## TODOs

- [ ] Docs (API)

## Note

Requires the use of cookies by default. This behavior can be overriden with the `verify` parameter.

## Compatibility

**Socket.io version >= 2.0**

## Example

**Server :**

```javascript
const express = require('express');
const server = require('http').Server(app);
const io = require('socket.io')(server);
const socketAuth = require('express-socket.io-jwt');

const socketMiddleware = socketAuth.createMiddleware(io, {
  // Set a static JWT secret :
  secret: 'JWT_SECRET',
  // or providing dynamic JWT secret :
  secret: (req) => {
    // Can be useful to sign tokens with dynamic token, thus allowing easy invalidation.
    // e.g.: sign with a user password hash to invalidate when they change their password
    return `JWT_SECRET_${req.user.passwordHash}`;
  },
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

app.get('/ROUTE', socketMiddleware({ required: true, verify: () => true }), async (req, res, next) => {
  // Extract the associated Socket of the request
  const socket = req.getSocket();
  const payload = await socket.getPayload();
  socket.emit('hello', `Hit to /ROUTE from ${payload.whateverProperty}`);

  // ...
});

server.listen(3000);
```

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

io.adapter(redisAdapter({ host: 'localhost', port: 6379 }));

app.use(socketAuth.io(...));

// [ Routes ... ]

sticky.listen(server, 3001);
```

## Multiple sockets per HTTP request

Will match any socket connection to a HTTP request by their IP.
Further verification can be implemented through the option `verify`.

```javascript
verify: (req, socket) => {
  // Using http authentication middleware:
  return req.user.id === socket.payload.user.id;
  // In order to differenciate multiple sockets for one single user :
  // If a string is returned, the socket can be retrieved in Express with req.getSocket('RETURNED STRING')
  return req.user.id === socket.payload.user.id ? socket.getConnectionName() : false;
}
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

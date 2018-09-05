const jwt = require('jsonwebtoken');
const { isEqual: ipEquals } = require('ip');

const defaultJwtFromRequest = ({ cookie, queryParams }) => cookie.jwt || queryParams.token;
const defaultConnectionNameFromRequest = () => null;
const defaultVerify = (req, socket) => req.cookies ? req.cookies.io === socket.id : false;

// TODO: const compare = (req, socket)
function getSocketsFromIp(namespace, ip) {
  return Object.keys(namespace.connected)
    // .filter((socketId) => {
    //   const socket = namespace.connected[socketId];
    //   console.log(socket.handshake.address, ip, ipEquals(socket.handshake.address, ip));
    //   return ipEquals(socket.handshake.address, ip);
    // })
    .reduce((acc, socketId) => {
      const socket = namespace.connected[socketId];
      return { ...acc, [socket.connectionName]: socket };
    }, {});
}

const authenticateSocketMiddleware =
  io =>
  ({
    verify = defaultVerify,
    required = true,
  }) =>
  async (req, res, next) => {
    let sockets;
    try {
      const namespace = io.of('/');
      sockets = getSocketsFromIp(namespace, req.ip);
    } catch (err) {
      return next(err);
    }

    io.of('/').clients((err, clients) => { console.log(err, clients) });
    console.log(Object.keys(io.of('/').sockets).length);

    console.log(Object.keys(io.sockets.connected).length);
    console.log(sockets);

    if (Object.values(sockets).length === 0 && required) {
      return next(new Error('Unauthorized'));
    }

    const validateSockets = Object.keys(sockets).map(async (connectionName) => {
      const socket = sockets[connectionName];

      console.log(socket.payload);

      if (socket && !socket.token && required) {
        throw new Error('Unauthorized');
      }

      // const payload = await socket.getPayload();
      const payload = socket.payload;
      if (socket && !payload && required) {
        throw new Error('Unauthorized');
      }

      const verified = await verify(req, socket);

      if (socket && !verified && required) {
        throw new Error('Unauthorized');
      }
    });

    try {
      await Promise.all(validateSockets);
    } catch (err) {
      return next(err);
    }

    req.getSocket = (connection) => connection ? sockets[connection] : Object.values(sockets)[0];

    next();
  };

async function parseSocketJwt(socket, { jwtFromRequest, secret, connectionNameFromRequest }) {
  const cookie = socket.request;
  const queryParams = socket.handshake.query;

  // TODO: Option for the request to wait for the socket to prepare

  socket.token = await jwtFromRequest({ cookie, queryParams }, socket);
  socket.secret = typeof secret === 'function' ? await secret(req) : secret;
  socket.payload = jwt.verify(socket.token, socket.secret);
  socket.connectionName = await connectionNameFromRequest({ cookie, queryParams }, socket);
}

const defaultOnSocketParseError = (err, socket, next) => {
  console.error(err); // TODO: Remove
  return next(new Error('Could not decode socket token'));
}

const socketMiddleware = ({
  secret,
  jwtFromRequest = defaultJwtFromRequest,
  connectionNameFromRequest = defaultConnectionNameFromRequest,
  onSocketParseError = defaultOnSocketParseError,
}) => async (socket, next) => {
  try {
    await parseSocketJwt(socket, { secret, jwtFromRequest, connectionNameFromRequest });
  } catch (err) {
    onSocketParseError(err, socket, next);
    return;
  }
  next();
};

// TODO: Allow choice of namespaces to '.use' (string or function)
const createMiddleware = (io, opts) => {
  io.use(socketMiddleware(opts));
  return authenticateSocketMiddleware(io);
};

module.exports.createMiddleware = createMiddleware;

const jwt = require('jsonwebtoken');
const { isEqual: ipEquals } = require('ip');

// Default input functions
const defaultJwtFromRequest = ({ cookie, queryParams }) => cookie.jwt || queryParams.token;
const defaultConnectionNameFromRequest = () => null;
const defaultOnSocketParseError = (err, socket, next) => next(new Error('Could not decode socket token'));

const indexSockets = sockets => sockets.reduce((acc, socket) => ({
  ...acc, [socket.connectionName]: socket,
}), {});

const authenticateSocketMiddleware =
  io =>
    ({
      matchSocket = 'ip',
      required = true,
    }) =>
      async (req, res, next) => {
        function filterSockets(request, namespace, filterFunc) {
          return Object.values(namespace.connected).filter(socket => filterFunc(request, socket));
        }

        let sockets;
        try {
          const namespace = io.of('/');

          switch (matchSocket) {
            case 'ip':
              sockets = filterSockets(
                req,
                namespace,
                (request, socket) => ipEquals(request.ip, socket.handshake.address),
              );
              break;
            case 'cookie':
              sockets = filterSockets(
                req,
                namespace,
                (request, socket) => (request.cookies ? request.cookies.io === socket.id : false),
              );
              break;
            default:
              sockets = filterSockets(
                req,
                namespace,
                matchSocket,
              );
          }
        } catch (err) {
          return next(err);
        }

        if (sockets.length === 0 && required) {
          return next(new Error('Unauthorized'));
        }

        const indexedSockets = indexSockets(sockets);

        const validateSockets = sockets.map(async (socket) => {
          if (!required) {
            return;
          }

          if (socket && !socket.token && required) {
            throw new Error('Unauthorized');
          }

          if (socket && !socket.payload && required) {
            throw new Error('Unauthorized');
          }
        });

        try {
          await Promise.all(validateSockets);
        } catch (err) {
          return next(err);
        }

        req.getSocket = connection => (connection ? indexedSockets[connection] : sockets[0]);

        return next();
      };

async function parseSocketJwt(socket, { jwtFromRequest, secret, connectionNameFromRequest }) {
  const cookie = socket.request;
  const queryParams = socket.handshake.query;

  // TODO: Option for the request to wait for the socket to prepare

  socket.token = await jwtFromRequest({ cookie, queryParams }, socket);
  socket.payload = socket.token ? jwt.verify(socket.token, secret) : null;
  socket.connectionName = await connectionNameFromRequest({ cookie, queryParams }, socket);
}

const socketMiddleware = ({
  secret,
  jwtFromRequest = defaultJwtFromRequest,
  connectionNameFromRequest = defaultConnectionNameFromRequest,
  onSocketParseError = defaultOnSocketParseError,
} = {}) => async (socket, next) => {
  if (!secret) {
    const err = new Error('Cannot decode socket JWT because secret is missing in the server');
    onSocketParseError(err, socket, next);
    return;
  }

  try {
    await parseSocketJwt(socket, { secret, jwtFromRequest, connectionNameFromRequest });
  } catch (err) {
    onSocketParseError(err, socket, next);
    return;
  }
  next();
};

// TODO: Allow choice of namespaces to '.use' (string or function)
const createMiddleware = (io, opts = {}) => {
  if (!io) {
    throw new Error('Missing socket.io server');
  }

  io.use(socketMiddleware(opts));
  return authenticateSocketMiddleware(io);
};

module.exports.createMiddleware = createMiddleware;

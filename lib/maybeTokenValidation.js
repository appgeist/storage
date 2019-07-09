class AuthorizationError extends Error {
  constructor(msg) {
    super(msg);
    this.name = this.constructor.name;
  }
}

module.exports = validateToken =>
  typeof validateToken === 'function'
    ? [
      async (req, res, next) => {
        try {
          const authorizationHeader = req.headers ? req.headers.authorization : null;
          if (!authorizationHeader) {
            throw new AuthorizationError('No authorization header found');
          }
          const headerItems = authorizationHeader.split(' ');
          if (headerItems.length !== 2 || headerItems[0].toLowerCase() !== 'bearer') {
            throw new AuthorizationError('Malformed authorization header');
          }
          // A bearer token was found, so ckeck it and move on to the next middleware if validateToken returns true
          if (await validateToken(headerItems[1])) {
            next();
          } else {
            throw new AuthorizationError('Invalid authorization bearer token');
          }
        } catch (err) {
          if (err instanceof AuthorizationError) {
            res.status(401).send({ error: err.message });
          } else {
            next(err);
          }
        }
      }
    ]
    : [];

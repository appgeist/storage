module.exports = (err, req, res, next) => {
  if (res.headersSent) return next(err);
  // eslint-disable-next-line no-console
  console.log(err.stack);
  return res.status(500).send({ error: 'Internal server error' });
};

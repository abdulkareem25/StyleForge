module.exports = (err, _req, res, _next) => {
  console.error(err.stack || err.message || err);
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    data: null,
    error: err.message || 'Internal server error',
  });
};

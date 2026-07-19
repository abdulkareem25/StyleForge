const { ZodError } = require('zod');

module.exports = (schema, source = 'body') => (req, res, next) => {
  try {
    req[source] = schema.parse(req[source]);
    next();
  } catch (err) {
    if (err instanceof ZodError) {
      const messages = err.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
      return res.status(400).json({
        success: false,
        data: null,
        error: messages.join(', '),
      });
    }
    next(err);
  }
};

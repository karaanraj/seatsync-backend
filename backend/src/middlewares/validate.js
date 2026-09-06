const { ValidationError } = require('../utils/errors');

const validate = (schema) => {
  return async (req, res, next) => {
    try {
      if (schema.body) {
        req.body = await schema.body.parseAsync(req.body);
      }
      if (schema.query) {
        req.query = await schema.query.parseAsync(req.query);
      }
      if (schema.params) {
        req.params = await schema.params.parseAsync(req.params);
      }
      next();
    } catch (error) {
      if (error.errors) {
        const formatted = error.errors.map((err) => ({
          path: err.path.join('.'),
          message: err.message,
        }));
        return next(new ValidationError('Request validation failed', formatted));
      }
      next(error);
    }
  };
};

module.exports = validate;

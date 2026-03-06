const validate = (schema) => (req, res, next) => {
  try {
    const { error, value } = schema.validate(
      {
        body: req.body,
        params: req.params,
        query: req.query,
      },
      {
        abortEarly: false,
        allowUnknown: true,
      },
    );

    if (error) {
      return res.status(400).json({
        message: "Validation failed",
        errors: error.details.map((detail) => ({
          path: detail.path.join("."),
          message: detail.message,
        })),
      });
    }

    req.body = value.body;
    req.params = value.params;
    req.query = value.query;

    return next();
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = { validate };

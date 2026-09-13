export const errorHandler = (err, req, res, next) => {
  if (err.name === "SequelizeValidationError") {
    res.status(422).json({
      err: err.errors[0].message,
    });
  }

  res.status(Number(err.cause) || 500).json({
    msg: err.message,
    err,
  });
};

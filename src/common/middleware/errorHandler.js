export const errorHandler = (err, req, res, next) => {
  if (err.name === "SequelizeValidationError") {
    return res.status(422).json({
      err: err.errors[0].message,
    });
  }

   if (err.name === "SequelizeUniqueConstraintError") {
     const field = err.errors?.[0]?.path ?? "field";

     return res.status(409).json({
       msg: `${field} is already used`,
     });
   }

  return res.status(Number(err.cause) || 500).json({
    msg: err.message,
  });
};

export const response = ({
  res,
  msg = "done",
  data = undefined,
  status = 200,
}) => {
  return res.status(status).json({
    msg,
    data,
  });
};

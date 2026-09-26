const errorMiddleware = (error, req, res, next) => {
  console.error(error);

  if (res.headersSent) {
    return next(error);
  }

  res.status(400).json({
    success: false,
    message: error.message || "Something went wrong",
  });
};

module.exports = errorMiddleware;

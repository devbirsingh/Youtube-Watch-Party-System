export const errorMiddleware = (
  error,
  req,
  res,
  next
) => {
  console.error(error);


  // Mongoose validation error.
  if (error.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors: Object.values(
        error.errors
      ).map(
        (item) => item.message
      ),
    });
  }


  // Mongo duplicate key.
  if (error.code === 11000) {
    return res.status(409).json({
      success: false,
      message:
        "A record with this value already exists",
    });
  }


  return res.status(500).json({
    success: false,
    message:
      error.message ||
      "Internal server error",
  });
};
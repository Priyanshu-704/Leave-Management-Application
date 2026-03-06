export const getErrorMessage = (error, fallback = "Something went wrong") =>
  error?.message ||
  error?.response?.data?.message ||
  fallback;

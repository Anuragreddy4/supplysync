export const successResponse = <T>(data: T) => {
  return {
    success: true,
    data,
    error: null,
  };
};

export const errorResponse = (code: string, message: string) => {
  return {
    success: false,
    data: null,
    error: {
      code,
      message,
    },
  };
};

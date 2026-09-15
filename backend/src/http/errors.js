export class HttpError extends Error {
  constructor(status, code, message, details = {}) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function sendError(res, requestId, error) {
  return res.status(error.status).json({
    error: {
      code: error.code,
      message: error.message,
      details: error.details,
      requestId,
    },
  });
}

export function asyncHandler(handler) {
  return function handledRequest(req, res, next) {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

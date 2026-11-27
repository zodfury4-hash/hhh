'use strict';

function sendSuccess(res, payload = {}, statusCode = 200) {
  return res.status(statusCode).json({
    ok: true,
    success: true,
    ...payload
  });
}

function sendError(res, message, code = 'BAD_REQUEST', statusCode = 400, extra = {}) {
  return res.status(statusCode).json({
    ok: false,
    error: message,
    code,
    ...extra
  });
}

module.exports = {
  sendSuccess,
  sendError
};

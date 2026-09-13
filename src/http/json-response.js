"use strict";

function json(res, statusCode, body, extraHeaders = {}) {
  if (res.headersSent) return false;
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    ...extraHeaders
  });
  res.end(JSON.stringify(body));
  return true;
}

module.exports = { json };

"use strict";

function readBody(req, { maxBytes = 1_000_000 } = {}) {
  return new Promise((resolve, reject) => {
    let value = "";
    let settled = false;

    const fail = error => {
      if (settled) return;
      settled = true;
      reject(error);
    };

    req.on("data", chunk => {
      if (settled) return;
      value += chunk;
      if (Buffer.byteLength(value, "utf8") > maxBytes) {
        fail(Object.assign(new Error("Request body is too large"), { code: "REQUEST_TOO_LARGE" }));
        req.destroy();
      }
    });

    req.on("end", () => {
      if (settled) return;
      try {
        settled = true;
        resolve(value ? JSON.parse(value) : {});
      } catch {
        fail(Object.assign(new Error("Invalid JSON request body"), { code: "INVALID_JSON" }));
      }
    });

    req.on("error", fail);
  });
}

module.exports = { readBody };

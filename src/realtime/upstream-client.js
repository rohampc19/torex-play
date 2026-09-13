"use strict";

const http = require("http");

class UpstreamClient {
  constructor({ host = "127.0.0.1", port }) {
    this.host = host;
    this.port = port;
  }

  request(options, body) {
    return new Promise((resolve, reject) => {
      const req = http.request({ hostname: this.host, port: this.port, ...options }, res => {
        const chunks = [];
        res.on("data", chunk => chunks.push(chunk));
        res.on("end", () => resolve({
          statusCode: res.statusCode || 500,
          headers: res.headers,
          body: Buffer.concat(chunks)
        }));
      });
      req.on("error", reject);
      if (body) req.write(body);
      req.end();
    });
  }
}

module.exports = { UpstreamClient };

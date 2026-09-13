"use strict";

const path = require("path");

const ROOT = path.resolve(__dirname, "..");

module.exports = Object.freeze({
  root: ROOT,
  publicPort: Number(process.env.PORT || 3000),
  apiPort: Number(process.env.TOREX_API_PORT || 3001),
  dataFile: path.join(ROOT, "torex-data.json"),
  env: process.env.NODE_ENV || "development"
});

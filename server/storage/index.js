"use strict";

const path = require("path");
const { JsonRepository } = require("./json-repository");

function createRepository(rootDir, file = process.env.DATA_FILE || "torex-data.json") {
  return new JsonRepository(path.isAbsolute(file) ? file : path.join(rootDir, file));
}

module.exports = { createRepository };

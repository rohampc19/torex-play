"use strict";

const fs = require("fs");
const path = require("path");

const CURRENT_SCHEMA_VERSION = 1;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

class JsonRepository {
  constructor(file) {
    this.file = path.resolve(file);
    this.tmp = `${this.file}.tmp`;
  }

  read(fallback) {
    try {
      const parsed = JSON.parse(fs.readFileSync(this.file, "utf8"));
      return this.migrate(parsed);
    } catch {
      return clone(fallback);
    }
  }

  write(value) {
    const payload = JSON.stringify({ ...value, schemaVersion: CURRENT_SCHEMA_VERSION }, null, 2);
    fs.writeFileSync(this.tmp, payload, "utf8");
    fs.renameSync(this.tmp, this.file);
  }

  transaction(mutator, fallback) {
    const data = this.read(fallback);
    const next = mutator(data) || data;
    this.write(next);
    return next;
  }

  migrate(data) {
    const next = data && typeof data === "object" ? data : {};
    if (!Number.isInteger(next.schemaVersion)) next.schemaVersion = CURRENT_SCHEMA_VERSION;
    if (next.schemaVersion < CURRENT_SCHEMA_VERSION) next.schemaVersion = CURRENT_SCHEMA_VERSION;
    return next;
  }
}

module.exports = { JsonRepository, CURRENT_SCHEMA_VERSION };

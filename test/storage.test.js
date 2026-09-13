"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { JsonRepository } = require("../server/storage/json-repository");

test("JSON repository writes atomically and preserves schema version", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "torex-play-"));
  const file = path.join(dir, "data.json");
  const repo = new JsonRepository(file);
  repo.write({ users: [] });
  const loaded = repo.read({ users: [] });
  assert.equal(loaded.schemaVersion, 1);
  assert.deepEqual(loaded.users, []);
  fs.rmSync(dir, { recursive: true, force: true });
});

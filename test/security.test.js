"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { createToken, isSessionFresh } = require("../server/security");

test("creates cryptographically random tokens", () => {
  const a = createToken();
  const b = createToken();
  assert.equal(a.length, 64);
  assert.equal(b.length, 64);
  assert.notEqual(a, b);
});

test("expires old sessions", () => {
  assert.equal(isSessionFresh(new Date(Date.now() - 1000).toISOString()), true);
  assert.equal(isSessionFresh(new Date(Date.now() - 90000000).toISOString()), false);
});

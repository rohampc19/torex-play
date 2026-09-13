"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  validateUsername,
  validatePhone,
  validatePassword,
  validateNewsInput
} = require("../server/validation");

test("validates usernames", () => {
  assert.equal(validateUsername("roham_14").ok, true);
  assert.equal(validateUsername("a").ok, false);
  assert.equal(validateUsername("bad user").ok, false);
});

test("validates Iranian mobile numbers", () => {
  assert.equal(validatePhone("09123456789").ok, true);
  assert.equal(validatePhone("123").ok, false);
});

test("enforces a sane password length", () => {
  assert.equal(validatePassword("12345678").ok, true);
  assert.equal(validatePassword("1234567").ok, false);
  assert.equal(validatePassword("x".repeat(129)).ok, false);
});

test("validates news payloads and trims them", () => {
  const result = validateNewsInput({ title: "  خبر  ", text: "  متن خبر  " });
  assert.deepEqual(result.value, { title: "خبر", text: "متن خبر" });
  assert.equal(validateNewsInput({ title: "", text: "x" }).ok, false);
});

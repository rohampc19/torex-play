"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { Router } = require("../src/http/router");
const { RateLimiter } = require("../src/security/rate-limiter");
const { hashPasswordSync, verifyPassword } = require("../src/security/password");

test("Router matches method and exact pathname", async () => {
  const router = new Router();
  let called = false;
  router.get("/api/health", async () => { called = true; });

  const match = router.match("GET", "/api/health");
  assert.ok(match);
  assert.equal(router.match("POST", "/api/health"), null);

  await router.handle(
    { method: "GET", url: "/api/health" },
    {},
  );
  assert.equal(called, true);
});

test("Router supports regex route parameters", () => {
  const router = new Router();
  router.get(/^\/api\/users\/([^/]+)$/, () => {});
  const route = router.match("GET", "/api/users/roham");
  assert.ok(route);
  assert.equal(route.pattern.exec("/api/users/roham")[1], "roham");
});

test("RateLimiter blocks only after the configured limit", () => {
  const limiter = new RateLimiter({ windowMs: 60_000, max: 2, keyFn: (_req, key) => key });
  const request = { socket: { remoteAddress: "test" } };
  assert.equal(limiter.allow(request, "login"), true);
  assert.equal(limiter.allow(request, "login"), true);
  assert.equal(limiter.allow(request, "login"), false);
  assert.equal(limiter.allow(request, "register"), true);
});

test("password hashes verify without storing plaintext", async () => {
  const password = "Example-Password-123";
  const hash = hashPasswordSync(password);
  assert.notEqual(hash, password);
  assert.match(hash, /^pbkdf2\$120000\$/);
  assert.equal(await verifyPassword(password, hash), true);
  assert.equal(await verifyPassword("wrong-password", hash), false);
});

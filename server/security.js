"use strict";

const crypto = require("crypto");

const SESSION_TTL_MS = Number(process.env.SESSION_TTL_MS || 86400000);
const ADMIN_KEY = String(process.env.ADMIN_KEY || "").trim();

function createToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString("hex");
}

function isAdminKeyValid(value) {
  if (!ADMIN_KEY || !value) return false;
  const provided = Buffer.from(String(value));
  const expected = Buffer.from(ADMIN_KEY);
  return provided.length === expected.length && crypto.timingSafeEqual(provided, expected);
}

function isSessionFresh(createdAt, now = Date.now()) {
  const time = new Date(createdAt).getTime();
  return Number.isFinite(time) && now - time >= 0 && now - time < SESSION_TTL_MS;
}

module.exports = { SESSION_TTL_MS, createToken, isAdminKeyValid, isSessionFresh };

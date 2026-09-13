"use strict";

const crypto = require("crypto");

const ITERATIONS = 120_000;
const KEY_LENGTH = 32;
const DIGEST = "sha256";

function hashPasswordSync(password) {
  const salt = crypto.randomBytes(16);
  const derived = crypto.pbkdf2Sync(String(password), salt, ITERATIONS, KEY_LENGTH, DIGEST);
  return `pbkdf2$${ITERATIONS}$${salt.toString("hex")}$${derived.toString("hex")}`;
}

function hashPassword(password) {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16);
    crypto.pbkdf2(String(password), salt, ITERATIONS, KEY_LENGTH, DIGEST, (error, derived) => {
      if (error) return reject(error);
      resolve(`pbkdf2$${ITERATIONS}$${salt.toString("hex")}$${derived.toString("hex")}`);
    });
  });
}

function verifyPassword(password, stored) {
  return new Promise((resolve, reject) => {
    const parts = String(stored || "").split("$");
    if (parts.length !== 4 || parts[0] !== "pbkdf2") return resolve(false);

    const iterations = Number(parts[1]);
    if (!Number.isInteger(iterations) || iterations < 1) return resolve(false);

    let salt;
    let expected;
    try {
      salt = Buffer.from(parts[2], "hex");
      expected = Buffer.from(parts[3], "hex");
    } catch {
      return resolve(false);
    }

    crypto.pbkdf2(String(password), salt, iterations, KEY_LENGTH, DIGEST, (error, derived) => {
      if (error) return reject(error);
      resolve(expected.length === derived.length && crypto.timingSafeEqual(expected, derived));
    });
  });
}

module.exports = {
  ITERATIONS,
  KEY_LENGTH,
  DIGEST,
  hashPasswordSync,
  hashPassword,
  verifyPassword
};

"use strict";

const USERNAME_RE = /^[a-zA-Z0-9_]{3,24}$/;
const PHONE_RE = /^09\d{9}$/;

function cleanString(value, max = 255) {
  return String(value ?? "").trim().slice(0, max);
}

function validateUsername(value) {
  const username = cleanString(value, 24);
  return USERNAME_RE.test(username) ? { ok: true, value: username } : { ok: false, error: "نام کاربری نامعتبر است." };
}

function validatePhone(value) {
  const phone = cleanString(value, 11);
  return PHONE_RE.test(phone) ? { ok: true, value: phone } : { ok: false, error: "شماره موبایل نامعتبر است." };
}

function validatePassword(value) {
  const password = String(value ?? "");
  if (password.length < 8 || password.length > 128) return { ok: false, error: "رمز عبور باید بین ۸ تا ۱۲۸ کاراکتر باشد." };
  return { ok: true, value: password };
}

function validateNewsInput(body = {}) {
  const title = cleanString(body.title, 140);
  const text = cleanString(body.text, 3000);
  if (!title || !text) return { ok: false, error: "عنوان و متن خبر الزامی است." };
  return { ok: true, value: { title, text } };
}

module.exports = { cleanString, validateUsername, validatePhone, validatePassword, validateNewsInput };

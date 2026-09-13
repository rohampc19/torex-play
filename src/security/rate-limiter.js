"use strict";

class RateLimiter {
  constructor({ windowMs = 60_000, max = 60, keyFn = null } = {}) {
    this.windowMs = windowMs;
    this.max = max;
    this.keyFn = keyFn || ((request, key) => `${request.socket?.remoteAddress || "local"}:${key}`);
    this.buckets = new Map();
  }

  allow(request, key, max = this.max) {
    const now = Date.now();
    const bucketKey = this.keyFn(request, key);
    const bucket = this.buckets.get(bucketKey) || { start: now, count: 0 };

    if (now - bucket.start > this.windowMs) {
      bucket.start = now;
      bucket.count = 0;
    }

    bucket.count += 1;
    this.buckets.set(bucketKey, bucket);
    return bucket.count <= max;
  }

  clear() {
    this.buckets.clear();
  }
}

module.exports = { RateLimiter };

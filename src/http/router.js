"use strict";

/**
 * Small framework-free route registry.
 *
 * Routes stay independent from Node's Server object so the current monolith
 * can migrate endpoint groups one at a time without changing public paths.
 */
class Router {
  constructor() {
    this.routes = [];
  }

  register(method, pattern, handler) {
    if (typeof handler !== "function") throw new TypeError("Route handler must be a function");
    const normalizedMethod = String(method || "*").toUpperCase();
    const normalizedPattern = pattern instanceof RegExp ? pattern : String(pattern || "*");
    this.routes.push({ method: normalizedMethod, pattern: normalizedPattern, handler });
    return this;
  }

  get(pattern, handler) { return this.register("GET", pattern, handler); }
  post(pattern, handler) { return this.register("POST", pattern, handler); }
  put(pattern, handler) { return this.register("PUT", pattern, handler); }
  patch(pattern, handler) { return this.register("PATCH", pattern, handler); }
  delete(pattern, handler) { return this.register("DELETE", pattern, handler); }

  match(method, pathname) {
    const verb = String(method || "").toUpperCase();
    return this.routes.find(route => {
      if (route.method !== "*" && route.method !== verb) return false;
      if (route.pattern instanceof RegExp) return route.pattern.test(pathname);
      return route.pattern === "*" || route.pattern === pathname;
    }) || null;
  }

  async handle(req, res, context = {}) {
    const url = new URL(req.url, "http://localhost");
    const route = this.match(req.method, url.pathname);
    if (!route) return false;
    await route.handler(req, res, { ...context, url, params: route.pattern instanceof RegExp ? route.pattern.exec(url.pathname) : null });
    return true;
  }
}

module.exports = { Router };

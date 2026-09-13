"use strict";

/*
 * TOREX PLAY realtime gateway.
 * The existing API server stays unchanged and runs internally on PORT 3001.
 * This gateway owns the public PORT 3000, forwards normal requests, and adds
 * authenticated Server-Sent Events for chat plus message fan-out.
 */
const http = require("http");
const { spawn } = require("child_process");
const path = require("path");

const PUBLIC_PORT = Number(process.env.PORT || 3000);
const API_PORT = Number(process.env.TOREX_API_PORT || 3001);
const ROOT = __dirname;
const TOKEN_USERS = new Map();
const streams = new Set();

function backendRequest(options, body) {
  return new Promise((resolve, reject) => {
    const req = http.request({ hostname: "127.0.0.1", port: API_PORT, ...options }, res => {
      const chunks = [];
      res.on("data", chunk => chunks.push(chunk));
      res.on("end", () => resolve({ statusCode: res.statusCode || 500, headers: res.headers, body: Buffer.concat(chunks) }));
    });
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

function forward(req, res, body) {
  const headers = { ...req.headers, host: `127.0.0.1:${API_PORT}`, connection: "close" };
  delete headers["content-length"];
  const options = { hostname: "127.0.0.1", port: API_PORT, method: req.method, path: req.url, headers };
  const upstream = http.request(options, upstreamRes => {
    res.writeHead(upstreamRes.statusCode || 500, upstreamRes.headers);
    upstreamRes.pipe(res);
  });
  upstream.on("error", error => {
    if (!res.headersSent) {
      res.writeHead(502, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ error: "ارتباط با سرویس اصلی برقرار نشد.", detail: error.message }));
    } else res.destroy();
  });
  if (body) upstream.write(body);
  upstream.end();
}

function bearer(req) {
  const value = String(req.headers.authorization || "");
  return value.startsWith("Bearer ") ? value.slice(7).trim() : "";
}

function sendEvent(stream, event, payload) {
  if (stream.closed || stream.res.destroyed) return;
  stream.res.write(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`);
}

function broadcastMessage(message) {
  for (const stream of streams) {
    const owner = stream.username;
    const peer = stream.conversation;
    const matches = (message.sender === owner && message.conversation === peer) ||
      (message.sender === peer && message.conversation === owner);
    if (matches) sendEvent(stream, "message", message);
  }
}

async function handleStream(req, res, url) {
  const token = bearer(req);
  const username = TOKEN_USERS.get(token);
  const conversation = String(url.searchParams.get("conversation") || "").trim().toLowerCase().replace(/^@/, "");
  if (!token || !username || !conversation || username === conversation) {
    res.writeHead(401, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
    return res.end(JSON.stringify({ error: "نشست چت معتبر نیست." }));
  }

  // Confirm the session and conversation through the real API before opening a long-lived stream.
  let check;
  try {
    check = await backendRequest({ method: "GET", path: `/api/messages?conversation=${encodeURIComponent(conversation)}`, headers: { Authorization: `Bearer ${token}` } });
  } catch {
    res.writeHead(502, { "Content-Type": "application/json; charset=utf-8" });
    return res.end(JSON.stringify({ error: "سرویس چت در دسترس نیست." }));
  }
  if (check.statusCode !== 200) {
    res.writeHead(check.statusCode, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
    return res.end(check.body);
  }

  res.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    "Connection": "keep-alive",
    "X-Accel-Buffering": "no",
    "X-Content-Type-Options": "nosniff"
  });
  res.write(`retry: 1500\n\nevent: ready\ndata: ${JSON.stringify({ realtime: true })}\n\n`);

  const stream = { res, token, username, conversation, closed: false };
  streams.add(stream);
  const heartbeat = setInterval(() => {
    if (res.destroyed) return;
    res.write(`: heartbeat ${Date.now()}\n\n`);
  }, 20000);

  const cleanup = () => {
    if (stream.closed) return;
    stream.closed = true;
    clearInterval(heartbeat);
    streams.delete(stream);
  };
  req.on("close", cleanup);
  res.on("close", cleanup);
}

async function readRequestBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
    if (Buffer.concat(chunks).length > 1e6) throw new Error("request too large");
  }
  return Buffer.concat(chunks);
}

async function handle(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  if (url.pathname === "/api/messages/stream" && req.method === "GET") return handleStream(req, res, url);

  let body = null;
  if (["POST", "PUT", "PATCH"].includes(req.method)) {
    try { body = await readRequestBody(req); }
    catch { res.writeHead(413); return res.end("Request too large"); }
  }

  const isLogin = req.method === "POST" && url.pathname === "/api/login";
  const isRegisterStatus = req.method === "GET" && url.pathname === "/api/register/status";
  const isLogout = req.method === "POST" && url.pathname === "/api/logout";
  const isMessagePost = req.method === "POST" && url.pathname === "/api/messages";
  const auth = bearer(req);

  if (isLogin || isRegisterStatus || isLogout || isMessagePost) {
    let upstream;
    try { upstream = await backendRequest({ method: req.method, path: req.url, headers: { ...req.headers, host: `127.0.0.1:${API_PORT}`, ...(body ? { "content-length": body.length } : {}) } }, body); }
    catch { res.writeHead(502, { "Content-Type": "application/json; charset=utf-8" }); return res.end(JSON.stringify({ error: "ارتباط با سرویس اصلی برقرار نشد." })); }

    if (isLogin && upstream.statusCode >= 200 && upstream.statusCode < 300) {
      try { const data = JSON.parse(upstream.body.toString("utf8")); if (data.token && data.user?.username) TOKEN_USERS.set(data.token, data.user.username); } catch {}
    }
    if (isRegisterStatus && upstream.statusCode >= 200 && upstream.statusCode < 300) {
      try { const data = JSON.parse(upstream.body.toString("utf8")); if (data.token && data.user?.username) TOKEN_USERS.set(data.token, data.user.username); } catch {}
    }
    if (isLogout && auth) TOKEN_USERS.delete(auth);

    res.writeHead(upstream.statusCode, upstream.headers);
    res.end(upstream.body);

    if (isMessagePost && upstream.statusCode >= 200 && upstream.statusCode < 300) {
      try { const data = JSON.parse(upstream.body.toString("utf8")); if (data.message) broadcastMessage(data.message); } catch {}
    }
    return;
  }

  forward(req, res, body);
}

const child = spawn(process.execPath, [path.join(ROOT, "server.js")], {
  env: { ...process.env, PORT: String(API_PORT) },
  stdio: ["inherit", "inherit", "inherit"]
});
child.on("exit", code => {
  if (code !== 0) console.error(`[REALTIME] API server exited with code ${code}`);
});

const server = http.createServer((req, res) => {
  handle(req, res).catch(error => {
    console.error("[REALTIME] Request failed", error.message);
    if (!res.headersSent) { res.writeHead(500, { "Content-Type": "application/json; charset=utf-8" }); res.end(JSON.stringify({ error: "خطای داخلی گیت‌وی چت" })); }
    else res.destroy();
  });
});

function shutdown() {
  for (const stream of streams) { try { stream.res.end(); } catch {} }
  child.kill();
  server.close(() => process.exit(0));
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
server.listen(PUBLIC_PORT, "::", () => {
  console.log(`TOREX PLAY realtime gateway: http://localhost:${PUBLIC_PORT}`);
  console.log(`API server: http://127.0.0.1:${API_PORT}`);
});

"use strict";

/* Public realtime gateway. Transport, stream lifecycle and upstream HTTP are
 * intentionally separated so the gateway stays small and replaceable. */
const http = require("http");
const { spawn } = require("child_process");
const path = require("path");
const { publicPort: PUBLIC_PORT, apiPort: API_PORT, root: ROOT } = require("./src/config");
const { json } = require("./src/http/json-response");
const { StreamManager } = require("./src/realtime/stream-manager");
const { UpstreamClient } = require("./src/realtime/upstream-client");

const upstream = new UpstreamClient({ port: API_PORT });
const streams = new StreamManager();
const TOKEN_USERS = new Map();

function bearer(req) {
  const value = String(req.headers.authorization || "");
  return value.startsWith("Bearer ") ? value.slice(7).trim() : "";
}

function sendEvent(res, event, payload) {
  if (res.destroyed) return;
  res.write(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`);
}

function broadcastMessage(message) {
  streams.publish("message", message, stream => {
    const owner = stream.username;
    const peer = stream.conversation;
    return (message.sender === owner && message.conversation === peer) ||
      (message.sender === peer && message.conversation === owner);
  });
}

async function handleStream(req, res, url) {
  const token = bearer(req);
  const username = TOKEN_USERS.get(token);
  const conversation = String(url.searchParams.get("conversation") || "")
    .trim().toLowerCase().replace(/^@/, "");

  if (!token || !username || !conversation || username === conversation) {
    return json(res, 401, { error: "نشست چت معتبر نیست." });
  }

  let check;
  try {
    check = await upstream.request({
      method: "GET",
      path: `/api/messages?conversation=${encodeURIComponent(conversation)}`,
      headers: { Authorization: `Bearer ${token}` }
    });
  } catch {
    return json(res, 502, { error: "سرویس چت در دسترس نیست." });
  }

  if (check.statusCode !== 200) {
    return json(res, check.statusCode, JSON.parse(check.body.toString("utf8") || "{}"));
  }

  res.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    "Connection": "keep-alive",
    "X-Accel-Buffering": "no",
    "X-Content-Type-Options": "nosniff"
  });
  sendEvent(res, "ready", { realtime: true });

  const stream = { res, token, username, conversation, closed: false };
  streams.add(stream);
  const heartbeat = setInterval(() => {
    if (!res.destroyed) res.write(`: heartbeat ${Date.now()}\n\n`);
  }, 20000);

  const cleanup = () => {
    if (stream.closed) return;
    stream.closed = true;
    clearInterval(heartbeat);
    streams.remove(stream);
  };
  req.on("close", cleanup);
  res.on("close", cleanup);
}

async function readRequestBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 1e6) throw new Error("request too large");
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

async function proxy(req, res, body) {
  try {
    const result = await upstream.request({
      method: req.method,
      path: req.url,
      headers: { ...req.headers, host: `127.0.0.1:${API_PORT}`, ...(body ? { "content-length": body.length } : {}) }
    }, body);
    res.writeHead(result.statusCode, result.headers);
    res.end(result.body);
    return result;
  } catch (error) {
    if (!res.headersSent) json(res, 502, { error: "ارتباط با سرویس اصلی برقرار نشد." });
    else res.destroy();
    return null;
  }
}

async function handle(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  if (url.pathname === "/api/messages/stream" && req.method === "GET") {
    return handleStream(req, res, url);
  }

  let body = null;
  if (["POST", "PUT", "PATCH"].includes(req.method)) {
    try { body = await readRequestBody(req); }
    catch { return json(res, 413, { error: "حجم درخواست بیش از حد مجاز است." }); }
  }

  const isLogin = req.method === "POST" && url.pathname === "/api/login";
  const isRegisterStatus = req.method === "GET" && url.pathname === "/api/register/status";
  const isLogout = req.method === "POST" && url.pathname === "/api/logout";
  const isMessagePost = req.method === "POST" && url.pathname === "/api/messages";
  const auth = bearer(req);

  const result = await proxy(req, res, body);
  if (!result) return;

  if (isLogin && result.statusCode >= 200 && result.statusCode < 300) {
    try {
      const data = JSON.parse(result.body.toString("utf8"));
      if (data.token && data.user?.username) TOKEN_USERS.set(data.token, data.user.username);
    } catch {}
  }
  if (isRegisterStatus && result.statusCode >= 200 && result.statusCode < 300) {
    try {
      const data = JSON.parse(result.body.toString("utf8"));
      if (data.token && data.user?.username) TOKEN_USERS.set(data.token, data.user.username);
    } catch {}
  }
  if (isLogout && auth) TOKEN_USERS.delete(auth);
  if (isMessagePost && result.statusCode >= 200 && result.statusCode < 300) {
    try {
      const data = JSON.parse(result.body.toString("utf8"));
      if (data.message) broadcastMessage(data.message);
    } catch {}
  }
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
    if (!res.headersSent) json(res, 500, { error: "خطای داخلی گیت‌وی چت" });
    else res.destroy();
  });
});

function shutdown() {
  streams.closeAll();
  child.kill();
  server.close(() => process.exit(0));
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

server.listen(PUBLIC_PORT, "::", () => {
  console.log(`TOREX PLAY realtime gateway: http://localhost:${PUBLIC_PORT}`);
  console.log(`API server: http://127.0.0.1:${API_PORT}`);
});

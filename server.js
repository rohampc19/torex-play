"use strict";

// Local development server using only Node's standard library.
// The public application name is intentionally kept out of server output.
const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const readline = require("readline");

// Force UTF-8 output so non-ASCII text does not render as boxes
try { require("child_process").execSync("chcp 65001 >nul", { shell: "cmd.exe" }); } catch {}

const ROOT = __dirname;
const PORT = Number(process.env.PORT || 3000);
const DATA_FILE = path.join(ROOT, "torex-data.json");
const MIME = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "application/javascript; charset=utf-8", ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".ico": "image/x-icon" };
const rateBuckets = new Map();
function rateLimit(req, key, max = 60, windowMs = 60000) { const now = Date.now(); const bucketKey = `${req.socket.remoteAddress || "local"}:${key}`; const bucket = rateBuckets.get(bucketKey) || { start: now, count: 0 }; if (now - bucket.start > windowMs) { bucket.start = now; bucket.count = 0; } bucket.count += 1; rateBuckets.set(bucketKey, bucket); return bucket.count <= max; }
function hashPasswordSync(password) { const salt = crypto.randomBytes(16); const derived = crypto.pbkdf2Sync(String(password), salt, 120000, 32, "sha256"); return `pbkdf2$120000$${salt.toString("hex")}$${derived.toString("hex")}`; }
function hashPassword(password) { return Promise.resolve(hashPasswordSync(password)); }
function verifyPassword(password, stored) {
  return new Promise((resolve, reject) => {
    const parts = String(stored || "").split("$");
    if (parts.length !== 4 || parts[0] !== "pbkdf2") return resolve(false);
    crypto.pbkdf2(String(password), Buffer.from(parts[2], "hex"), Number(parts[1]), 32, "sha256", (error, derived) => {
      if (error) return reject(error);
      const expected = Buffer.from(parts[3], "hex");
      resolve(expected.length === derived.length && crypto.timingSafeEqual(expected, derived));
    });
  });
}
function safeRequest(req, res, key, max) { if (rateLimit(req, key, max)) return true; reply(res, 429, { error: "تعداد درخواست‌ها بیش از حد مجاز است." }); return false; }

const initialData = {
  users: [
    { id: "u-admin", username: "admin", name: "ادمین", phone: "09120000000", password: "pbkdf2$120000$1cfa358b396157cca9cac33215d08203$9ce47681924e7ac2080c43876859289fd2196bc4097708c48604813c0885eb38", score: 9999, favoriteGame: "—", avatar: "A", role: "admin", status: "approved", friends: [] }
  ],
  messages: [],
  news: [],
  follows: [],
  notifications: [],
  sessions: []
};

const seedNews = [
  { id: "n-gta6", title: "جزئیات تازه از یکی از موردانتظارترین بازی‌های سال", excerpt: "نگاهی به خبرهای مهم این هفته از دنیای بازی و به‌روزرسانی‌های استودیوها.", text: "تازه‌ترین گزارش‌ها از روند توسعه و برنامه‌های آینده منتشر شده است. این خبر با تمرکز بر اطلاعات قابل بررسی و بدون شایعه‌پردازی گردآوری شده است.", category: "gaming", tags: ["Gaming", "Updates"], author: "admin", authorName: "ادمین", verified: true, image: "", likes: [], comments: [], createdAt: new Date().toISOString(), publishedAt: new Date().toISOString(), views: 2400, status: "published" },
  { id: "n-esports", title: "تقویم رقابت‌های مهم ورزش‌های الکترونیک", excerpt: "مسابقات مهم این ماه را از دست ندهید؛ برنامه و نتایج در جامعه گیمرها دنبال می‌شود.", text: "از رقابت‌های تیمی تا مسابقات انفرادی، رویدادهای مهم ماه را در دسته ورزش الکترونیک دنبال کنید.", category: "esports", tags: ["Esports"], author: "admin", authorName: "ادمین", verified: true, image: "", likes: [], comments: [], createdAt: new Date(Date.now() - 86400000).toISOString(), publishedAt: new Date(Date.now() - 86400000).toISOString(), views: 980, status: "published" },
  { id: "n-hardware", title: "راهنمای کوتاه ارتقای سیستم برای بازی روان‌تر", excerpt: "قبل از خرید قطعه جدید، این نکات را برای انتخاب هوشمندانه بررسی کنید.", text: "ارتقای سیستم همیشه به معنای خرید گران‌ترین قطعه نیست. ابتدا گلوگاه سیستم را پیدا کنید و سپس اولویت ارتقا را مشخص کنید.", category: "hardware", tags: ["Hardware", "PC"], author: "admin", authorName: "ادمین", verified: true, image: "", likes: [], comments: [], createdAt: new Date(Date.now() - 172800000).toISOString(), publishedAt: new Date(Date.now() - 172800000).toISOString(), views: 640, status: "published" }
];
function loadData() { try { const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf8")); let changed = false; if (!Array.isArray(data.news) || !data.news.length) { data.news = structuredClone(seedNews); changed = true; } data.sessions = Array.isArray(data.sessions) ? data.sessions.filter(session => Date.now() - new Date(session.createdAt).getTime() < 86400000) : []; data.users = Array.isArray(data.users) ? data.users : []; data.users.forEach(user => { if (user.password && !String(user.password).startsWith("pbkdf2$")) { user.password = hashPasswordSync(user.password); changed = true; } }); if (changed) saveData(data); return data; } catch { const data = structuredClone(initialData); data.news = structuredClone(seedNews); return data; } }
function saveData(data) { fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8"); }
function reply(res, code, body) { res.writeHead(code, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", "Referrer-Policy": "strict-origin-when-cross-origin", "X-Frame-Options": "DENY" }); res.end(JSON.stringify(body)); }
function readBody(req) { return new Promise((resolve, reject) => { let value = ""; req.on("data", c => { value += c; if (value.length > 1e6) req.destroy(); }); req.on("end", () => { try { resolve(value ? JSON.parse(value) : {}); } catch { reject(new Error("بدنهٔ درخواست نامعتبر است.")); } }); }); }
function token() { return crypto.randomBytes(24).toString("hex"); }
function publicUser(user) { const { password, phone, ...safe } = user; return safe; }
function sessionUser(data, req) { const header = String(req.headers.authorization || ""); const value = header.startsWith("Bearer ") ? header.slice(7) : ""; if (!value) return null; const session = data.sessions.find(item => item.token === value && Date.now() - new Date(item.createdAt).getTime() < 86400000); return session ? data.users.find(user => user.id === session.userId && user.status === "approved") : null; }
function requireUser(data, req, res) { const user = sessionUser(data, req); if (!user) { reply(res, 401, { error: "برای این عملیات باید وارد شوید." }); return null; } return user; }
function requireAdmin(data, req, res) { const user = requireUser(data, req, res); if (!user) return null; if (user.role !== "admin") { reply(res, 403, { error: "دسترسی مدیر لازم است." }); return null; } return user; }
function isAdmin(req, body) { const key = String((body && body.adminKey) || url2key(req) || ""); return key === "torex-admin-2026"; }
function url2key(req) { try { return new URL(req.url, "http://x").searchParams.get("adminKey") || ""; } catch { return ""; } }
function notify(data, username, type, from, text) { data.notifications = data.notifications || []; data.notifications.push({ id: `no-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, user: username, type, from, text, read: false, createdAt: new Date().toISOString() }); }
function friendsOf(data, username) { const user = data.users.find(item => item.username === username); return Array.isArray(user && user.friends) ? user.friends : []; }
function isFriend(data, a, b) { return friendsOf(data, a).includes(b); }
function lastMessageOf(data, a, b) { return (data.messages || []).filter(m => (m.conversation === a && m.sender === b) || (m.conversation === b && m.sender === a)).sort((x, y) => new Date(y.createdAt) - new Date(x.createdAt))[0] || null; }

/* Registration approval from the terminal - y: approve, n: reject */
const rl = process.stdin.isTTY
  ? readline.createInterface({ input: process.stdin, output: process.stdout, prompt: "" })
  : null;
if (rl) rl.on("SIGINT", () => { rl.close(); process.exit(0); });
function askRegistration(username) {
  if (!rl) {
    console.log("[INFO] Pending registration: " + username + " (approve from admin-panel.html)");
    return;
  }
  process.stdout.write("\n[NEW] New registration request: \"" + username + "\"\nApprove? (y = approve / n = reject): ");
  rl.once("line", answer => {
    const data = loadData();
    const user = data.users.find(u => u.username === username && u.status === "pending");
    if (!user) { console.log("[!] This request no longer exists."); return; }
    if (answer.trim().toLowerCase() === "y") {
      user.status = "approved";
      notify(data, username, "approved", "admin", "Your registration was approved. Welcome!");
      saveData(data);
      console.log("\n[OK] Approved! User \"" + username + "\" can now log in.");
    } else {
      data.users = data.users.filter(u => u.username !== username);
      saveData(data);
      console.log("[X] Request for \"" + username + "\" was rejected and removed.");
    }
  });
}

async function api(req, res, url) {
  if (!safeRequest(req, res, url.pathname.startsWith("/api/login") ? "login" : url.pathname.startsWith("/api/register") ? "register" : "api", url.pathname.startsWith("/api/login") ? 12 : url.pathname.startsWith("/api/register") ? 10 : 180)) return;
  const data = loadData();
  const viewer = sessionUser(data, req);
  const me = viewer ? viewer.username : "";
  if (req.method === "GET" && url.pathname === "/api/news") {
    const category = (url.searchParams.get("category") || "all").trim().toLowerCase();
    const list = (data.news || []).filter(item => item.status !== "draft").filter(item => category === "all" || String(item.category || "gaming").toLowerCase() === category).map(item => ({ ...item, verified: true, isOfficial: item.isOfficial === true || item.author === "admin", likes: (item.likes || []).length, liked: !!me && (item.likes || []).includes(me), comments: (item.comments || []).length })).sort((a, b) => new Date(b.publishedAt || b.createdAt) - new Date(a.publishedAt || a.createdAt));
    return reply(res, 200, { featured: list[0] || null, news: list });
  }
  const newsMatch = url.pathname.match(/^\/api\/news\/([^/]+)$/);
  if (req.method === "GET" && newsMatch) { const item = (data.news || []).find(entry => entry.id === newsMatch[1]); if (!item || item.status === "draft") return reply(res, 404, { error: "خبر پیدا نشد." }); item.views = Number(item.views || 0) + 1; saveData(data); const related = (data.news || []).filter(entry => entry.id !== item.id && entry.status !== "draft" && entry.category === item.category).slice(0, 3); return reply(res, 200, { news: { ...item, verified: true, isOfficial: item.isOfficial === true || item.author === "admin", likes: (item.likes || []).length, liked: !!me && (item.likes || []).includes(me), related } }); }
  if (req.method === "GET" && url.pathname === "/api/users") { const query = (url.searchParams.get("query") || "").trim().toLowerCase().replace(/^@/, ""); const list = data.users.filter(u => u.status !== "pending").map(publicUser).filter(user => !query || user.username.toLowerCase().includes(query) || String(user.name || "").toLowerCase().includes(query)).slice(0, 12); return reply(res, 200, { users: list }); }
  if (req.method === "GET" && url.pathname === "/api/leaderboard") { const players = data.users.filter(user => user.status === "approved").map(user => ({ ...publicUser(user), followers: data.follows.filter(entry => entry.target === user.username).length, likes: (data.news || []).reduce((total, item) => total + (item.likes || []).filter(name => name === user.username).length, 0) })).sort((a, b) => Number(b.score || 0) - Number(a.score || 0)).slice(0, 50); return reply(res, 200, { players }); }
  if (req.method === "POST" && url.pathname === "/api/news") { const owner = requireUser(data, req, res); if (!owner) return; const body = await readBody(req); const title = String(body.title || "").trim(); const text = String(body.text || "").trim(); const author = owner.username; if (!title || title.length > 140 || !text || text.length > 3000 || !owner) return reply(res, 400, { error:"عنوان، متن و حساب کاربری معتبر لازم است." }); const image = String(body.image || ""); if (image && (!image.startsWith("data:image/") || image.length > 900000)) return reply(res, 400, { error:"تصویر معتبر نیست یا حجم آن بیش از حد مجاز است." }); const tags = String(body.tags || "").split(/\s+/).filter(value => value.startsWith("#")).slice(0, 8).map(value => value.slice(1, 33)); const tagText = tags.join(" ").toLowerCase(); const requestedCategory = String(body.category || "gaming").trim().toLowerCase(); const category = tagText.includes("esport") || tagText.includes("ورزش") ? "esports" : tagText.includes("hardware") || tagText.includes("سخت") || tagText.includes("pc") ? "hardware" : ["gaming", "esports", "hardware"].includes(requestedCategory) ? requestedCategory : "gaming"; const item = { id:`n-${Date.now()}`, title, excerpt: String(body.excerpt || text.slice(0, 180)).trim(), text, category, game:String(body.game || "").trim(), tags, author:owner.username, authorName:owner.name, verified:true, isOfficial:owner.role === "admin", image, likes:[], comments:[], createdAt:new Date().toISOString(), publishedAt:new Date().toISOString(), views:0, status:"published" }; data.news = data.news || []; data.news.push(item); saveData(data); return reply(res, 201, { news:{ ...item, likes:0, liked:false } }); }
  const likeMatch = url.pathname.match(/^\/api\/news\/([^/]+)\/like$/);
  if (req.method === "POST" && likeMatch) { const viewer = requireUser(data, req, res); if (!viewer) return; const item = (data.news || []).find(entry => entry.id === likeMatch[1]); if (!item) return reply(res, 404, { error:"خبر پیدا نشد." }); item.likes = item.likes || []; const username = viewer.username; const index = item.likes.indexOf(username); if (index >= 0) item.likes.splice(index, 1); else item.likes.push(username); saveData(data); return reply(res, 200, { likes:item.likes.length, liked:index < 0 }); }
  const commentMatch = url.pathname.match(/^\/api\/news\/([^/]+)\/comment$/);
  if (req.method === "POST" && commentMatch) { const user = requireUser(data, req, res); if (!user) return; const body = await readBody(req); const item = (data.news || []).find(entry => entry.id === commentMatch[1]); const text = String(body.text || "").trim(); if (!item || !text || text.length > 300 || !user) return reply(res, 400, { error:"متن نظر یا حساب کاربری معتبر نیست." }); const comment = { id:`c-${Date.now()}`, user:user.username, name:user.name, text, likes:[], createdAt:new Date().toISOString() }; item.comments = item.comments || []; item.comments.push(comment); if (item.author && item.author !== user.username) notify(data, item.author, "comment", user.username, "@" + user.username + " روی خبر شما نظر داد: " + text.slice(0, 60)); saveData(data); return reply(res, 201, { comment }); }
  const commentLikeMatch = url.pathname.match(/^\/api\/news\/([^/]+)\/comment\/([^/]+)\/like$/);
  if (req.method === "POST" && commentLikeMatch) { const viewer = requireUser(data, req, res); if (!viewer) return; const item = (data.news || []).find(entry => entry.id === commentLikeMatch[1]); const comment = item && (item.comments || []).find(entry => entry.id === commentLikeMatch[2]); if (!comment) return reply(res, 404, { error: "نظر پیدا نشد." }); comment.likes = Array.isArray(comment.likes) ? comment.likes : []; const index = comment.likes.indexOf(viewer.username); if (index >= 0) comment.likes.splice(index, 1); else comment.likes.push(viewer.username); saveData(data); return reply(res, 200, { likes: comment.likes.length, liked: index < 0 }); }
  if (req.method === "POST" && url.pathname === "/api/follow") { const viewer = requireUser(data, req, res); if (!viewer) return; const body = await readBody(req); const follower = viewer.username; const target = String(body.target || "").toLowerCase(); if (follower === target || !data.users.some(u => u.username === follower) || !data.users.some(u => u.username === target)) return reply(res, 400, { error:"درخواست فالو معتبر نیست." }); const index = data.follows.findIndex(entry => entry.follower === follower && entry.target === target); if (index >= 0) { data.follows.splice(index, 1); saveData(data); return reply(res, 200, { following:false }); } data.follows.push({ follower, target, createdAt:new Date().toISOString() }); notify(data, target, "follow", follower, "@" + follower + " شما را دنبال کرد."); saveData(data); return reply(res, 200, { following:true }); }
  const replyMatch = url.pathname.match(/^\/api\/news\/([^/]+)\/comment\/(\d+)$/);
  if (req.method === "POST" && replyMatch) { const user = requireUser(data, req, res); if (!user) return; const body = await readBody(req); const item = (data.news || []).find(entry => entry.id === replyMatch[1]); const parentIndex = Number(replyMatch[2]); const parent = item && (item.comments || [])[parentIndex]; const text = String(body.text || "").trim(); if (!item || !parent || !text || text.length > 300 || !user) return reply(res, 400, { error:"متن پاسخ یا حساب کاربری معتبر نیست." }); const comment = { id:`c-${Date.now()}`, user:user.username, name:user.name, text, likes:[], replyTo: parent.user, replyToName: parent.name, createdAt:new Date().toISOString() }; item.comments.push(comment); if (parent.user && parent.user !== user.username) notify(data, parent.user, "reply", user.username, "@" + user.username + " به نظر شما پاسخ داد: " + text.slice(0, 60)); saveData(data); return reply(res, 201, { comment }); }
  if (req.method === "GET" && /^\/api\/users\/[^/]+$/.test(url.pathname)) { const username = decodeURIComponent(url.pathname.split("/").pop()).replace(/^@/, "").toLowerCase(); const user = data.users.find(item => item.username.toLowerCase() === username); if (!user) return reply(res, 404, { error:"کاربر پیدا نشد." }); return reply(res, 200, { profile:{ ...publicUser(user), followers: data.follows.filter(entry => entry.target === user.username).length + Math.max(120, Math.round(user.score * .72)), following: data.follows.filter(entry => entry.follower === user.username).length + Math.max(8, Math.round(user.score / 190)), verified:true, isFollowing: !!me && data.follows.some(entry => entry.follower === me && entry.target === user.username) } }); }
  if (req.method === "GET" && url.pathname === "/api/messages") { const viewer = requireUser(data, req, res); if (!viewer) return; const conversation = (url.searchParams.get("conversation") || "").toLowerCase().replace(/^@/, ""); const messages = data.messages.filter(m => (m.conversation === conversation && m.sender === viewer.username) || (m.conversation === viewer.username && m.sender === conversation)); if (url.searchParams.get("after")) { const after = url.searchParams.get("after"); return reply(res, 200, { messages: messages.filter(m => m.id > `m-${after}` || new Date(m.createdAt) > new Date(Number(after) || 0)) }); } messages.forEach(m => { if (m.conversation === conversation && m.sender === conversation && !m.read) { m.read = true; } }); saveData(data); return reply(res, 200, { messages }); }
  if (req.method === "POST" && url.pathname === "/api/messages") { const viewer = requireUser(data, req, res); if (!viewer) return; const body = await readBody(req); const text = String(body.text || "").trim(); const conversation = String(body.conversation || "").toLowerCase().replace(/^@/, ""); if (!text || text.length > 500 || !conversation || conversation === viewer.username) return reply(res, 400, { error: "پیام یا گفتگو معتبر نیست." }); if (!data.users.some(user => user.username === conversation && user.status === "approved")) return reply(res, 404, { error: "کاربر گفتگو پیدا نشد." }); const message = { id: `m-${Date.now()}`, conversation, sender: viewer.username, text, createdAt: new Date().toISOString(), read: false }; data.messages.push(message); saveData(data); return reply(res, 201, { message }); }
  if (req.method === "GET" && url.pathname === "/api/register/status") { const username = (url.searchParams.get("username") || "").trim().toLowerCase(); const user = data.users.find(u => u.username === username); if (!user) return reply(res, 200, { status: "rejected" }); let value = null; if (user.status === "approved") { value = token(); data.sessions.push({ token: value, userId: user.id, createdAt: new Date().toISOString() }); saveData(data); } return reply(res, 200, { status: user.status, token: value, user: user.status === "approved" ? publicUser(user) : null }); }
  if (req.method === "GET" && url.pathname === "/api/friends") { const viewer = requireUser(data, req, res); if (!viewer) return; const list = friendsOf(data, viewer.username).map(username => data.users.find(item => item.username === username && item.status === "approved")).filter(Boolean).map(publicUser).map(user => { const last = lastMessageOf(data, viewer.username, user.username); const unread = (data.messages || []).filter(m => m.conversation === viewer.username && m.sender === user.username && !m.read).length; return { ...user, lastMessage: last ? last.text : "", lastMessageTime: last ? last.createdAt : null, unread, online: ((Date.now() - new Date(last ? last.createdAt : 0).getTime()) < 120000 && last && last.sender === user.username) }; }).sort((a, b) => new Date(b.lastMessageTime || 0) - new Date(a.lastMessageTime || 0)); return reply(res, 200, { friends: list }); }
  if (req.method === "POST" && url.pathname === "/api/friends") { const viewer = requireUser(data, req, res); if (!viewer) return; const body = await readBody(req); const playerId = String(body.playerId || "").trim().toLowerCase().replace(/^@/, ""); if (!playerId) return reply(res, 400, { error: "آیدی بازیکن را وارد کنید." }); const target = data.users.find(item => item.username.toLowerCase() === playerId && item.status === "approved"); if (!target) return reply(res, 404, { error: "بازیکنی با این آیدی پیدا نشد." }); if (target.username === viewer.username) return reply(res, 400, { error: "نمی‌توانی خودت را اضافه کنی." }); if (isFriend(data, viewer.username, target.username)) return reply(res, 409, { error: "این بازیکن قبلاً در فهرست دوستانت است." }); viewer.friends = Array.isArray(viewer.friends) ? viewer.friends : []; target.friends = Array.isArray(target.friends) ? target.friends : []; viewer.friends.push(target.username); target.friends.push(viewer.username); notify(data, target.username, "friend", viewer.username, "@" + viewer.username + " تو را به فهرست دوستان اضافه کرد."); saveData(data); console.log(`[CHAT] Friend added | by=${viewer.username} | target=${target.username}`); return reply(res, 201, { friend: { ...publicUser(target), lastMessage: "", lastMessageTime: null, unread: 0, online: false } }); }
  if (req.method === "POST" && url.pathname === "/api/register") { const body = await readBody(req); const username = String(body.username || "").trim().toLowerCase(); const phone = String(body.phone || "").trim(); const password = String(body.password || ""); if (!/^[a-z0-9_]{3,24}$/i.test(username) || !/^09\d{9}$/.test(phone) || password.length < 8) return reply(res, 400, { error: "اطلاعات ثبت‌نام معتبر نیست." }); if (data.users.some(u => u.username === username || u.phone === phone)) return reply(res, 409, { error: "این نام کاربری یا شماره پیش‌تر ثبت شده است." }); const passwordHash = await hashPassword(password); const user = { id: `u-${crypto.randomUUID()}`, username, name: username, phone, password: passwordHash, score: 0, favoriteGame: "—", avatar: username[0].toUpperCase(), status: "pending", friends: [] }; data.users.push(user); saveData(data);
  console.log(`[AUTH] New user registered | username=${username} | userId=${user.id} | status=PENDING`);
  askRegistration(username); return reply(res, 201, { user: publicUser(user), pending: true, message: "ثبت‌نام انجام شد؛ بزودی ورود شما توسط ادمین تایید خواهد شد." }); }
  if (req.method === "GET" && url.pathname === "/api/admin/pending") { const admin = requireAdmin(data, req, res); if (!admin) return; return reply(res, 200, { pending: data.users.filter(u => u.status === "pending").map(publicUser) }); }
  if (req.method === "POST" && url.pathname === "/api/admin/approve") { const admin = requireAdmin(data, req, res); if (!admin) return; const body = await readBody(req); const username = String(body.username || "").toLowerCase(); const user = data.users.find(u => u.username === username); if (!user) return reply(res, 404, { error: "کاربر پیدا نشد." }); if (body.reject === true) { data.users = data.users.filter(u => u.username !== username); saveData(data); return reply(res, 200, { rejected: true }); } user.status = "approved"; notify(data, username, "approved", "admin", "ثبت‌نام شما تایید شد؛ خوش آمدی! 🎮"); saveData(data); return reply(res, 200, { approved: true, user: publicUser(user) }); }
  if (url.pathname === "/api/admin/stats" && req.method === "GET") { const admin = requireAdmin(data, req, res); if (!admin) return; return reply(res, 200, { stats: { users: data.users.length, pendingUsers: data.users.filter(user => user.status === "pending").length, news: (data.news || []).length, publishedNews: (data.news || []).filter(item => item.status !== "draft").length, drafts: (data.news || []).filter(item => item.status === "draft").length, messages: (data.messages || []).length } }); }
  if (url.pathname === "/api/admin/news" && req.method === "GET") { const admin = requireAdmin(data, req, res); if (!admin) return; return reply(res, 200, { news: data.news || [] }); }
  const adminNewsMatch = url.pathname.match(/^\/api\/admin\/news\/([^/]+)$/);
  if (adminNewsMatch && ["PUT", "PATCH", "DELETE"].includes(req.method)) { const admin = requireAdmin(data, req, res); if (!admin) return; const item = (data.news || []).find(entry => entry.id === adminNewsMatch[1]); if (!item) return reply(res, 404, { error: "خبر پیدا نشد." }); if (req.method === "DELETE") { data.news = data.news.filter(entry => entry.id !== item.id); saveData(data); return reply(res, 200, { deleted: true }); } const body = await readBody(req); Object.assign(item, { title: String(body.title ?? item.title).trim(), excerpt: String(body.excerpt ?? item.excerpt ?? "").trim(), text: String(body.text ?? item.text).trim(), category: String(body.category ?? item.category ?? "gaming").trim().toLowerCase(), tags: Array.isArray(body.tags) ? body.tags.slice(0, 8).map(String) : item.tags || [], status: body.status === "draft" ? "draft" : "published", image: String(body.image ?? item.image ?? ""), game: String(body.game ?? item.game ?? ""), isOfficial: body.isOfficial === true, isBreaking: body.isBreaking === true, updatedAt: new Date().toISOString() }); if (item.status === "published" && !item.publishedAt) item.publishedAt = new Date().toISOString(); saveData(data); return reply(res, 200, { news: item }); }
  if (url.pathname === "/api/admin/news" && req.method === "POST") { const admin = requireAdmin(data, req, res); if (!admin) return; const body = await readBody(req); const title = String(body.title || "").trim(); const text = String(body.text || "").trim(); if (!title || !text) return reply(res, 400, { error: "عنوان و متن خبر الزامی است." }); const now = new Date().toISOString(); const item = { id: `n-${crypto.randomUUID()}`, title, excerpt: String(body.excerpt || "").trim(), text, category: String(body.category || "gaming").trim().toLowerCase(), game: String(body.game || "").trim(), tags: Array.isArray(body.tags) ? body.tags.slice(0, 8).map(String) : [], author: admin.username, authorName: admin.name, verified: true, isOfficial: body.isOfficial === true, isBreaking: body.isBreaking === true, image: String(body.image || ""), likes: [], comments: [], createdAt: now, publishedAt: body.status === "draft" ? null : now, views: 0, status: body.status === "draft" ? "draft" : "published" }; data.news = data.news || []; data.news.unshift(item); saveData(data); return reply(res, 201, { news: item }); }
  if (req.method === "GET" && url.pathname === "/api/notifications") { const viewer = requireUser(data, req, res); if (!viewer) return; return reply(res, 200, { notifications: (data.notifications || []).filter(n => n.user === viewer.username).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) }); }
  if (req.method === "POST" && url.pathname === "/api/notifications/read") { const viewer = requireUser(data, req, res); if (!viewer) return; (data.notifications || []).forEach(n => { if (n.user === viewer.username) n.read = true; }); saveData(data); return reply(res, 200, { ok: true }); }
  if (req.method === "POST" && url.pathname === "/api/login") { const body = await readBody(req); const user = data.users.find(u => u.phone === String(body.phone || "").trim()); const password = String(body.password || ""); const valid = user && (String(user.password || "").startsWith("pbkdf2$") ? await verifyPassword(password, user.password) : user.password === password); if (!user || !valid) return reply(res, 401, { error: "شماره موبایل یا رمز عبور نادرست است." }); if (user.status === "pending") return reply(res, 403, { error: "حساب شما هنوز توسط ادمین تایید نشده است." }); if (!String(user.password || "").startsWith("pbkdf2$")) user.password = await hashPassword(password); const value = token(); data.sessions.push({ token: value, userId: user.id, createdAt: new Date().toISOString() }); saveData(data); return reply(res, 200, { token: value, user: publicUser(user) }); }
  if (req.method === "POST" && url.pathname === "/api/logout") { const header = String(req.headers.authorization || ""); const value = header.startsWith("Bearer ") ? header.slice(7) : ""; data.sessions = (data.sessions || []).filter(item => item.token !== value); saveData(data); return reply(res, 200, { ok: true }); }
  return reply(res, 404, { error: "مسیر API پیدا نشد." });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  try {
    if (url.pathname.startsWith("/api/")) return await api(req, res, url);
    if (url.pathname === "/chat" || url.pathname === "/chat.html") {
      res.writeHead(301, { "Location": "/chat-v2.html", "Cache-Control": "no-store" });
      return res.end();
    }
    const aliases = { "/admin.html": "/admin-panel.html", "/admin": "/admin-panel.html" };
    let requested = decodeURIComponent(aliases[url.pathname] || (url.pathname === "/" ? "/index.html" : url.pathname));
    const file = path.resolve(ROOT, `.${requested}`);
    const relative = path.relative(ROOT, file);
    if (relative.startsWith("..") || path.isAbsolute(relative) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end("Not found"); }
    res.writeHead(200, { "Content-Type": MIME[path.extname(file).toLowerCase()] || "application/octet-stream", "X-Content-Type-Options": "nosniff", "Referrer-Policy": "strict-origin-when-cross-origin", "X-Frame-Options": "DENY", "Permissions-Policy": "camera=(), microphone=(), geolocation=()", "Content-Security-Policy": "default-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com; script-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; frame-ancestors 'none'" });
    fs.createReadStream(file).pipe(res);
  } catch (error) { console.error("[SERVER] Request failed", error.message); if (!res.headersSent) reply(res, 500, { error: "خطای داخلی سرور" }); }
});
/* بدون قفل‌شدن روی IPv4 یا IPv6، هر دو آدرس localhost و 127.0.0.1 را قبول کن. */
server.listen(PORT, "::", () => {
  console.log(`Local server is running at http://localhost:${PORT}`);
  console.log("Pending registrations can be approved from admin-panel.html.");
  if (rl) {
    const pend = loadData().users.filter(u => u.status === "pending");
    pend.forEach(u => askRegistration(u.username));
  }
});

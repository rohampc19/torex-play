"use strict";

const PERFASHINAL_API = "/api";

async function PERFASHINALRequest(path, options = {}) {
  const headers = Object.assign({ "Content-Type": "application/json" }, options.headers || {});
  const response = await fetch(PERFASHINAL_API + path, {
    ...(options || {}),
    headers,
    credentials: "include"
  }).catch(() => { throw new Error("ارتباط با سرور برقرار نشد — سرور را با دستور node server.js اجرا کن و صفحه را از http://localhost:3000 باز کن."); });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "ارتباط با سرور برقرار نشد.");
  return data;
}
window.PERFASHINALRequest = PERFASHINALRequest;

function escapeHtml(value) {
  const element = document.createElement("span");
  element.textContent = String(value == null ? "" : value);
  return element.innerHTML;
}
function getUser() {
  try { return JSON.parse(localStorage.getItem("PERFASHINALUser") || "null"); }
  catch (_) { return null; }
}
function showToast(message) {
  let box = document.querySelector(".PERFASHINAL-toast-container");
  if (!box) { box = document.createElement("div"); box.className = "PERFASHINAL-toast-container"; document.body.append(box); }
  const toast = document.createElement("div");
  toast.className = "PERFASHINAL-toast";
  toast.textContent = message;
  box.append(toast);
  requestAnimationFrame(() => toast.classList.add("is-visible"));
  setTimeout(() => { toast.classList.remove("is-visible"); setTimeout(() => toast.remove(), 200); }, 2800);
}
function addServicesLink() {
  /* Secondary pages may link to Services explicitly; navigation is not mutated at runtime. */
}
function showProfile(profile) {
  let dialog = document.getElementById("PERFASHINALProfileDialog");
  if (!dialog) { dialog = document.createElement("dialog"); dialog.id = "PERFASHINALProfileDialog"; dialog.className = "PERFASHINAL-profile-dialog"; document.body.append(dialog); }
  dialog.innerHTML = '<div class="PERFASHINAL-profile-card"><div class="PERFASHINAL-profile-card__avatar">' + escapeHtml(profile.avatar || (profile.name || "T")[0]) + '</div><h2>' + escapeHtml(profile.name || "کاربر") + '</h2><p>@' + escapeHtml(profile.username) + (profile.verified ? ' <span class="PERFASHINAL-verified">✓</span>' : '') + '</p><p>' + escapeHtml(profile.favoriteGame || profile.favoriteGames?.[0] || "گیمر") + '</p><div class="PERFASHINAL-profile-card__stats"><div><b>' + Number(profile.followers || 0).toLocaleString("fa-IR") + '</b><span>دنبال‌کننده</span></div><div><b>' + Number(profile.following || 0).toLocaleString("fa-IR") + '</b><span>دنبال‌شونده</span></div><div><b>' + Number(profile.score || 0).toLocaleString("fa-IR") + '</b><span>امتیاز</span></div></div><a class="button" href="profile.html?user=' + encodeURIComponent(profile.username || "") + '">صفحه عمومی</a><button type="button">بستن</button></div>';
  dialog.querySelector("button").onclick = () => dialog.close();
  dialog.showModal();
}
function openProfile(username) {
  const normalized = String(username || "admin").replace(/^@/, "").toLowerCase();
  location.href = "profile.html?user=" + encodeURIComponent(normalized);
}
function authorHtml(author, name, verified) {
  return '<div class="PERFASHINAL-author"><span class="PERFASHINAL-author__avatar">' + escapeHtml((name || "T")[0]) + '</span><span>' + escapeHtml(name || "کاربر PERFASHINAL") + (verified ? ' <span class="PERFASHINAL-verified">✓</span>' : '') + '</span><button type="button" data-author="' + escapeHtml(author || "admin") + '">مشاهده پروفایل</button></div>';
}

/* باز کردن خبر → صفحه‌ی جدید به سبک اینستاگرام */
function openNews(item) {
  if (item && item.id) { location.href = "news-detail.html?id=" + encodeURIComponent(item.id); return; }
  let dialog = document.getElementById("PERFASHINALNewsDialog");
  if (!dialog) { dialog = document.createElement("dialog"); dialog.id = "PERFASHINALNewsDialog"; dialog.className = "PERFASHINAL-news-dialog"; document.body.append(dialog); }
  const tags = (item.tags || []).map(tag => '<span>#' + escapeHtml(tag) + '</span>').join("");
  dialog.innerHTML = '<article class="PERFASHINAL-news-detail"><button class="PERFASHINAL-dialog-close" type="button">×</button>' + (item.image ? '<img src="' + item.image + '" alt="">' : '') + '<span class="card-category">' + escapeHtml((item.tags || [item.category || "PERFASHINAL"])[0]) + '</span><h2>' + escapeHtml(item.title) + '</h2><p>' + escapeHtml(item.text) + '</p><p class="PERFASHINAL-news-tags">' + tags + '</p>' + authorHtml(item.author, item.authorName, item.verified) + '</article>';
  dialog.querySelector(".PERFASHINAL-dialog-close").onclick = () => dialog.close();
  dialog.querySelector("[data-author]")?.addEventListener("click", () => openProfile(item.author || "admin"));
  dialog.showModal();
}
function staticNews(card) {
  return {
    title: card.querySelector("h2,h3")?.textContent.trim() || "خبر PERFASHINAL",
    text: card.querySelector("p")?.textContent.trim() || "",
    category: card.querySelector(".news-tag,.card-category")?.textContent.trim() || "PERFASHINAL",
    author: "admin", authorName: "ادمین PERFASHINAL", verified: true, tags: [],
    image: card.querySelector("img")?.src || ""
  };
}
function createNewsCard(item) {
  const card = document.createElement("article");
  card.className = "news-card PERFASHINAL-user-news PERFASHINAL-openable";
  card.tabIndex = 0;
  card.innerHTML = '<div class="news-card-image">' + (item.image ? '<img src="' + item.image + '" alt="">' : '<i class="fa-solid fa-newspaper"></i>') + '</div><div class="news-card-content"><div class="news-card-top"><span class="card-category">' + escapeHtml((item.tags || [item.category || "خبر"])[0]) + '</span>' + (item.isOfficial ? '<span class="official-label">✓ رسمی</span>' : '') + '</div><h3>' + escapeHtml(item.title) + '</h3><p>' + escapeHtml(item.text) + '</p>' + authorHtml(item.author, item.authorName, item.verified) + '<div class="card-footer"><span>' + escapeHtml(item.game || item.category || "خبر") + '</span><span>' + Number(item.views || 0).toLocaleString("fa-IR") + ' بازدید</span></div></div>';
  card.addEventListener("click", event => {
    if (event.target.closest("[data-author]")) return;
    if (item.id) { location.href = "news-detail.html?id=" + encodeURIComponent(item.id); return; }
    openNews(item);
  });
  card.querySelector("[data-author]").addEventListener("click", event => { event.stopPropagation(); openProfile(item.author); });
  return card;
}
function bindStaticNews() {
  /* کارت‌های استاتیک حذف شدند — اخبار فقط از سرور رندر می‌شوند */
  PERFASHINALRequest("/news").then(result => {
    const grid = document.getElementById("newsGrid");
    if (!grid) return;
    grid.replaceChildren();
    if (!result.news.length) {
      const empty = document.createElement("p");
      empty.className = "PERFASHINAL-search-empty";
      empty.style.gridColumn = "1 / -1";
      empty.textContent = "هنوز خبری منتشر نشده — اولین خبر را تو بگذار! 📰";
      grid.append(empty);
      return;
    }
    result.news.slice().reverse().forEach(item => grid.append(createNewsCard(item)));
  }).catch(() => {});
}
/* News publishing is intentionally isolated in news-publish.html. */

function initAuth() {
  const login = document.getElementById("loginForm");
  if (login) login.addEventListener("submit", async event => {
    event.preventDefault(); event.stopImmediatePropagation();
    const username = document.getElementById("username")?.value.trim() || "";
    const password = document.getElementById("password")?.value || "";
    const box = document.getElementById("loginError");
    try {
      if (!/^[a-zA-Z0-9_]{3,24}$/.test(username)) throw new Error("نام کاربری باید ۳ تا ۲۴ کاراکتر انگلیسی، عدد یا _ باشد و فاصله نداشته باشد.");
      if (!password) throw new Error("رمز عبور نمی‌تواند خالی باشد.");
      const result = await PERFASHINALRequest("/login", { method: "POST", body: JSON.stringify({ username, password }) });
      localStorage.setItem("PERFASHINALUser", JSON.stringify(result.user));
      localStorage.setItem("PERFASHINALLoggedIn", "true");
      location.href = "index.html";
    } catch (error) { if (box) { box.textContent = error.message; box.classList.add("show"); } }
  }, true);
  const register = document.getElementById("registerForm");
  if (register) register.addEventListener("submit", async event => {
    event.preventDefault(); event.stopImmediatePropagation();
    const username = document.getElementById("username")?.value.trim() || "";
    const password = document.getElementById("password")?.value || "";
    const repeat = document.getElementById("confirmPassword")?.value || "";
    const accepted = document.getElementById("terms")?.checked;
    const box = document.getElementById("registerError");
    const submit = register.querySelector("button[type=submit]");
    function fail(message) { if (box) { box.textContent = message; box.classList.add("show"); box.classList.remove("success"); } if (submit) submit.disabled = false; }
    try {
      if (location.protocol === "file:") throw new Error("برای ثبت‌نام باید سرور اجرا باشد و صفحه را از http://localhost:3000/register.html باز کنی (نه با دابل‌کلیک روی فایل).");
      if (!/^[a-zA-Z0-9_]{3,24}$/.test(username)) throw new Error("نام کاربری باید ۳ تا ۲۴ کاراکتر انگلیسی، عدد یا _ باشد.");
      if (password.length < 8) throw new Error("رمز عبور باید حداقل 8 کاراکتر باشد.");
      if (/\s/.test(password)) throw new Error("رمز عبور نباید شامل فاصله باشد.");
      if (!/[A-Z]/.test(password)) throw new Error("رمز عبور باید حداقل یک حرف بزرگ انگلیسی داشته باشد.");
      if (!/[a-z]/.test(password)) throw new Error("رمز عبور باید حداقل یک حرف کوچک انگلیسی داشته باشد.");
      if (!/[0-9]/.test(password)) throw new Error("رمز عبور باید حداقل یک عدد داشته باشد.");
      if (password !== repeat) throw new Error("رمز عبور و تکرار رمز عبور یکسان نیستند.");
      if (!accepted) throw new Error("پذیرفتن قوانین سایت الزامی است.");
      if (submit) submit.disabled = true;
      await PERFASHINALRequest("/register", { method: "POST", body: JSON.stringify({ username, password, confirmPassword: repeat }) });
      if (box) { box.textContent = "⏳ ثبت‌نام انجام شد. منتظر تایید ادمین بمان..."; box.classList.add("show", "success"); }
      showToast?.("درخواست شما برای ادمین ارسال شد؛ منتظر تایید بمان.");
      register.reset();
      if (submit) submit.disabled = true;
      // هر ۲ ثانیه وضعیت تایید را از سرور چک می‌کنیم؛ به محض تایید ادمین کاربر وارد می‌شود
      const pollTimer = setInterval(async () => {
        try {
          const result = await PERFASHINALRequest("/register/status?username=" + encodeURIComponent(username));
          if (result.status === "rejected") { clearInterval(pollTimer); if (box) { box.textContent = "درخواست شما رد شد. دوباره تلاش کن."; box.classList.remove("success"); } if (submit) submit.disabled = false; return; }
          if (result.status !== "approved") return;
          clearInterval(pollTimer);
          localStorage.setItem("PERFASHINALUser", JSON.stringify(result.user));
          localStorage.setItem("PERFASHINALLoggedIn", "true");
          if (box) { box.textContent = "✅ ثبت‌نام شما تایید شد! در حال ورود..."; box.classList.add("show", "success"); }
          showToast?.("تایید شد! خوش آمدی 🎮");
          setTimeout(() => { location.href = "index.html"; }, 1200);
        } catch {}
      }, 2000);
    } catch (error) { fail(error.message); }
  }, true);
}
/* بار اول که کاربر سایت را می‌بیند، به صفحه خوش‌آمدگویی هدایت می‌شود */
function initWelcomeRedirect() {
  /* صفحه‌ی خانه دیگر خودکار به welcom.html فرستاده نمی‌شود.
     کاربر باید خودش صفحه‌ی خوش‌آمدگویی را انتخاب کند. */
  localStorage.setItem("PERFASHINALVisited", "true");
}
document.addEventListener("DOMContentLoaded", () => { initWelcomeRedirect(); addServicesLink(); initAuth(); });

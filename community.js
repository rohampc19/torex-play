"use strict";
document.addEventListener("DOMContentLoaded", () => {
  const api = window.PERFASHINALRequest;
  const list = document.getElementById("globalChatMessages");
  const form = document.getElementById("globalChatForm");
  const input = document.getElementById("globalChatInput");
  const hint = document.getElementById("communityLoginHint");
  const count = document.getElementById("globalChatCount");
  const user = typeof window.getUser === "function" ? window.getUser() : null;
  if (!api || !list || !form || !input) return;
  input.disabled = !user;
  if (user && hint) hint.textContent = `با نام ${user.name || user.username} در چت گلوبال هستی.`;
  const formatTime = value => { const date = new Date(value); return Number.isNaN(date.getTime()) ? "" : new Intl.DateTimeFormat("fa-IR", { hour: "2-digit", minute: "2-digit" }).format(date); };
  function render(messages) {
    list.replaceChildren();
    if (count) count.textContent = `${messages.length.toLocaleString("fa-IR")} پیام`;
    if (!messages.length) { const empty = document.createElement("p"); empty.className = "community-state"; empty.textContent = "هنوز پیامی نیست؛ اولین پیام را تو بفرست!"; list.append(empty); return; }
    messages.forEach(item => { const row = document.createElement("article"); row.className = "global-chat-message"; const avatar = document.createElement("span"); avatar.className = "global-chat-avatar"; avatar.textContent = String(item.avatar || item.name || item.sender || "؟")[0].toUpperCase(); const bubble = document.createElement("div"); bubble.className = "global-chat-bubble"; const name = document.createElement("strong"); name.textContent = item.name || item.sender || "کاربر"; const text = document.createElement("p"); text.textContent = item.text; const time = document.createElement("time"); time.textContent = formatTime(item.createdAt); bubble.append(name, text, time); row.append(avatar, bubble); list.append(row); }); list.scrollTop = list.scrollHeight;
  }
  async function load() { try { const result = await api("/community/messages"); render(Array.isArray(result.messages) ? result.messages : []); } catch (error) { list.innerHTML = "<p class=\"community-state\">دریافت پیام‌ها ممکن نیست؛ سرور را بررسی کن.</p>"; } }
  form.addEventListener("submit", async event => { event.preventDefault(); const text = input.value.trim(); if (!user) { location.href = "login.html"; return; } if (!text) return; input.disabled = true; try { await api("/community/messages", { method: "POST", body: JSON.stringify({ text }) }); input.value = ""; await load(); } catch (error) { if (window.VEXORAChatToast) window.VEXORAChatToast(error.message, "error"); } finally { input.disabled = false; input.focus(); } });
  load(); setInterval(load, 4000);
});

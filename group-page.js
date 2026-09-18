"use strict";
document.addEventListener("DOMContentLoaded", () => {
  const api = window.PERFASHINALRequest;
  const root = document.getElementById("groupView");
  const id = new URLSearchParams(location.search).get("id");
  const esc = value => { const node = document.createElement("span"); node.textContent = String(value ?? ""); return node.innerHTML; };
  async function load() {
    try { const result = await api(`/groups/${encodeURIComponent(id)}`); render(result.group); }
    catch (error) { root.innerHTML = `<p class="error-state">${esc(error.message)}</p>`; }
  }
  function render(group) {
    const members = group.members.map(member => `<li><span class="member-avatar">${esc(member.avatar)}</span>${esc(member.name || member.username)}${member.role === "leader" ? " (لیدر)" : ""}</li>`).join("");
    root.innerHTML = `<article class="group-detail"><header class="group-detail-head"><span class="group-avatar group-avatar-large">${group.avatar ? `<img src="${esc(group.avatar)}" alt="">` : esc(group.name[0])}</span><div><h1>${esc(group.name)}</h1><p>${esc(group.description || "بدون توضیحات")}</p><div class="group-meta"><span>لیدر: ${esc(group.leader?.name || group.leader?.username)}</span><span>اعضا: ${group.memberCount}/${group.maxMembers}</span></div></div></header><div class="group-detail-grid"><section class="group-members"><h2>اعضا</h2><ul>${members || "<li>هنوز عضوی نیست.</li>"}</ul>${group.isMember && !group.isLeader ? '<button class="second-button" id="leaveGroup">خروج از گروه</button>' : ''}${group.isLeader ? '<button class="second-button" id="editGroup">ویرایش اطلاعات</button><button class="second-button" id="groupRequests">درخواست‌های عضویت</button><button class="danger-button" id="deleteGroup">حذف گروه</button>' : ''}</section><section class="group-chat"><h2>چت گروه</h2><div class="group-chat-messages" id="groupMessages"><p class="empty-state">در حال دریافت پیام‌ها...</p></div>${group.isMember ? '<form id="groupMessageForm"><input id="groupMessageInput" maxlength="500" placeholder="پیام خود را بنویسید..." autocomplete="off"><button class="main-button">ارسال</button></form>' : '<p class="muted">فقط اعضای گروه به چت دسترسی دارند.</p>'}</section></div></article>`;
    bind(group);
  }
  function bind(group) {
    document.getElementById("editGroup")?.addEventListener("click", async () => { const description = prompt("توضیحات جدید گروه:", group.description || ""); if (description === null) return; await api(`/groups/${id}`, { method: "PATCH", body: JSON.stringify({ description }) }); load(); });
    document.getElementById("deleteGroup")?.addEventListener("click", async () => { if (!confirm("آیا مطمئن هستید که می‌خواهید این گروه را حذف کنید؟")) return; await api(`/groups/${id}`, { method: "DELETE" }); location.href = "groups.html"; });
    document.getElementById("leaveGroup")?.addEventListener("click", async () => { await api(`/groups/${id}/leave`, { method: "POST" }); location.href = "groups.html"; });
    const form = document.getElementById("groupMessageForm"); if (!form) return; const messages = document.getElementById("groupMessages");
    async function refresh() { try { const result = await api(`/groups/${id}/messages`); messages.innerHTML = result.messages.map(item => `<p><strong>${esc(item.user)}</strong> ${esc(item.message)}</p>`).join("") || '<p class="empty-state">هنوز پیامی نیست.</p>'; } catch (error) { messages.innerHTML = `<p class="error-state">${esc(error.message)}</p>`; } }
    form.addEventListener("submit", async event => { event.preventDefault(); const input = document.getElementById("groupMessageInput"); if (!input.value.trim()) return; await api(`/groups/${id}/messages`, { method: "POST", body: JSON.stringify({ text: input.value.trim() }) }); input.value = ""; refresh(); }); refresh();
  }
  load();
});
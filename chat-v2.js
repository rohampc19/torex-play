"use strict";
/* =========================================================
   MESSENGER — friends, conversations, add-friend, profile
   Uses the real backend: /api/friends, /api/messages, /api/users/:id
   ========================================================= */
document.addEventListener("DOMContentLoaded", () => {
  const api = window.PERFASHINALRequest;
  const user = typeof getUser === "function" ? getUser() : null;
  const page = document.querySelector(".messenger-page");
  const list = document.getElementById("chatList");
  const messages = document.getElementById("messages");
  const form = document.getElementById("messageForm");
  const input = document.getElementById("messageInput");
  const search = document.getElementById("userSearch");
  const searchResult = document.getElementById("searchResult");
  const modal = document.getElementById("addFriendModal");
  const modalForm = document.getElementById("addFriendForm");
  const playerIdInput = document.getElementById("playerIdInput");
  const modalMessage = document.getElementById("addFriendMessage");
  const addFriendSubmit = document.getElementById("addFriendSubmit");
  if (!api || !page || !list || !messages || !form || !input) return;

  let contacts = [];
  let active = null;
  let pollTimer = null;
  let sending = false;

  const time = value => new Intl.DateTimeFormat("fa-IR", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));

  function setConversationState(text, type = "empty-conversation") {
    messages.replaceChildren();
    const box = document.createElement("p");
    box.className = type;
    box.textContent = text;
    messages.append(box);
  }

  function friendAvatar(contact) {
    return (contact.avatar || contact.name || contact.username || "؟")[0].toUpperCase();
  }

  /* ---------- Rendering ---------- */

  function renderMessage(item) {
    const mine = item.sender === (user && user.username);
    const row = document.createElement("div");
    row.className = `message-row ${mine ? "sent" : "received"}`;
    if (!mine) {
      const avatar = document.createElement("span");
      avatar.className = "small-avatar";
      avatar.textContent = (item.sender || "؟")[0].toUpperCase();
      row.append(avatar);
    }
    const bubble = document.createElement("div");
    bubble.className = "message-bubble";
    const text = document.createElement("p");
    text.textContent = item.text;
    const stamp = document.createElement("span");
    stamp.textContent = time(item.createdAt) + (mine ? " ✓" : "");
    bubble.append(text, stamp);
    row.append(bubble);
    messages.append(row);
  }

  function renderEmptyFriends() {
    list.replaceChildren();
    const box = document.createElement("div");
    box.className = "empty-friends";
    box.innerHTML =
      '<span class="empty-friends__hand" aria-hidden="true">' +
      '<span class="empty-friends__palm"></span>' +
      '<span class="empty-friends__finger"></span>' +
      '<span class="empty-friends__finger"></span>' +
      '<span class="empty-friends__finger"></span>' +
      '<span class="empty-friends__question">؟</span>' +
      "</span>" +
      "<strong>هنوز دوستی نداری</strong>" +
      "<p>با وارد کردن آیدی یک بازیکن می‌تونی دوست جدید اضافه کنی.</p>";
    const cta = document.createElement("button");
    cta.type = "button";
    cta.className = "add-friend-button";
    cta.textContent = "+ افزودن دوست";
    cta.addEventListener("click", openAddFriendModal);
    box.append(cta);
    list.append(box);
  }

  function renderContacts(filtered) {
    const items = filtered || contacts;
    list.replaceChildren();
    if (!contacts.length) {
      renderEmptyFriends();
      return;
    }
    if (!items.length) {
      const empty = document.createElement("div");
      empty.className = "chat-empty";
      empty.textContent = "دوستی با این مشخصات پیدا نشد.";
      list.append(empty);
      return;
    }
    items.forEach(contact => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "chat-user" + (active && active.username === contact.username ? " active" : "");
      button.dataset.user = contact.username;
      button.innerHTML =
        `<span class="chat-avatar${contact.online ? " online" : ""}"></span>` +
        '<span class="chat-user-info">' +
        '<span class="chat-user-top"><strong></strong>' +
        (contact.unread ? `<span class="chat-unread">${Number(contact.unread).toLocaleString("fa-IR")}</span>` : "") +
        "</span>" +
        '<span class="chat-user-bottom"><span class="chat-preview"></span>' +
        (contact.lastMessageTime ? `<span class="chat-time">${time(contact.lastMessageTime)}</span>` : "") +
        "</span></span>";
      button.querySelector(".chat-avatar").textContent = friendAvatar(contact);
      button.querySelector("strong").textContent = contact.name || contact.username;
      button.querySelector(".chat-preview").textContent = contact.lastMessage || "@" + contact.username;
      button.addEventListener("click", () => activate(contact));
      list.append(button);
    });
  }

  /* ---------- Data ---------- */

  async function loadContacts() {
    if (!user) {
      document.getElementById("messageCount").textContent = "۰";
      list.replaceChildren();
      const box = document.createElement("p");
      box.className = "chat-empty";
      box.textContent = "برای دیدن و ارسال پیام وارد حساب شوید.";
      list.append(box);
      return;
    }
    try {
      const data = await api("/friends");
      contacts = data.friends || [];
      document.getElementById("messageCount").textContent = contacts.length.toLocaleString("fa-IR");
      const query = search && search.value.trim().toLowerCase().replace(/^@/, "");
      renderContacts(query ? contacts.filter(c => c.username.includes(query) || String(c.name || "").toLowerCase().includes(query)) : null);
      if (active) {
        active = contacts.find(contact => contact.username === active.username) || active;
      } else if (contacts[0]) {
        activate(contacts[0]);
      }
    } catch (error) {
      if (!user) return;
      list.replaceChildren();
      const box = document.createElement("p");
      box.className = "error-state";
      box.textContent = error.message;
      list.append(box);
    }
  }

  async function loadMessages() {
    if (!active || !user) return;
    try {
      const data = await api(`/messages?conversation=${encodeURIComponent(active.username)}`);
      messages.replaceChildren();
      if (!data.messages.length) {
        setConversationState("هنوز پیامی در این گفتگو نیست. اولین پیام را بفرست!");
      } else {
        data.messages.forEach(renderMessage);
      }
      messages.scrollTop = messages.scrollHeight;
    } catch (error) {
      setConversationState(error.message, "error-state");
    }
  }

  function activate(contact) {
    active = contact;
    document.querySelectorAll(".chat-user").forEach(item => item.classList.toggle("active", item.dataset.user === contact.username));
    document.getElementById("conversationAvatar").textContent = friendAvatar(contact);
    document.getElementById("conversationName").textContent = contact.name || contact.username;
    document.getElementById("conversationHandle").textContent = "@" + contact.username;
    input.disabled = !user;
    page.classList.add("conversation-open");
    loadMessages();
  }

  /* ---------- Public profile ---------- */

  function openFriendProfile() {
    if (active && typeof openProfile === "function") openProfile(active.username);
  }

  /* ---------- Send message ---------- */

  form.addEventListener("submit", async event => {
    event.preventDefault();
    const text = input.value.trim();
    if (!user) { location.href = "login.html"; return; }
    if (!active || !text || sending) return;
    sending = true;
    input.disabled = true;
    const button = form.querySelector(".send-button");
    if (button) { button.disabled = true; button.textContent = "..."; }
    try {
      const data = await api("/messages", { method: "POST", body: JSON.stringify({ conversation: active.username, text }) });
      if (messages.querySelector(".empty-conversation, .error-state")) messages.replaceChildren();
      input.value = "";
      renderMessage(data.message);
      messages.scrollTop = messages.scrollHeight;
      const contact = contacts.find(item => item.username === active.username);
      if (contact) { contact.lastMessage = text; contact.lastMessageTime = data.message.createdAt; }
    } catch (error) {
      showToast(error.message);
    } finally {
      sending = false;
      input.disabled = false;
      if (button) { button.disabled = false; button.textContent = "ارسال"; }
      input.focus();
    }
  });

  /* ---------- Add friend modal ---------- */

  function openAddFriendModal() {
    if (!user) { showToast("برای افزودن دوست ابتدا وارد شوید."); location.href = "login.html"; return; }
    modalMessage.textContent = "";
    modalMessage.className = "add-friend-message";
    playerIdInput.value = "";
    modal.showModal();
    playerIdInput.focus();
  }

  function setModalMessage(text, type) {
    modalMessage.textContent = text;
    modalMessage.className = "add-friend-message" + (type ? " " + type : "");
  }

  modalForm.addEventListener("submit", async event => {
    event.preventDefault();
    const playerId = playerIdInput.value.trim().replace(/^@/, "");
    if (!playerId) { setModalMessage("آیدی بازیکن را وارد کنید.", "error"); return; }
    if (playerId.toLowerCase() === (user && user.username || "").toLowerCase()) { setModalMessage("نمی‌توانی خودت را اضافه کنی.", "error"); return; }
    addFriendSubmit.disabled = true;
    setModalMessage("در حال جستجوی بازیکن...");
    try {
      const result = await api("/friends", { method: "POST", body: JSON.stringify({ playerId }) });
      setModalMessage("دوست جدید اضافه شد! 🎮", "success");
      showToast("دوست جدید اضافه شد.");
      setTimeout(() => { modal.close(); }, 700);
      await loadContacts();
      if (result.friend && !contacts.some(c => c.username === result.friend.username)) contacts.push(result.friend);
    } catch (error) {
      setModalMessage(error.message, "error");
    } finally {
      addFriendSubmit.disabled = false;
    }
  });

  document.getElementById("addFriendButton").addEventListener("click", openAddFriendModal);
  document.getElementById("addFriendCancel").addEventListener("click", () => modal.close());
  modal.addEventListener("cancel", () => modal.close());
  modal.addEventListener("click", event => { if (event.target === modal) modal.close(); });

  /* ---------- Search ---------- */

  if (search) search.addEventListener("input", () => {
    const value = search.value.trim().toLowerCase().replace(/^@/, "");
    const filtered = contacts.filter(contact => !value || contact.username.includes(value) || String(contact.name || "").toLowerCase().includes(value));
    renderContacts(filtered);
    const match = value && contacts.find(contact => contact.username.startsWith(value));
    searchResult.hidden = !match;
    if (match) {
      searchResult.querySelector(".search-result-avatar").textContent = friendAvatar(match);
      searchResult.querySelector("strong").textContent = match.name || match.username;
      searchResult.onclick = () => activate(match);
    }
  });

  /* ---------- Wiring ---------- */

  document.getElementById("mobileBack").addEventListener("click", () => page.classList.remove("conversation-open"));
  document.getElementById("profileButton").addEventListener("click", openFriendProfile);
  document.getElementById("conversationUser").addEventListener("click", openFriendProfile);
  document.getElementById("stickerButton").addEventListener("click", () => { if (!input.disabled) { input.value += " 🙂"; input.focus(); } });

  window.addEventListener("beforeunload", () => clearInterval(pollTimer));

  loadContacts();
  if (user) pollTimer = setInterval(() => { loadContacts(); if (active) loadMessages(); }, 5000);
});

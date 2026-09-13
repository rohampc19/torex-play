"use strict";

/* TOREX PLAY — Messenger V2
   Realtime client: initial history + authenticated SSE, no polling. */
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
  const addFriendButton = document.getElementById("addFriendButton");
  const cancelButton = document.getElementById("addFriendCancel");
  const mobileBack = document.getElementById("mobileBack");
  const profileButton = document.getElementById("profileButton");
  const conversationUser = document.getElementById("conversationUser");
  const stickerButton = document.getElementById("stickerButton");

  if (!api || !page || !list || !messages || !form || !input) return;

  let contacts = [];
  let active = null;
  let realtimeController = null;
  let realtimeReconnectTimer = null;
  let realtimeReconnectAttempt = 0;
  let sending = false;
  let loadingMessages = false;
  const renderedMessageIds = new Set();

  const time = value => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "" : new Intl.DateTimeFormat("fa-IR", { hour: "2-digit", minute: "2-digit" }).format(date);
  };
  const normalize = value => String(value || "").trim().toLowerCase().replace(/^@/, "");
  const toast = message => typeof showToast === "function" ? showToast(message) : (window.TOREXToast ? window.TOREXToast(message, "error") : alert(message));

  function setConversationState(text, type = "empty-conversation") {
    messages.replaceChildren();
    renderedMessageIds.clear();
    const box = document.createElement("p");
    box.className = type;
    box.textContent = text;
    messages.append(box);
  }

  function friendAvatar(contact) {
    return String(contact?.avatar || contact?.name || contact?.username || "؟")[0].toUpperCase();
  }

  function renderMessage(item) {
    if (!item || !item.id || renderedMessageIds.has(item.id)) return;
    renderedMessageIds.add(item.id);
    const mine = !!user && item.sender === user.username;
    const row = document.createElement("div");
    row.className = `message-row ${mine ? "sent" : "received"}`;
    row.dataset.messageId = item.id;
    if (!mine) {
      const avatar = document.createElement("span");
      avatar.className = "small-avatar";
      avatar.textContent = String(item.sender || "؟")[0].toUpperCase();
      row.append(avatar);
    }
    const bubble = document.createElement("div");
    bubble.className = "message-bubble";
    const text = document.createElement("p");
    text.textContent = String(item.text || "");
    const stamp = document.createElement("span");
    stamp.textContent = time(item.createdAt) + (mine ? " ✓" : "");
    bubble.append(text, stamp);
    row.append(bubble);
    messages.append(row);
  }

  function renderContacts(filtered = contacts) {
    list.replaceChildren();
    if (!contacts.length) {
      const box = document.createElement("div");
      box.className = "empty-friends";
      const strong = document.createElement("strong");
      strong.textContent = "هنوز دوستی نداری";
      const p = document.createElement("p");
      p.textContent = "با وارد کردن آیدی یک بازیکن می‌تونی دوست جدید اضافه کنی.";
      box.append(strong, p);
      if (addFriendButton) {
        const cta = document.createElement("button");
        cta.type = "button";
        cta.className = "add-friend-button";
        cta.textContent = "+ افزودن دوست";
        cta.addEventListener("click", openAddFriendModal);
        box.append(cta);
      }
      list.append(box);
      return;
    }
    if (!filtered.length) {
      const empty = document.createElement("div");
      empty.className = "chat-empty";
      empty.textContent = "دوستی با این مشخصات پیدا نشد.";
      list.append(empty);
      return;
    }
    filtered.forEach(contact => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "chat-user" + (active?.username === contact.username ? " active" : "");
      button.dataset.user = contact.username;
      const avatar = document.createElement("span");
      avatar.className = "chat-avatar" + (contact.online ? " online" : "");
      avatar.textContent = friendAvatar(contact);
      const info = document.createElement("span");
      info.className = "chat-user-info";
      const top = document.createElement("span"); top.className = "chat-user-top";
      const name = document.createElement("strong"); name.textContent = contact.name || contact.username; top.append(name);
      if (contact.unread) { const unread = document.createElement("span"); unread.className = "chat-unread"; unread.textContent = Number(contact.unread).toLocaleString("fa-IR"); top.append(unread); }
      const bottom = document.createElement("span"); bottom.className = "chat-user-bottom";
      const preview = document.createElement("span"); preview.className = "chat-preview"; preview.textContent = contact.lastMessage || "@" + contact.username; bottom.append(preview);
      if (contact.lastMessageTime) { const stamp = document.createElement("span"); stamp.className = "chat-time"; stamp.textContent = time(contact.lastMessageTime); bottom.append(stamp); }
      info.append(top, bottom); button.append(avatar, info);
      button.addEventListener("click", () => activate(contact));
      list.append(button);
    });
  }

  async function loadContacts() {
    if (!user) {
      const count = document.getElementById("messageCount");
      if (count) count.textContent = "۰";
      list.replaceChildren();
      const box = document.createElement("p"); box.className = "chat-empty"; box.textContent = "برای دیدن و ارسال پیام وارد حساب شوید."; list.append(box);
      return;
    }
    try {
      const data = await api("/friends");
      contacts = Array.isArray(data.friends) ? data.friends : [];
      const count = document.getElementById("messageCount"); if (count) count.textContent = contacts.length.toLocaleString("fa-IR");
      if (active) active = contacts.find(c => c.username === active.username) || active;
      const query = normalize(search?.value);
      renderContacts(query ? contacts.filter(c => normalize(c.username).includes(query) || normalize(c.name).includes(query)) : contacts);
      if (active && !contacts.some(c => c.username === active.username)) {
        active = null;
        stopRealtime();
      }
      if (!active && contacts[0]) activate(contacts[0]);
    } catch (error) {
      list.replaceChildren(); const box = document.createElement("p"); box.className = "error-state"; box.textContent = error.message || "دریافت دوستان ناموفق بود."; list.append(box);
    }
  }

  async function loadMessages() {
    if (!active || !user || loadingMessages) return;
    loadingMessages = true;
    try {
      const data = await api(`/messages?conversation=${encodeURIComponent(active.username)}`);
      messages.replaceChildren();
      renderedMessageIds.clear();
      const items = Array.isArray(data.messages) ? data.messages : [];
      if (!items.length) setConversationState("هنوز پیامی در این گفتگو نیست. اولین پیام را بفرست!");
      else items.forEach(renderMessage);
      messages.scrollTop = messages.scrollHeight;
    } catch (error) { setConversationState(error.message || "دریافت پیام‌ها ناموفق بود.", "error-state"); }
    finally { loadingMessages = false; }
  }

  function stopRealtime() {
    if (realtimeReconnectTimer) { clearTimeout(realtimeReconnectTimer); realtimeReconnectTimer = null; }
    if (realtimeController) { realtimeController.abort(); realtimeController = null; }
    realtimeReconnectAttempt = 0;
  }

  function scheduleRealtimeReconnect() {
    if (!active || !user || realtimeReconnectTimer) return;
    const delay = Math.min(10000, 1000 * (2 ** Math.min(realtimeReconnectAttempt, 3)));
    realtimeReconnectAttempt += 1;
    realtimeReconnectTimer = setTimeout(() => {
      realtimeReconnectTimer = null;
      startRealtime();
    }, delay);
  }

  async function startRealtime() {
    stopRealtime();
    if (!active || !user) return;
    const token = localStorage.getItem("PERFASHINALToken");
    if (!token) return;

    const controller = new AbortController();
    realtimeController = controller;
    const conversation = active.username;
    const url = `/api/messages/stream?conversation=${encodeURIComponent(conversation)}`;

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}`, Accept: "text/event-stream" },
        cache: "no-store",
        signal: controller.signal
      });
      if (!response.ok || !response.body) throw new Error("اتصال realtime برقرار نشد.");

      realtimeReconnectAttempt = 0;
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (!controller.signal.aborted) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const packets = buffer.split("\n\n");
        buffer = packets.pop() || "";
        for (const packet of packets) {
          const dataLine = packet.split("\n").find(line => line.startsWith("data: "));
          if (!dataLine) continue;
          try {
            const payload = JSON.parse(dataLine.slice(6));
            if (packet.includes("event: message") && payload?.id) {
              const isCurrentConversation = payload.conversation === conversation || payload.sender === conversation;
              if (isCurrentConversation) {
                if (messages.querySelector(".empty-conversation, .error-state")) messages.replaceChildren();
                renderMessage(payload);
                messages.scrollTop = messages.scrollHeight;
                const contact = contacts.find(item => item.username === conversation);
                if (contact) { contact.lastMessage = payload.text; contact.lastMessageTime = payload.createdAt; contact.unread = payload.sender === conversation ? 0 : contact.unread; }
              }
            }
          } catch {}
        }
      }
      if (!controller.signal.aborted) scheduleRealtimeReconnect();
    } catch (error) {
      if (!controller.signal.aborted) scheduleRealtimeReconnect();
    } finally {
      if (realtimeController === controller) realtimeController = null;
    }
  }

  function activate(contact) {
    if (!contact) return;
    stopRealtime();
    active = contact;
    document.querySelectorAll(".chat-user").forEach(item => item.classList.toggle("active", item.dataset.user === contact.username));
    const avatar = document.getElementById("conversationAvatar"); if (avatar) avatar.textContent = friendAvatar(contact);
    const name = document.getElementById("conversationName"); if (name) name.textContent = contact.name || contact.username;
    const handle = document.getElementById("conversationHandle"); if (handle) handle.textContent = "@" + contact.username;
    input.disabled = !user;
    page.classList.add("conversation-open");
    loadMessages().then(startRealtime);
  }

  function openFriendProfile() {
    if (active && typeof openProfile === "function") openProfile(active.username);
  }

  form.addEventListener("submit", async event => {
    event.preventDefault();
    const text = input.value.trim();
    if (!user) { location.href = "login.html"; return; }
    if (!active || !text || sending) return;
    sending = true; input.disabled = true;
    const button = form.querySelector(".send-button"); if (button) { button.disabled = true; button.textContent = "..."; }
    try {
      const data = await api("/messages", { method: "POST", body: JSON.stringify({ conversation: active.username, text }) });
      if (messages.querySelector(".empty-conversation, .error-state")) messages.replaceChildren();
      input.value = "";
      if (data.message) renderMessage(data.message);
      messages.scrollTop = messages.scrollHeight;
      const contact = contacts.find(item => item.username === active.username);
      if (contact && data.message) { contact.lastMessage = text; contact.lastMessageTime = data.message.createdAt; }
    } catch (error) { toast(error.message || "پیام ارسال نشد."); }
    finally { sending = false; input.disabled = !user; if (button) { button.disabled = false; button.textContent = "ارسال"; } input.focus(); }
  });

  function openAddFriendModal() {
    if (!user) { toast("برای افزودن دوست ابتدا وارد شوید."); location.href = "login.html"; return; }
    if (!modal || !playerIdInput) return;
    if (modalMessage) { modalMessage.textContent = ""; modalMessage.className = "add-friend-message"; }
    playerIdInput.value = ""; modal.showModal(); playerIdInput.focus();
  }
  function setModalMessage(text, type = "") { if (modalMessage) { modalMessage.textContent = text; modalMessage.className = "add-friend-message" + (type ? " " + type : ""); } }

  modalForm?.addEventListener("submit", async event => {
    event.preventDefault();
    if (!playerIdInput || !addFriendSubmit) return;
    const playerId = normalize(playerIdInput.value);
    if (!playerId) return setModalMessage("آیدی بازیکن را وارد کنید.", "error");
    if (playerId === normalize(user?.username)) return setModalMessage("نمی‌توانی خودت را اضافه کنی.", "error");
    addFriendSubmit.disabled = true; setModalMessage("در حال جستجوی بازیکن...");
    try {
      const result = await api("/friends", { method: "POST", body: JSON.stringify({ playerId }) });
      setModalMessage("دوست جدید اضافه شد!", "success"); toast("دوست جدید اضافه شد.");
      await loadContacts();
      if (result.friend && !contacts.some(c => c.username === result.friend.username)) contacts.push(result.friend);
      setTimeout(() => modal?.close(), 500);
    } catch (error) { setModalMessage(error.message || "افزودن دوست ناموفق بود.", "error"); }
    finally { addFriendSubmit.disabled = false; }
  });

  addFriendButton?.addEventListener("click", openAddFriendModal);
  cancelButton?.addEventListener("click", () => modal?.close());
  modal?.addEventListener("click", event => { if (event.target === modal) modal.close(); });
  search?.addEventListener("input", () => {
    const value = normalize(search.value);
    renderContacts(value ? contacts.filter(c => normalize(c.username).includes(value) || normalize(c.name).includes(value)) : contacts);
    const match = value && contacts.find(c => normalize(c.username).startsWith(value));
    if (!searchResult) return;
    searchResult.hidden = !match;
    if (match) {
      const avatar = searchResult.querySelector(".search-result-avatar"); if (avatar) avatar.textContent = friendAvatar(match);
      const name = searchResult.querySelector("strong"); if (name) name.textContent = match.name || match.username;
      searchResult.onclick = () => activate(match);
    }
  });

  mobileBack?.addEventListener("click", () => { stopRealtime(); page.classList.remove("conversation-open"); });
  profileButton?.addEventListener("click", openFriendProfile);
  conversationUser?.addEventListener("click", openFriendProfile);
  stickerButton?.addEventListener("click", () => { if (!input.disabled) { input.value += " 🙂"; input.focus(); } });
  window.addEventListener("beforeunload", stopRealtime);

  loadContacts();
});

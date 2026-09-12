"use strict";
document.addEventListener("DOMContentLoaded", () => {
  const stats = document.getElementById("profileStats");
  const articles = document.getElementById("profilePublishedNews");
  const toggle = document.getElementById("publishedNewsButton");
  if (!stats || !articles || typeof getLocalDemoUsers !== "function") return;
  let session = null;
  try { session = JSON.parse(localStorage.getItem("PERFASHINALUser") || "null"); } catch (_) { session = null; }
  const queryUser = new URLSearchParams(location.search).get("user");
  const user = getLocalDemoUsers().find(item => item.username === (queryUser || session?.username || "admin")) || getLocalDemoUsers()[0];
  const ownNews = typeof getLocalDemoNews === "function" ? getLocalDemoNews().filter(item => item.author === user.username) : [];
  const isPublicProfile = Boolean(queryUser && queryUser !== session?.username);
  if (isPublicProfile) {
    document.querySelector(".profile-page-title h1")?.replaceChildren(document.createTextNode(`پروفایل ${user.name}`));
    document.querySelector(".profile-page-title p")?.replaceChildren(document.createTextNode("پروفایل عمومی نویسنده و فعالیت‌های او در جامعه گیمرها."));
    document.querySelector(".profile-edit-card")?.setAttribute("hidden", "");
    document.querySelector(".favorite-games-edit")?.setAttribute("hidden", "");
    document.querySelector(".account-section")?.setAttribute("hidden", "");
  }
  const avatar = document.getElementById("publicAvatar"), identity = document.getElementById("publicIdentity"), bio = document.getElementById("publicBio"), score = document.getElementById("publicScore"), games = document.getElementById("publicGames"), followButton = document.getElementById("profileFollowButton");
  if (avatar) avatar.textContent = user.avatar || user.name[0];
  if (identity) identity.textContent = `@${user.username} · سطح ${Number(user.level).toLocaleString("fa-IR")}`;
  if (bio) bio.textContent = user.bio || "عضو جامعه گیمرها";
  if (score) score.textContent = `${Number(user.score).toLocaleString("fa-IR")} امتیاز`;
  const sessionUser = session?.username || "";
  const isOwnProfile = sessionUser === user.username || (!queryUser && !sessionUser);
  if (followButton && !isOwnProfile) {
    followButton.hidden = false;
    const follows = () => JSON.parse(localStorage.getItem("LOCAL_DEMO_FOLLOWS") || "[]");
    const updateFollow = () => { const state = follows().some(item => item.follower === sessionUser && item.target === user.username); followButton.textContent = state ? "دنبال می‌کنید ✓" : "دنبال کردن"; followButton.setAttribute("aria-pressed", String(state)); };
    updateFollow();
    followButton.addEventListener("click", () => { if (!sessionUser) { location.href = "login.html"; return; } const list = follows(); const index = list.findIndex(item => item.follower === sessionUser && item.target === user.username); if (index >= 0) list.splice(index, 1); else list.push({ follower: sessionUser, target: user.username }); localStorage.setItem("LOCAL_DEMO_FOLLOWS", JSON.stringify(list)); updateFollow(); });
  }
  if (games) games.replaceChildren(...(user.favoriteGames || []).map(game => { const chip = document.createElement("span"); chip.textContent = game; return chip; }));
  const values = [["دنبال‌کننده", user.followers], ["دنبال‌شونده", user.following], ["خبر منتشرشده", user.newsPublished], ["لایک خبرها", user.newsLikes]];
  stats.replaceChildren(...values.map(([label, value]) => { const card = document.createElement("article"); card.className = "profile-stat-card"; card.innerHTML = "<strong></strong><span></span>"; card.querySelector("strong").textContent = Number(value).toLocaleString("fa-IR"); card.querySelector("span").textContent = label; return card; }));
  function render() { articles.replaceChildren(); if (!ownNews.length) { articles.innerHTML = '<p class="empty-state">هنوز خبری از این حساب ثبت نشده است.</p>'; return; } ownNews.forEach(item => { const card = document.createElement("article"); card.className = "profile-news-card"; card.dataset.articleId = item.id; card.innerHTML = "<span class=\"card-category\"></span><h3></h3><p></p><small></small>"; card.querySelector(".card-category").textContent = item.category; card.querySelector("h3").textContent = item.title; card.querySelector("p").textContent = item.excerpt; card.querySelector("small").textContent = `${Number(item.likes).toLocaleString("fa-IR")} لایک · ${Number(item.views).toLocaleString("fa-IR")} بازدید`; card.addEventListener("click", () => { location.href = `news-detail.html?id=${encodeURIComponent(item.id)}`; }); articles.append(card); }); }
  const peopleDialog = document.getElementById("profilePeopleDialog"), peopleTitle = document.getElementById("peopleDialogTitle"), peopleList = document.getElementById("peopleDialogList");
  function showPeople(kind) { if (!peopleDialog || !peopleList) return; peopleTitle.textContent = kind === "followers" ? "دنبال‌کننده‌ها" : "دنبال‌شده‌ها"; peopleList.replaceChildren(...getLocalDemoUsers().filter(item => item.username !== user.username).map(person => { const row = document.createElement("article"); row.className = "profile-person"; row.innerHTML = "<span></span><div><strong></strong><small></small></div><button type=\"button\"></button>"; row.querySelector("span").textContent = person.avatar; row.querySelector("strong").textContent = person.name; row.querySelector("small").textContent = `@${person.username} · سطح ${person.level}`; row.querySelector("button").textContent = "مشاهده"; row.querySelector("button").addEventListener("click", () => { location.href = `profile.html?user=${encodeURIComponent(person.username)}`; }); return row; })); peopleDialog.showModal(); }
  document.getElementById("followersButton")?.addEventListener("click", () => showPeople("followers")); document.getElementById("followingButton")?.addEventListener("click", () => showPeople("following")); document.getElementById("closePeopleDialog")?.addEventListener("click", () => peopleDialog.close());
  toggle.addEventListener("click", () => { const open = articles.hidden; articles.hidden = !open; toggle.setAttribute("aria-expanded", String(open)); if (open) render(); });
  render();
});

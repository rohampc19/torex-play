"use strict";

/* صفحه جزئیات خبر — سبک اینستاگرام: لایک، کامنت، فالو */

document.addEventListener("DOMContentLoaded", () => {

  const api = window.PERFASHINALRequest || (async () => { throw new Error("سرور PERFASHINAL در دسترس نیست."); });

  const user = JSON.parse(localStorage.getItem("PERFASHINALUser") || "null");
  const me = user ? user.username : "";

  const params = new URLSearchParams(location.search);
  const newsId = params.get("id") || "";

  const $ = id => document.getElementById(id);

  let currentNews = null;
  let newsLikePending = false;
  const commentLikePending = new Set();

  function toast(message) {
    if (typeof showToast === "function") return showToast(message);
    alert(message);
  }

  function timeAgo(value) {
    const diff = (Date.now() - new Date(value).getTime()) / 1000;
    if (diff < 60) return "همین حالا";
    if (diff < 3600) return Math.floor(diff / 60) + " دقیقه پیش";
    if (diff < 86400) return Math.floor(diff / 3600) + " ساعت پیش";
    return new Intl.DateTimeFormat("fa-IR").format(new Date(value));
  }

  function renderAuthor(profile) {
    $("postAvatar").textContent = profile.avatar || (profile.name || "T")[0];
    $("postAuthorName").innerHTML = "";
    const name = document.createElement("span");
    name.textContent = profile.name || profile.username;
    $("postAuthorName").append(name);
    if (profile.verified) {
      const tick = document.createElement("span");
      tick.className = "PERFASHINAL-verified";
      tick.textContent = "✓";
      tick.title = "حساب معتبر";
      $("postAuthorName").append(" ", tick);
    }
    $("postAuthorHandle").textContent = "@" + profile.username;
    syncFollow(profile.isFollowing);
  }

  let followState = false;
  const localUsers = () => typeof getLocalDemoUsers === "function" ? getLocalDemoUsers() : [];
  const localNews = () => typeof getLocalDemoNews === "function" ? getLocalDemoNews() : [];
  function renderRelated(items) { const section = $("relatedArticles"), grid = section?.querySelector("div"); if (!section || !grid) return; const related = items.filter(item => item.id !== currentNews.id && (item.game === currentNews.game || item.category === currentNews.category)).slice(0, 3); if (!related.length) return; section.hidden = false; grid.replaceChildren(...related.map(item => { const card = document.createElement("a"); card.href = `news-detail.html?id=${encodeURIComponent(item.id)}`; card.className = "related-card"; card.innerHTML = "<span></span><strong></strong><small></small>"; card.querySelector("span").textContent = item.isBreaking ? "خبر داغ" : item.category; card.querySelector("strong").textContent = item.title; card.querySelector("small").textContent = `${Number(item.views || 0).toLocaleString("fa-IR")} بازدید`; return card; })); }
  function localFollow(target) { const key = "LOCAL_DEMO_FOLLOWS"; let follows = JSON.parse(localStorage.getItem(key) || "[]"); const index = follows.findIndex(item => item.follower === me && item.target === target); if (index >= 0) follows.splice(index, 1); else if (me && me !== target) follows.push({ follower: me, target }); localStorage.setItem(key, JSON.stringify(follows)); return follows.some(item => item.follower === me && item.target === target); }

  function syncFollow(state) {
    followState = !!state;
    const button = $("followButton");
    button.textContent = followState ? "دنبال می‌کنید ✓" : "دنبال کردن";
    button.setAttribute("aria-pressed", String(followState));
    button.classList.toggle("following", followState);
  }

  function renderComments(comments) {
    const list = $("commentsList");
    list.replaceChildren();
    if (!comments.length) {
      const empty = document.createElement("p");
      empty.className = "insta-comments__empty";
      empty.textContent = "هنوز نظری ثبت نشده — اولین نفر باش!";
      list.append(empty);
      return;
    }
    comments.forEach((comment, index) => {
      const row = document.createElement("div");
      row.className = "insta-comment" + (comment.replyTo ? " insta-comment--reply" : "");
      if (comment.replyTo) row.style.marginInlineStart = "36px";

      const profileLink = document.createElement("button");
      profileLink.type = "button";
      profileLink.className = "comment-profile-link";
      profileLink.setAttribute("aria-label", "مشاهده پروفایل کاربر");
      const avatar = document.createElement("span");
      avatar.className = "PERFASHINAL-author__avatar";
      avatar.textContent = (comment.name || comment.user || "T")[0];
      profileLink.append(avatar);
      profileLink.addEventListener("click", () => { if (comment.user && typeof openProfile === "function") openProfile(comment.user); });

      const body = document.createElement("div");

      const head = document.createElement("strong");
      head.textContent = comment.name || comment.user || "کاربر";
      if (comment.replyTo) head.textContent += " ← " + (comment.replyToName || comment.replyTo);

      const text = document.createElement("p");
      text.textContent = comment.text;

      const time = document.createElement("small");
      time.textContent = timeAgo(comment.createdAt);

      const actions = document.createElement("div");
      actions.className = "comment-actions";
      const likeButton = document.createElement("button");
      likeButton.type = "button";
      likeButton.textContent = `♥ ${Number(Array.isArray(comment.likes) ? comment.likes.length : comment.likes || 0).toLocaleString("fa-IR")}`;
      likeButton.addEventListener("click", async () => {
        if (!user || commentLikePending.has(comment.id)) { if (!user) toast("برای پسندیدن نظر ابتدا وارد شوید."); return; }
        commentLikePending.add(comment.id);
        likeButton.disabled = true;
        try { if (localUsers().length) { const key = `LOCAL_DEMO_COMMENT_LIKES_${currentNews.id}`; const liked = JSON.parse(localStorage.getItem(key) || "[]"); const currentlyLiked = liked.includes(comment.id); const desiredLiked = !currentlyLiked; if (currentlyLiked) liked.splice(liked.indexOf(comment.id), 1); else liked.push(comment.id); localStorage.setItem(key, JSON.stringify(liked)); likeButton.textContent = `♥ ${Number((comment.likes || []).length + (desiredLiked ? 1 : -1)).toLocaleString("fa-IR")}`; return; } const currentlyLiked = likeButton.classList.contains("liked"); const result = await api(`/news/${encodeURIComponent(currentNews.id)}/comment/${encodeURIComponent(comment.id)}/like`, { method: "POST", body: JSON.stringify({ liked: !currentlyLiked }) }); likeButton.classList.toggle("liked", result.liked); likeButton.textContent = `♥ ${Number(result.likes).toLocaleString("fa-IR")}`; } catch (error) { toast(error.message); } finally { commentLikePending.delete(comment.id); likeButton.disabled = false; }
      });
      const replyButton = document.createElement("button");
      replyButton.type = "button";
      replyButton.textContent = "پاسخ";
      replyButton.style.cssText = "background:none;border:0;color:#a29bfe;cursor:pointer;font-size:12px;padding:0;margin-top:4px";
      replyButton.addEventListener("click", () => {
        const input = $("commentInput");
        input.value = "@" + (comment.user || "") + " ";
        input.focus();
        input.dataset.replyIndex = String(index);
        input.dataset.replyUser = comment.user || "";
      });

      actions.append(likeButton, replyButton);
      body.append(head, text, time, actions);
      row.append(profileLink, body);
      list.append(row);
    });
  }

  function syncLikes(likes, liked) {
    $("likeCount").textContent = Number(likes).toLocaleString("fa-IR");
    $("likeButton").classList.toggle("liked", !!liked);
    const icon = $("likeButton")?.querySelector("i");
    if (icon) icon.className = liked ? "fa-solid fa-heart" : "fa-regular fa-heart";
    const glyph = $("likeButton")?.querySelector("span");
    if (glyph) glyph.textContent = liked ? "♥" : "♡";
  }

  async function load() {
    if (!newsId) { $("postTitle").textContent = "خبر پیدا نشد."; return; }
    try {
      let result;
      try {
        result = await api("/news/" + encodeURIComponent(newsId) + "?user=" + encodeURIComponent(me));
      } catch (apiError) {
        const local = typeof getLocalDemoNews === "function" ? getLocalDemoNews().find(item => item.id === newsId) : null;
        if (!local) throw apiError;
        result = { news: local };
      }
      currentNews = result.news;

      $("postTitle").textContent = currentNews.title;
      const articleContent = $("postText");
      articleContent.replaceChildren();
      String(currentNews.text || "").split(/\n{2,}|\r\n/).filter(Boolean).forEach(paragraph => {
        const p = document.createElement("p");
        p.textContent = paragraph.trim();
        articleContent.append(p);
      });
      $("postTime").textContent = timeAgo(currentNews.publishedAt || currentNews.createdAt);
      $("postCategory").textContent = (currentNews.tags || [currentNews.category || "خبر"])[0] || currentNews.category || "خبر";
      if ($("postGame")) $("postGame").textContent = currentNews.game ? `بازی: ${currentNews.game}` : "بازی مرتبط: —";
      if ($("postViews")) $("postViews").textContent = `${Number(currentNews.views || 0).toLocaleString("fa-IR")} بازدید`;

      const image = $("postImage");
      const cover = $("articleCover");
      if (currentNews.image) {
        const coverImage = document.createElement("img");
        coverImage.src = currentNews.image;
        coverImage.alt = currentNews.title;
        cover.replaceChildren(coverImage);
        image.hidden = true;
      } else {
        image.hidden = false;
        cover.replaceChildren(Object.assign(document.createElement("div"), { className: "article-cover__glow" }), Object.assign(document.createElement("span"), { className: "article-cover__label", id: "articleBreaking" }));
      }

      const tags = $("postTags");
      tags.replaceChildren();
      (currentNews.tags || []).forEach(tag => {
        const chip = document.createElement("span");
        chip.textContent = "#" + tag;
        tags.append(chip);
      });

      syncLikes(currentNews.likes, currentNews.liked);
      $("commentCount").textContent = Number((currentNews.comments || []).length).toLocaleString("fa-IR");
      if ($("commentCountLabel")) $("commentCountLabel").textContent = `${Number((currentNews.comments || []).length).toLocaleString("fa-IR")} نظر`;
      if ($("postSummary")) $("postSummary").textContent = currentNews.excerpt || "";
      if ($("postDateTime")) $("postDateTime").textContent = new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(currentNews.publishedAt || currentNews.createdAt));
      if ($("postOfficial")) {
        $("postOfficial").hidden = currentNews.isOfficial !== true;
        $("postOfficial").textContent = currentNews.isOfficial === true ? "✓ این خبر رسماً توسط ادمین منتشر شده است" : "";
      }
      if ($("articleBreaking")) $("articleBreaking").textContent = currentNews.isBreaking ? "خبر داغ" : "";
      renderComments(currentNews.comments || []);
      renderRelated([...(currentNews.related || []), ...localNews()]);

      try {
        if (localUsers().length) { const author = localUsers().find(item => item.username === currentNews.author); if (!author) throw new Error("author"); renderAuthor({ ...author, verified: currentNews.isOfficial === true, isFollowing: me && JSON.parse(localStorage.getItem("LOCAL_DEMO_FOLLOWS") || "[]").some(item => item.follower === me && item.target === author.username) }); }
        else { const profileResult = await api("/users/" + encodeURIComponent(currentNews.author) + "?follower=" + encodeURIComponent(me)); renderAuthor(profileResult.profile); }
      } catch { renderAuthor({ username: currentNews.author, name: currentNews.authorName, avatar: currentNews.authorAvatar, verified: currentNews.isOfficial === true }); }
    } catch (error) {
      $("postTitle").textContent = "خطا در دریافت خبر";
      $("postText").textContent = error.message;
    }
  }

  $("likeButton")?.addEventListener("click", async () => {
    if (!currentNews || newsLikePending) return;
    if (!user) { toast("برای پسندیدن خبر ابتدا وارد شوید."); return; }
    newsLikePending = true;
    const button = $("likeButton");
    button.disabled = true;
    try {
      if (localUsers().length) { const key = `LOCAL_DEMO_NEWS_LIKE_${currentNews.id}`; const currentlyLiked = localStorage.getItem(key) === "true"; const desiredLiked = !currentlyLiked; localStorage.setItem(key, String(desiredLiked)); currentNews.likes = Math.max(0, Number(currentNews.likes || 0) + (desiredLiked ? 1 : -1)); currentNews.liked = desiredLiked; syncLikes(currentNews.likes, desiredLiked); return; }
      const currentlyLiked = !!currentNews.liked;
      const result = await api("/news/" + encodeURIComponent(currentNews.id) + "/like", { method: "POST", body: JSON.stringify({ liked: !currentlyLiked }) });
      currentNews.likes = result.likes;
      currentNews.liked = result.liked;
      syncLikes(result.likes, result.liked);
    } catch (error) { toast(error.message); } finally { newsLikePending = false; button.disabled = false; }
  });

  $("followButton")?.addEventListener("click", async () => {
    if (!user) { toast("برای دنبال کردن ابتدا وارد شوید."); location.href = "login.html"; return; }
    if (!currentNews || currentNews.author === user.username) { toast("نمی‌توانی خودت را دنبال کنی."); return; }
    if (localUsers().length) { syncFollow(localFollow(currentNews.author)); toast(followState ? "کاربر دنبال شد." : "دنبال کردن لغو شد."); return; }
    try { const result = await api("/follow", { method: "POST", body: JSON.stringify({ target: currentNews.author }) }); syncFollow(result.following); toast(result.following ? "کاربر دنبال شد." : "دنبال کردن لغو شد."); } catch (error) { toast(error.message); }
  });

  $("viewProfileButton")?.addEventListener("click", () => { if (currentNews && typeof openProfile === "function") openProfile(currentNews.author); });
  $("postAuthor")?.addEventListener("click", () => { if (currentNews && typeof openProfile === "function") openProfile(currentNews.author); });

  $("commentFocus")?.addEventListener("click", () => $("commentInput")?.focus());
  $("commentInput")?.addEventListener("input", event => { const button = $("commentForm")?.querySelector("button"); if (button) button.disabled = !event.target.value.trim(); });

  $("shareButton")?.addEventListener("click", async () => {
    const url = location.href;
    if (navigator.share) { try { await navigator.share({ title: currentNews?.title || "خبر", url }); return; } catch (_) { return; } }
    const dialog = $("shareDialog"); if (dialog) { $("shareUrl").value = url; dialog.showModal(); }
  });
  $("copyShareLink")?.addEventListener("click", async () => { try { await navigator.clipboard.writeText($("shareUrl").value); toast("لینک خبر کپی شد."); $("shareDialog").close(); } catch { $("shareUrl").select(); document.execCommand("copy"); toast("لینک خبر کپی شد."); } });
  $("closeShareDialog")?.addEventListener("click", () => $("shareDialog")?.close());

  $("commentForm")?.addEventListener("submit", async event => {
    event.preventDefault();
    if (!currentNews) return;
    const input = $("commentInput");
    const text = input.value.replace(/@\S+\s?/, "").trim() || input.value.trim();
    if (!text) return;
    if (!user) { toast("برای ثبت نظر ابتدا وارد شوید."); location.href = "login.html"; return; }
    try {
      const replyIndex = input.dataset.replyIndex;
      const url = replyIndex != null && input.dataset.replyUser
        ? "/news/" + encodeURIComponent(currentNews.id) + "/comment/" + replyIndex
        : "/news/" + encodeURIComponent(currentNews.id) + "/comment";
      let result;
      if (localUsers().length) { const comment = { id: `demo-comment-${Date.now()}`, user: user.username, name: user.name || user.username, text, likes: [] , replyTo: replyIndex != null ? currentNews.comments[Number(replyIndex)]?.user : undefined, createdAt: new Date().toISOString() }; currentNews.comments = currentNews.comments || []; currentNews.comments.push(comment); result = { comment }; }
      else result = await api(url, { method: "POST", body: JSON.stringify({ text }) });
      currentNews.comments = currentNews.comments || [];
      if (!currentNews.comments.some(item => item.id === result.comment.id)) currentNews.comments.push(result.comment);
      $("commentCount").textContent = Number(currentNews.comments.length).toLocaleString("fa-IR");
      renderComments(currentNews.comments);
      input.value = "";
      delete input.dataset.replyIndex;
      delete input.dataset.replyUser;
      toast("نظر شما ثبت شد.");
    } catch (error) { toast(error.message); }
  });

  load();
});

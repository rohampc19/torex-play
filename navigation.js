"use strict";
/* Global top navigation — the ONLY navigation component on the site.
   Mounts exactly one header at the top of every page and removes any
   legacy bottom navigation bars. Brand text is intentionally neutral so
   a new name can be dropped in without touching code. */
(function () {
  const BRAND_NAME = "";
  const path = location.pathname.toLowerCase();
  const current = path.includes("leaderboard") ? "leaderboard" : path.includes("news") ? "news" : path.includes("chat") ? "chat" : path.includes("profile") ? "profile" : "home";
  const items = [
    { key: "home", href: "index.html", label: "خانه" },
    { key: "news", href: "news.html", label: "اخبار" },
    { key: "chat", href: "chat-v2.html", label: "چت" },
    { key: "profile", href: "profile.html", label: "پروفایل" },
    { key: "leaderboard", href: "leaderboard.html", label: "جدول امتیازات" }
  ];
  function markup() { return `<header class="global-header"><div class="global-header__inner"><a class="global-brand" href="index.html" aria-label="خانه"><span class="global-brand__mark">P</span><span class="global-brand__text">PERFASHINAL</span></a><nav class="global-nav" aria-label="ناوبری اصلی">${items.map(item => `<a class="global-nav__link${item.key === current ? " is-active" : ""}" data-page="${item.key}" href="${item.href}">${item.label}</a>`).join("")}</nav><div class="global-actions"><a class="global-login" href="login.html">ورود</a><a class="global-user" href="profile.html" hidden></a></div></div></header>`; }
  /* Bottom navigation bars must never exist — remove every legacy variant. */
  const LEGACY_SELECTORS = [".mobile-nav", ".mobile-bottom-nav", ".mobile-chat-nav", ".community-mobile-nav", ".bottom-nav", ".home-header", ".site-header", ".profile-header", ".slim-nav", ".main-header"];
  function mount() {
    document.querySelectorAll(".global-header").forEach(node => node.remove());
    LEGACY_SELECTORS.forEach(selector => document.querySelectorAll(selector).forEach(node => node.remove()));
    document.body.insertAdjacentHTML("afterbegin", markup());
    document.body.classList.add("has-global-navigation");
    const user = window.getUser ? getUser() : null;
    const login = document.querySelector(".global-login");
    const userLink = document.querySelector(".global-user");
    if (user && login && userLink) {
      login.hidden = true;
      userLink.hidden = false;
      userLink.textContent = user.name || "پروفایل";
      userLink.title = "پروفایل کاربر";
      userLink.insertAdjacentHTML("afterend", '<button type="button" class="global-logout">خروج</button>');
      document.querySelector(".global-logout").addEventListener("click", async () => { try { if (window.PERFASHINALRequest) await window.PERFASHINALRequest("/logout", { method: "POST" }); } catch (_) {} localStorage.removeItem("PERFASHINALUser"); localStorage.removeItem("PERFASHINALToken"); localStorage.removeItem("PERFASHINALLoggedIn"); location.href = "index.html"; });
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount, { once: true }); else mount();
}());

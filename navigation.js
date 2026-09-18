"use strict";
/* VEXORA CHAT — one clean text-only navigation across the entire site. */
(function () {
  const BRAND_NAME = "VEXORA CHAT";
  const path = location.pathname.toLowerCase();
  const current = path.includes("leaderboard") ? "leaderboard" : path.includes("community") || path.includes("groups") || path.includes("group.html") ? "community" : path.includes("news") ? "news" : path.includes("chat") ? "chat" : path.includes("profile") ? "profile" : "home";
  const pageTitles = { home: "خانه", news: "اخبار", community: "کامیونیتی", chat: "چت", profile: "پروفایل", leaderboard: "امتیازات" };
  document.title = `${BRAND_NAME} | ${pageTitles[current] || ""}`;
  const items = [
    { key: "home", href: "index.html", label: "خانه" },
    { key: "news", href: "news.html", label: "اخبار" },
    { key: "community", href: "community.html", label: "کامیونیتی" },
    { key: "chat", href: "chat-v2.html", label: "چت" },
    { key: "profile", href: "profile.html", label: "پروفایل" },
    { key: "leaderboard", href: "leaderboard.html", label: "امتیازات" }
  ];
  function loadPolish() {
    if (document.querySelector('link[data-torex-polish]')) return;
    const link = document.createElement("link"); link.rel = "stylesheet"; link.href = "mobile.css"; link.dataset.torexPolish = "1"; document.head.appendChild(link);
  }
  function markup() {
    return `<header class="global-header" data-global-header><div class="global-header__inner"><a class="global-brand" href="index.html" aria-label="VEXORA CHAT"><span class="global-brand__text">${BRAND_NAME}</span></a><nav class="global-nav" aria-label="ناوبری اصلی">${items.map(item => `<a class="global-nav__link${item.key === current ? " is-active" : ""}" data-page="${item.key}" href="${item.href}">${item.label}</a>`).join("")}</nav><div class="global-actions"><a class="global-login" href="login.html">ورود</a><a class="global-user" href="profile.html" hidden></a></div></div></header>`;
  }
  const LEGACY_SELECTORS = [".mobile-nav", ".mobile-bottom-nav", ".mobile-chat-nav", ".community-mobile-nav", ".bottom-nav", ".home-header", ".site-header", ".profile-header", ".slim-nav", ".main-header"];
  function bindFeatureCards() {
    document.querySelectorAll(".feature-card").forEach(card => {
      const destination = card.querySelector("a[href]");
      if (!destination || card.dataset.cardNavigationBound === "true") return;
      card.dataset.cardNavigationBound = "true";
      card.tabIndex = 0;
      card.addEventListener("click", event => {
        if (event.target.closest("a,button,input,textarea,select")) return;
        location.href = destination.href;
      });
      card.addEventListener("keydown", event => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        location.href = destination.href;
      });
    });
  }
  function mount() {
    loadPolish();
    document.querySelectorAll("[data-global-header], .global-header").forEach(node => node.remove());
    LEGACY_SELECTORS.forEach(selector => document.querySelectorAll(selector).forEach(node => node.remove()));
    if (!document.body) return;
    document.body.insertAdjacentHTML("afterbegin", markup());
    document.body.classList.add("has-global-navigation");
    bindFeatureCards();
    const user = typeof window.getUser === "function" ? window.getUser() : null;
    const login = document.querySelector(".global-login"); const userLink = document.querySelector(".global-user");
    if (user && login && userLink) {
      login.hidden = true; userLink.hidden = false;
      userLink.textContent = String(user.name || "پروفایل");
      userLink.title = "پروفایل کاربر";
      userLink.insertAdjacentHTML("afterend", '<button type="button" class="global-logout">خروج</button>');
      document.querySelector(".global-logout").addEventListener("click", async () => {
        try { if (window.PERFASHINALRequest) await window.PERFASHINALRequest("/logout", { method: "POST" }); } catch (_) {}
        ["PERFASHINALUser", "PERFASHINALLoggedIn"].forEach(key => localStorage.removeItem(key)); location.href = "index.html";
      });
    }
  }
  window.TOREXToast = function (message, type = "info") {
    let box = document.querySelector(".torex-toast-container");
    if (!box) { box = document.createElement("div"); box.className = "torex-toast-container"; document.body.appendChild(box); }
    const toast = document.createElement("div"); toast.className = `torex-toast torex-toast--${type}`; toast.textContent = message; box.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add("is-visible"));
    setTimeout(() => { toast.classList.remove("is-visible"); setTimeout(() => toast.remove(), 220); }, 2600);
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount, { once: true }); else mount();
}());

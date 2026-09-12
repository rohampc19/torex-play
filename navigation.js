"use strict";
/* TOREX PLAY global navigation + safe micro-interactions. */
(function () {
  const BRAND_NAME = "TOREX PLAY";
  const path = location.pathname.toLowerCase();
  const current = path.includes("leaderboard") ? "leaderboard" : path.includes("news") ? "news" : path.includes("chat") ? "chat" : path.includes("profile") ? "profile" : "home";
  const items = [
    { key: "home", href: "index.html", label: "خانه", icon: "fa-house" },
    { key: "news", href: "news.html", label: "اخبار", icon: "fa-newspaper" },
    { key: "chat", href: "chat-v2.html", label: "چت", icon: "fa-comments" },
    { key: "profile", href: "profile.html", label: "پروفایل", icon: "fa-user" },
    { key: "leaderboard", href: "leaderboard.html", label: "امتیازات", icon: "fa-ranking-star" }
  ];
  function markup() {
    return `<header class="global-header" data-global-header><div class="global-header__inner"><a class="global-brand" href="index.html" aria-label="TOREX PLAY"><span class="global-brand__mark"><i class="fa-solid fa-gamepad"></i></span><span class="global-brand__text">${BRAND_NAME}</span></a><nav class="global-nav" aria-label="ناوبری اصلی">${items.map(item => `<a class="global-nav__link${item.key === current ? " is-active" : ""}" data-page="${item.key}" href="${item.href}"><i class="fa-solid ${item.icon}" aria-hidden="true"></i><span>${item.label}</span></a>`).join("")}</nav><div class="global-actions"><a class="global-login" href="login.html"><i class="fa-solid fa-arrow-right-to-bracket"></i><span>ورود</span></a><a class="global-user" href="profile.html" hidden></a></div></div></header>`;
  }
  const LEGACY_SELECTORS = [".mobile-nav", ".mobile-bottom-nav", ".mobile-chat-nav", ".community-mobile-nav", ".bottom-nav", ".home-header", ".site-header", ".profile-header", ".slim-nav", ".main-header"];
  function mount() {
    document.querySelectorAll("[data-global-header], .global-header").forEach(node => node.remove());
    LEGACY_SELECTORS.forEach(selector => document.querySelectorAll(selector).forEach(node => node.remove()));
    if (!document.body) return;
    document.body.insertAdjacentHTML("afterbegin", markup());
    document.body.classList.add("has-global-navigation");
    const user = typeof window.getUser === "function" ? window.getUser() : null;
    const login = document.querySelector(".global-login");
    const userLink = document.querySelector(".global-user");
    if (user && login && userLink) {
      login.hidden = true;
      userLink.hidden = false;
      userLink.innerHTML = `<i class="fa-solid fa-user"></i><span>${String(user.name || "پروفایل")}</span>`;
      userLink.title = "پروفایل کاربر";
      userLink.insertAdjacentHTML("afterend", '<button type="button" class="global-logout">خروج</button>');
      document.querySelector(".global-logout").addEventListener("click", async () => {
        try { if (window.PERFASHINALRequest) await window.PERFASHINALRequest("/logout", { method: "POST" }); } catch (_) {}
        ["PERFASHINALUser", "PERFASHINALToken", "PERFASHINALLoggedIn"].forEach(key => localStorage.removeItem(key));
        location.href = "index.html";
      });
    }
    document.querySelectorAll(".global-nav__link, .global-login, .global-user").forEach(link => {
      link.addEventListener("click", () => document.body.classList.add("page-leaving"), { passive: true });
    });
  }
  window.TOREXToast = function (message, type = "info") {
    let box = document.querySelector(".torex-toast-container");
    if (!box) { box = document.createElement("div"); box.className = "torex-toast-container"; document.body.appendChild(box); }
    const toast = document.createElement("div");
    toast.className = `torex-toast torex-toast--${type}`;
    toast.textContent = message;
    box.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add("is-visible"));
    setTimeout(() => { toast.classList.remove("is-visible"); setTimeout(() => toast.remove(), 220); }, 2600);
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount, { once: true }); else mount();
}());

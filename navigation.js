"use strict";
/* VEXORA CHAT — one shared navigation component for desktop and mobile. */
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
    if (!document.querySelector('link[data-vexora-polish]')) { const link = document.createElement("link"); link.rel = "stylesheet"; link.href = "mobile.css"; link.dataset.vexoraPolish = "1"; document.head.appendChild(link); }
    if (!document.querySelector('link[data-button-system]')) { const link = document.createElement("link"); link.rel = "stylesheet"; link.href = "button-system.css"; link.dataset.buttonSystem = "1"; document.head.appendChild(link); }
    if (!document.querySelector('link[data-vexora-premium]')) { const link = document.createElement("link"); link.rel = "stylesheet"; link.href = "premium-ui.css"; link.dataset.vexoraPremium = "1"; document.head.appendChild(link); }
  }
  function markup() {
    const icons = {
      home: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></svg>',
      news: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/><path d="M7 8h10M7 12h10M7 16h6"/></svg>',
      chat: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11.5a7.5 7.5 0 0 1-8 7.5 8.7 8.7 0 0 1-3.7-.8L4 20l1.1-3.5A7.2 7.2 0 0 1 4 11.5 7.5 7.5 0 0 1 12 4a7.5 7.5 0 0 1 8 7.5z"/></svg>',
      community: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="9" r="3"/><circle cx="17" cy="10" r="2.5"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0M15 16a4 4 0 0 1 5.5 3"/></svg>',
      profile: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/></svg>'
    };
    const links = items.map(item => `<a class="global-nav__link${item.key === current ? " is-active" : ""}" data-page="${item.key}" href="${item.href}"><span>${item.label}</span></a>`).join("");
    const mobileLinks = items.filter(item => ["news", "home", "chat", "community", "profile"].includes(item.key)).sort((a, b) => ["news", "home", "chat", "community", "profile"].indexOf(a.key) - ["news", "home", "chat", "community", "profile"].indexOf(b.key)).map(item => `<a class="mobile-nav__link${item.key === current ? " is-active" : ""}" data-page="${item.key}" href="${item.href}">${icons[item.key]}<span>${item.label}</span></a>`).join("");
    return `<header class="global-header" data-global-header><div class="global-header__inner"><a class="global-brand" href="index.html" aria-label="VEXORA CHAT"><span class="global-brand__text">${BRAND_NAME}</span></a><nav class="global-nav" aria-label="ناوبری اصلی">${links}</nav><div class="global-actions"><a class="global-login" href="login.html">ورود</a><a class="global-user" href="profile.html" hidden></a></div></div></header><nav class="mobile-nav" aria-label="ناوبری موبایل">${mobileLinks}</nav>`;
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
  window.VEXORAChatToast = function (message, type = "info") {
    let box = document.querySelector(".vexora-toast-container");
    if (!box) { box = document.createElement("div"); box.className = "vexora-toast-container"; document.body.appendChild(box); }
    const toast = document.createElement("div"); toast.className = `vexora-toast vexora-toast--${type}`; toast.textContent = message; box.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add("is-visible"));
    setTimeout(() => { toast.classList.remove("is-visible"); setTimeout(() => toast.remove(), 220); }, 2600);
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount, { once: true }); else mount();
}());

"use strict";

(function () {
  const api = window.PERFASHINALRequest;
  const grid = document.getElementById("newsGrid");
  const categories = document.getElementById("newsCategories");
  const featured = document.querySelector(".featured-news");
  if (!grid) return;

  let activeCategory = "all";
  const labels = { all: "همه", gaming: "Gaming", esports: "Esports", hardware: "Hardware Updates" };
  const localNews = () => typeof getLocalDemoNews === "function" ? getLocalDemoNews() : [];
  const articleHref = item => `news-detail.html?id=${encodeURIComponent(item.id)}`;
  function breakingRank(item) { return (item.isOfficial ? 1000000 : 0) + (item.isBreaking ? 500000 : 0) + Number(item.views || 0) * 10 + new Date(item.publishedAt || 0).getTime() / 1000000; }
  function renderBreaking(items) {
    const target = document.getElementById("breakingNewsGrid");
    if (!target) return;
    target.replaceChildren();
    items.slice().sort((a, b) => breakingRank(b) - breakingRank(a)).slice(0, 3).forEach(item => {
      const card = document.createElement("article"); card.className = "breaking-card"; card.dataset.articleId = item.id;
      card.innerHTML = `<div class="breaking-card__top"><span>${item.isBreaking ? "خبر فوری" : "پربازدید"}</span>${item.isOfficial ? "<b>✓ رسمی</b>" : ""}</div><h3></h3><p></p><a class="news-read-btn" href="${articleHref(item)}">ادامه اخبار ←</a>`;
      card.querySelector("h3").textContent = item.title; card.querySelector("p").textContent = item.excerpt || item.text.slice(0, 140); target.append(card);
    });
  }

  function formatDate(value) { return new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium" }).format(new Date(value)); }
  function card(item) {
    const article = document.createElement("article");
    article.className = "news-card";
    article.dataset.articleId = item.id;
    article.tabIndex = 0;
    article.innerHTML = `<div class="news-card-image">${item.image ? `<img src="${item.image}" alt="">` : "<i class=\"fa-solid fa-newspaper\"></i>"}</div><div class="news-card-content"><div class="news-card-top"><span class="card-category">${labels[item.category] || item.category || "خبر"}</span>${item.isOfficial ? "<span class=\"official-label\">✓ رسمی</span>" : ""}</div><h3></h3><p></p><button type="button" class="news-card-author" aria-label="مشاهده پروفایل نویسنده"><span></span><b></b><small></small></button><div class="card-footer"><span></span><span></span><span></span></div></div>`;
    article.querySelector("h3").textContent = item.title;
    article.querySelector("p").textContent = item.excerpt || item.text.slice(0, 140);
    const author = article.querySelector(".news-card-author");
    author.querySelector("span").textContent = (item.authorName || item.author || "A")[0];
    author.querySelector("b").textContent = item.authorName || item.author || "ادمین";
    author.querySelector("small").textContent = "@" + (item.author || "admin");
    author.addEventListener("click", event => { event.stopPropagation(); location.href = `profile.html?user=${encodeURIComponent(item.author || "admin")}`; });
    const footer = article.querySelectorAll(".card-footer span");
    footer[0].textContent = formatDate(item.publishedAt || item.createdAt);
    footer[1].textContent = item.game || labels[item.category] || "خبر";
    footer[2].textContent = `${Number(item.views || 0).toLocaleString("fa-IR")} بازدید`;
    const open = () => { location.href = articleHref(item); };
    article.addEventListener("click", open);
    article.addEventListener("keydown", event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); open(); } });
    return article;
  }
  function renderFeatured(item) {
    if (!featured || !item) return;
    const image = featured.querySelector(".featured-image");
    const title = featured.querySelector("h2");
    const text = featured.querySelector("p");
    const tag = featured.querySelector(".news-tag");
    const meta = featured.querySelector(".news-meta");
    const link = featured.querySelector(".news-read-btn");
    image.replaceChildren();
    if (item.image) { const img = new Image(); img.src = item.image; img.alt = item.title; image.append(img); }
    title.textContent = item.title; text.textContent = item.excerpt || item.text.slice(0, 180); tag.textContent = item.isOfficial ? "✓ رسماً توسط ادمین منتشر شده" : (labels[item.category] || "خبر ویژه");
    if (meta) meta.innerHTML = `<span>🎮 ${item.game || labels[item.category] || "خبر"}</span><span>🕐 ${formatDate(item.publishedAt || item.createdAt)}</span><span>👁️ ${Number(item.views || 0).toLocaleString("fa-IR")} بازدید</span>`;
    link.href = `news-detail.html?id=${encodeURIComponent(item.id)}`;
  }
  async function load() {
    grid.innerHTML = '<p class="empty-state">در حال دریافت اخبار...</p>';
    try {
      const query = new URLSearchParams({ category: activeCategory });
      let result;
      try { if (!api) throw new Error("local demo"); result = await api(`/news?${query}`); } catch (_) { const news = localNews().filter(item => activeCategory === "all" || item.category === activeCategory); result = { featured: news.slice().sort((a, b) => breakingRank(b) - breakingRank(a))[0], news }; }
      grid.replaceChildren();
      renderBreaking(result.news || []);
      renderFeatured(result.featured);
      if (!result.news.length) { grid.innerHTML = '<p class="empty-state">خبری با این مشخصات پیدا نشد.</p>'; return; }
      result.news.forEach(item => grid.append(card(item)));
    } catch (error) { grid.innerHTML = `<p class="error-state">${error.message} <button type="button">تلاش دوباره</button></p>`; grid.querySelector("button")?.addEventListener("click", load); }
  }
  function buildCategories() { if (!categories) return; Object.entries(labels).forEach(([key, label]) => { const button = document.createElement("button"); button.type = "button"; button.textContent = label; button.className = "category" + (key === activeCategory ? " active" : ""); button.setAttribute("role", "tab"); button.addEventListener("click", () => { activeCategory = key; categories.querySelectorAll("button").forEach(x => x.classList.toggle("active", x === button)); load(); }); categories.append(button); }); }
  buildCategories(); load();
}());
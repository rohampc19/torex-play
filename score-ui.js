"use strict";
document.addEventListener("DOMContentLoaded", async () => {
  const container = document.querySelector(".profile-container"), user = getUser?.();
  if (!container || !user?.username || document.querySelector(".score-grid")) return;
  try {
    const result = await PERFASHINALRequest(`/users/${encodeURIComponent(user.username)}`), profile = result.profile;
    const section = document.createElement("section"); section.className = "score-grid"; section.setAttribute("aria-label", "آمار بازیکن");
    section.innerHTML = `<article class="score-card"><span class="score-card__icon">✦</span><small>امتیاز بازیکن</small><strong>${Number(profile.score || 0).toLocaleString("fa-IR")}</strong></article><article class="score-card"><span class="score-card__icon">◎</span><small>دنبال‌کننده</small><strong>${Number(profile.followers || 0).toLocaleString("fa-IR")}</strong></article><article class="score-card"><span class="score-card__icon">◌</span><small>دنبال‌شونده</small><strong>${Number(profile.following || 0).toLocaleString("fa-IR")}</strong></article>`;
    const title = container.querySelector(".profile-page-title"); title?.after(section);
  } catch (_) { /* Profile editing remains usable if the public stats request is unavailable. */ }
});

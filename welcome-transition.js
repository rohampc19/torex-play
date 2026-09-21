"use strict";
(function () {
  const params = new URLSearchParams(location.search);
  if (params.get("welcome") !== "1" || sessionStorage.getItem("wexoraWelcomeShown") === "1") return;
  sessionStorage.setItem("wexoraWelcomeShown", "1");
  const node = document.createElement("section");
  node.className = "welcome-transition";
  node.setAttribute("role", "status");
  node.setAttribute("aria-label", "خوش‌آمدگویی");
  node.innerHTML = '<div class="welcome-transition__panel"><div class="welcome-transition__mark">TP</div><h1>WELCOME WEXORA CHAT</h1><p>خوش اومدی به دنیای WEXORA CHAT</p><div class="welcome-transition__steps"><div class="welcome-transition__step">🎮 اخبار بازی‌ها</div><div class="welcome-transition__step">💬 چت و ارتباط با گیمرها</div><div class="welcome-transition__step">🏆 پروفایل و جامعه گیمینگ</div><div class="welcome-transition__step">⚡ تعامل با محتوای محبوب</div></div><div class="welcome-transition__bar"></div></div>';
  document.body.append(node);
  const leave = () => { node.classList.add("is-leaving"); setTimeout(() => node.remove(), 280); };
  node.addEventListener("click", leave, { once: true });
  setTimeout(leave, 1550);
}());
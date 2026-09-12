"use strict";
/* Isolated local-development data. Replace this provider with the real API later. */
window.LOCAL_DEMO_DATA = {
  mode: "local-demo",
  enabled: true,
  users: [
    { id: "demo-admin", username: "admin", name: "ادمین", avatar: "A", followers: 245, following: 83, newsPublished: 17, newsLikes: 1800, level: 42, xp: 12800, score: 9999, favoriteGames: ["GTA VI", "Elden Ring", "Valorant"], role: "admin" },
    { id: "demo-nova", username: "nova_player", name: "Nova Player", avatar: "N", followers: 1820, following: 142, newsPublished: 26, newsLikes: 6400, level: 38, xp: 10900, score: 0, favoriteGames: ["Fortnite", "Minecraft"] },
    { id: "demo-rayan", username: "rayan_esports", name: "Rayan Esports", avatar: "R", followers: 1240, following: 96, newsPublished: 31, newsLikes: 5200, level: 35, xp: 9700, score: 0, favoriteGames: ["Valorant", "CS2"] },
    { id: "demo-aria", username: "aria_tech", name: "Aria Tech", avatar: "A", followers: 890, following: 210, newsPublished: 19, newsLikes: 3100, level: 29, xp: 7600, score: 0, favoriteGames: ["Cyberpunk 2077", "GTA VI"] }
  ],
  news: [
    { id: "demo-breaking-gta", title: "جزئیات تازه از یکی از موردانتظارترین بازی‌های سال", excerpt: "گزارش رسمی تازه، برنامه‌های آینده و اطلاعات مهم این هفته.", text: "گزارش رسمی تازه، برنامه‌های آینده و اطلاعات مهم این هفته را بررسی می‌کنیم. این مقاله تمام جزئیات منتشرشده را به‌صورت کامل و قابل مطالعه جمع‌آوری کرده است.", category: "gaming", game: "GTA VI", author: "admin", authorName: "ادمین", authorAvatar: "A", isOfficial: true, isBreaking: true, views: 12400, likes: 1800, comments: [], publishedAt: "2026-09-08T14:30:00.000Z", image: "", status: "published" },
    { id: "demo-esports", title: "تقویم رقابت‌های مهم ورزش‌های الکترونیک", excerpt: "مسابقات مهم این ماه را از دست ندهید.", text: "از رقابت‌های تیمی تا مسابقات انفرادی، رویدادهای مهم ماه را در دسته ورزش الکترونیک دنبال کنید.", category: "esports", game: "Valorant", author: "rayan_esports", authorName: "Rayan Esports", authorAvatar: "R", isOfficial: false, isBreaking: false, views: 8700, likes: 520, comments: [], publishedAt: "2026-09-07T10:00:00.000Z", image: "", status: "published" },
    { id: "demo-hardware", title: "راهنمای کوتاه ارتقای سیستم برای بازی روان‌تر", excerpt: "قبل از خرید قطعه جدید، این نکات را بررسی کنید.", text: "ارتقای سیستم همیشه به معنای خرید گران‌ترین قطعه نیست. ابتدا گلوگاه سیستم را پیدا کنید و سپس اولویت ارتقا را مشخص کنید.", category: "hardware", game: "PC", author: "aria_tech", authorName: "Aria Tech", authorAvatar: "A", isOfficial: false, isBreaking: false, views: 6100, likes: 310, comments: [], publishedAt: "2026-09-06T09:00:00.000Z", image: "", status: "published" },
    { id: "demo-normal", title: "چند پیشنهاد برای یک آخر هفته آرام", excerpt: "بازی‌هایی که ارزش تجربه دوباره دارند.", text: "چند پیشنهاد برای یک آخر هفته آرام و تجربه بازی‌های محبوب را در این مطلب می‌خوانید.", category: "gaming", game: "Minecraft", author: "nova_player", authorName: "Nova Player", authorAvatar: "N", isOfficial: false, isBreaking: false, views: 2200, likes: 180, comments: [], publishedAt: "2026-09-05T08:00:00.000Z", image: "", status: "published" }
  ]
};

window.getLocalDemoUsers = () => window.LOCAL_DEMO_DATA.users.map(user => ({ ...user }));
window.getLocalDemoNews = () => window.LOCAL_DEMO_DATA.news.map(item => ({ ...item, comments: [...(item.comments || [])] }));
window.getLocalLeaderboardData = () => window.LOCAL_DEMO_DATA.users.map(user => ({ ...user, score: user.score || Math.round(user.followers * 1.5 + user.newsPublished * 120 + user.newsLikes * 0.8 + user.xp + user.level * 90) })).sort((a, b) => b.score - a.score);

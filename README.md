# VEXORA CHAT PRO

نسخهٔ حرفه‌ای و قابل‌توسعهٔ VEXORA CHAT با React + Vite + Tailwind CSS + React Router در سمت کاربر و Node.js + Express + PostgreSQL + MongoDB + Socket.IO در سمت سرور.

## معماری

```text
project/
├── client/                    # React + Vite + Tailwind + Router + PWA
│   ├── src/
│   │   ├── components/       # کامپوننت‌های reusable
│   │   ├── pages/            # Home/Auth/Profile/News/Community/Chat/Groups/...
│   │   ├── layouts/
│   │   ├── hooks/
│   │   ├── services/         # REST API + Socket.IO
│   │   ├── context/           # Auth + Toast state
│   │   └── utils/
│   └── public/               # manifest, service worker, icons, offline
├── server/
│   └── src/
│       ├── config/
│       ├── controllers/
│       ├── middleware/
│       ├── models/            # Mongoose chat/presence/event models
│       ├── routes/
│       ├── services/
│       ├── sockets/
│       ├── utils/
│       ├── app.js
│       └── server.js
├── database/
│   ├── migrations/
│   │   ├── 001_init.sql
│   │   └── 002_social_features.sql
│   └── seed/
├── legacy-static/             # نسخهٔ HTML/CSS/JS قدیمی برای مرجع و rollback
├── .env.example
├── package.json
└── IMPLEMENTATION_PLAN.md
```

## پیش‌نیاز

Node.js 20.19+، PostgreSQL و MongoDB نیاز است. در محیط توسعه، Vite روی `5173` و API روی `4000` اجرا می‌شود.

## راه‌اندازی محلی

```bash
npm install
```

فایل `.env.example` را به `.env` کپی کن و برای `JWT_ACCESS_SECRET` و `JWT_REFRESH_SECRET` دو رشتهٔ تصادفی طولانی و متفاوت قرار بده.

PostgreSQL:

```bash
createdb vexora_chat
psql "$DATABASE_URL" -f database/migrations/001_init.sql
psql "$DATABASE_URL" -f database/migrations/002_social_features.sql
```

سپس MongoDB را اجرا کن و:

```bash
npm test
npm run dev
```

برای production:

```bash
npm run build
npm start
```

## ایجاد اولین admin

برای اینکه رمز admin داخل کد یا seed ذخیره نشود، با یک حساب معمولی ثبت‌نام کن، آن حساب را بعد از اجرای migration با یک عملیات دستی و کنترل‌شده تأیید و admin کن:

```sql
update users
set role='admin', status='approved'
where username='YOUR_USERNAME';
```

## قابلیت‌های پیاده‌سازی‌شده

احراز هویت با bcrypt و access/refresh JWT در HttpOnly cookie، logout واقعی و rotation نشست refresh؛ نقش‌های `user` / `moderator` / `admin`؛ تأیید/رد ثبت‌نام؛ فید اجتماعی با پست/کامنت/لایک؛ پروفایل و follow؛ خبر با دسته‌بندی/جستجو/featured، لایک خبر و لایک کامنت؛ دوستی و block/report؛ گروه عمومی/خصوصی با درخواست عضویت، دعوت، مدیریت اعضا، انتقال مالکیت، ترک و حذف گروه؛ چت خصوصی و گروهی با Socket.IO، typing، presence، delivered، seen و pagination؛ اعلان‌ها؛ leaderboard؛ پنل مدیریت کاربران/گزارش‌ها/اخبار/logها؛ PWA و offline fallback.

## امنیت

- password با bcrypt هش می‌شود و هیچ password در پاسخ عمومی API قرار نمی‌گیرد.
- access و refresh token در HttpOnly cookie هستند.
- CORS فقط برای origin تنظیم‌شده در `.env` اجازهٔ credentials می‌دهد.
- Helmet و rate limiting فعال هستند.
- ورودی‌های HTTP با Zod اعتبارسنجی می‌شوند.
- queryهای PostgreSQL پارامتری هستند.
- در React از `dangerouslySetInnerHTML` استفاده نشده است.
- برای پیام‌های Socket.IO طول و نرخ ارسال کنترل می‌شود.
- Service Worker پاسخ‌های `/api` و Socket.IO را cache نمی‌کند.

## تست

در محیط فعلی این موارد قابل اجرا و پاس شده‌اند:

- `node --check` برای تمام فایل‌های JavaScript سرور
- تست ساختاری پروژه
- بررسی importهای محلی frontend
- بررسی JSON فایل‌های package
- بررسی نبودن merge conflict marker
- بررسی نبودن `dangerouslySetInnerHTML`

`npm install` در محیط اجرای فعلی به دلیل timeout اتصال به registry npm کامل نشد؛ بنابراین `npm run build` مرورگر در این محیط اجرا نشده است. روی سیستم توسعه پس از `npm install`، `npm test` و `npm run build` را اجرا کن.

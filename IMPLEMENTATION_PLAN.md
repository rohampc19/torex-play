# VEXORA CHAT — برنامهٔ اجرایی و گزارش اجرا

## مرحله 1 — ممیزی پروژهٔ موجود
نسخهٔ موجود `TOREX-CHECK.zip` بررسی شد. ساختار قبلی یک پروژهٔ استاتیک HTML/CSS/JS بود و `package.json`، React، Vite، API ماژولار، migration و Mongo/Socket.IO نداشت. فایل‌های اصلی نسخهٔ قبلی داخل `legacy-static/` نگه داشته شدند.

## مرحله 2 — Bootstrap و معماری جدید
Monorepo سبک با workspaceهای `client` و `server`، فایل `.env.example`، اسکریپت‌های dev/build/test و ساختار پیشنهادی ایجاد شد.

## مرحله 3 — Frontend
React + Vite + Tailwind CSS + React Router، RTL فارسی، layout مشترک، responsive desktop/mobile navigation، reusable glass cards، loading/error/empty state، toast، Auth context و PWA ساخته شد.

## مرحله 4 — Backend
Express ماژولار با routes/controllers/services/models/middleware/config/utils، error handler مرکزی، Helmet، CORS محدود، rate limit و Zod ساخته شد.

## مرحله 5 — PostgreSQL
جداول users/sessions/follows/friend_requests/blocks/news/news_likes/comments/comment_likes/groups/group_members/notifications/reports و posts/post_likes/post_comments به همراه indexهای اصلی و migration اضافه شدند.

## مرحله 6 — Authentication و authorization
ثبت‌نام pending، login با username/email، bcrypt، access/refresh JWT، cookie امن، refresh rotation، logout و role guards برای user/moderator/admin پیاده‌سازی شد.

## مرحله 7 — Social/community
پروفایل عمومی/خصوصی، follow/unfollow، انتخاب حداقل 3 و حداکثر 5 بازی، فید community، پست، کامنت، لایک و حذف پست خود کاربر اضافه شد.

## مرحله 8 — News
فهرست اخبار، جستجو، category filter، featured، جزئیات، لایک خبر، کامنت و لایک کامنت اضافه شد. پنل moderator/admin برای create/update/delete/publish/unpublish/featured نیز تکمیل شد.

## مرحله 9 — Friends/groups
دوستی، درخواست دوستی، accept/reject، block، گزارش، گروه عمومی/خصوصی، درخواست عضویت، دعوت، approve/reject member، remove member، انتقال مالکیت، leave و delete group پیاده‌سازی شد.

## مرحله 10 — Real-time
Socket.IO برای private/group chat، online/offline، typing، delivered، seen، تاریخچهٔ paginated، reconnect و ذخیرهٔ پیام‌ها در MongoDB اضافه شد. برای spam یک rate gate سمت socket هم اضافه شد.

## مرحله 11 — Notifications/admin
اعلان follow، friend request/accept، account approval/rejection، comment، group membership، group invite و پیام آفلاین اضافه شد. پنل مدیریت آمار، کاربران، ثبت‌نام‌های pending، block/unblock، reports، news و Mongo event logs را نمایش می‌دهد.

## مرحله 12 — PWA
`manifest.webmanifest`، service worker، offline fallback، iconهای 192/512 و theme color اضافه شد. پاسخ‌های API و Socket.IO عمداً cache نمی‌شوند.

## مرحله 13 — QA
- syntax تمام JSهای server: PASS
- JSON package files: PASS
- frontend local import references: PASS
- ساختار و migration tests: PASS، 19/19
- merge conflict markers: NONE
- `dangerouslySetInnerHTML`: NONE
- npm dependency installation: در محیط اجرا به علت timeout registry npm شکست خورد، بنابراین browser build واقعی در همین محیط قابل اجرا نبود.

-- Optional development seed. Create an admin with your own secure password using a separate bootstrap script.
insert into news(title,excerpt,body,category,published) values
('به VEXORA CHAT خوش آمدی','مرکز خبر و جامعهٔ گیمرها در یک جا.','VEXORA CHAT آمادهٔ توسعهٔ جامعهٔ گیمرها، خبرها و چت لحظه‌ای است.','Gaming',true) on conflict do nothing;

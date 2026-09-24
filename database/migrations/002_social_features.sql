-- VEXORA CHAT v2 social features
alter table users add column if not exists avatar_url text;
alter table users add column if not exists favorite_games text[] not null default '{}';
alter table news add column if not exists featured boolean not null default false;

create table if not exists posts(
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references users(id) on delete cascade,
  body varchar(2000) not null,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_posts_created on posts(created_at desc);
create index if not exists idx_posts_author_created on posts(author_id,created_at desc);

create table if not exists post_likes(
  post_id uuid not null references posts(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(post_id,user_id)
);
create index if not exists idx_post_likes_post on post_likes(post_id);

create table if not exists post_comments(
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  text varchar(500) not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_post_comments_post_created on post_comments(post_id,created_at desc);

create table if not exists comment_likes(
  comment_id uuid not null references comments(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(comment_id,user_id)
);
create index if not exists idx_comment_likes_comment on comment_likes(comment_id);

create index if not exists idx_users_score_followers on users(score desc,level desc);
create index if not exists idx_news_featured_created on news(featured,created_at desc);

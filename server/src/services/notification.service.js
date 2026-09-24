import {pool} from '../config/db.js';

export async function list(userId){
  const r=await pool.query('select id,type,title,body,read_at,created_at from notifications where user_id=$1 order by created_at desc limit 50',[userId]);
  return r.rows.map(x=>({...x,readAt:x.read_at,createdAt:x.created_at}));
}

export async function unreadCount(userId){
  const r=await pool.query('select count(*)::int n from notifications where user_id=$1 and read_at is null',[userId]);
  return Number(r.rows[0].n);
}

export async function create(userId,{type,title,body}){
  if(!userId)return;
  await pool.query('insert into notifications(user_id,type,title,body) values($1,$2,$3,$4)',[userId,type,title,body]);
}

export async function createMany(rows){
  for(const row of rows) await create(row.userId,row);
}

export async function markRead(userId,id){
  await pool.query('update notifications set read_at=coalesce(read_at,now()) where id=$1 and user_id=$2',[id,userId]);
  return {ok:true};
}

export async function markAll(userId){
  await pool.query('update notifications set read_at=now() where user_id=$1 and read_at is null',[userId]);
  return {ok:true};
}

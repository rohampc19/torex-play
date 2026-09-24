import {pool} from '../config/db.js';
import {HttpError} from '../utils/httpError.js';
import {create as notify} from './notification.service.js';

export async function friends(userId){
  const r=await pool.query(`select u.id,u.username,u.display_name,u.avatar_url
    from users u join friend_requests f on ((f.sender_id=$1 and f.receiver_id=u.id) or (f.receiver_id=$1 and f.sender_id=u.id))
    and f.status='accepted' where u.status='approved' order by u.display_name`,[userId]);
  return r.rows.map(x=>({id:x.id,username:x.username,displayName:x.display_name,avatarUrl:x.avatar_url}));
}

export async function incoming(userId){
  const r=await pool.query(`select f.id,f.created_at,u.username,u.display_name,u.avatar_url
    from friend_requests f join users u on u.id=f.sender_id where f.receiver_id=$1 and f.status='pending' order by f.created_at desc`,[userId]);
  return r.rows.map(x=>({id:x.id,username:x.username,displayName:x.display_name,avatarUrl:x.avatar_url,createdAt:x.created_at}));
}

export async function outgoing(userId){
  const r=await pool.query(`select f.id,f.created_at,u.username,u.display_name from friend_requests f join users u on u.id=f.receiver_id where f.sender_id=$1 and f.status='pending' order by f.created_at desc`,[userId]);
  return r.rows.map(x=>({id:x.id,username:x.username,displayName:x.display_name,createdAt:x.created_at}));
}

export async function request(userId,username){
  const u=await pool.query("select id,username,display_name from users where username=$1 and status='approved'",[username.toLowerCase()]);
  if(!u.rowCount)throw new HttpError(404,'کاربر پیدا نشد.');
  if(String(u.rows[0].id)===String(userId))throw new HttpError(400,'نمی‌توانی خودت را دوست خودت اضافه کنی.');
  const already=await pool.query(`select status from friend_requests where sender_id=$1 and receiver_id=$2 or sender_id=$2 and receiver_id=$1 order by created_at desc limit 1`,[userId,u.rows[0].id]);
  if(already.rowCount&&already.rows[0].status==='accepted')throw new HttpError(409,'این کاربر همین حالا دوست توست.');
  await pool.query(`insert into friend_requests(sender_id,receiver_id) values($1,$2)
    on conflict(sender_id,receiver_id) do update set status='pending',updated_at=now()`,[userId,u.rows[0].id]);
  await notify(u.rows[0].id,{type:'friend_request',title:'درخواست دوستی جدید',body:'یک گیمر برایت درخواست دوستی فرستاده است.'});
  return {ok:true};
}

export async function decide(userId,id,status){
  if(!['accepted','rejected'].includes(status))throw new HttpError(400,'عملیات نامعتبر است.');
  const r=await pool.query("update friend_requests set status=$1,updated_at=now() where id=$2 and receiver_id=$3 and status='pending' returning sender_id,receiver_id",[status,id,userId]);
  if(!r.rowCount)throw new HttpError(404,'درخواست دوستی پیدا نشد.');
  if(status==='accepted')await notify(r.rows[0].sender_id,{type:'friend_accepted',title:'درخواست دوستی تأیید شد',body:'درخواست دوستی تو تأیید شد.'});
  return {ok:true};
}

export async function block(userId,username){
  const u=await pool.query('select id from users where username=$1',[username.toLowerCase()]);
  if(!u.rowCount)throw new HttpError(404,'کاربر پیدا نشد.');
  if(String(u.rows[0].id)===String(userId))throw new HttpError(400,'نمی‌توانی خودت را مسدود کنی.');
  await pool.query('insert into blocks(blocker_id,blocked_id) values($1,$2) on conflict do nothing',[userId,u.rows[0].id]);
  await pool.query(`update friend_requests set status='rejected',updated_at=now() where (sender_id=$1 and receiver_id=$2) or (sender_id=$2 and receiver_id=$1)`,[userId,u.rows[0].id]);
  return {ok:true};
}

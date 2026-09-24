import {pool} from '../config/db.js';
import {HttpError} from '../utils/httpError.js';
import {create as notify} from './notification.service.js';

const map=(x)=>({id:x.id,name:x.name,description:x.description,isPrivate:x.is_private,memberCount:Number(x.member_count||0),ownerId:x.owner_id});

async function getGroup(id){
  const r=await pool.query('select id,name,description,is_private,owner_id from groups where id=$1',[id]);
  if(!r.rowCount)throw new HttpError(404,'گروه پیدا نشد.');
  return r.rows[0];
}

async function manager(userId,groupId){
  const r=await pool.query("select g.owner_id,gm.role from groups g left join group_members gm on gm.group_id=g.id and gm.user_id=$1 and gm.status='approved' where g.id=$2",[userId,groupId]);
  if(!r.rowCount)throw new HttpError(404,'گروه پیدا نشد.');
  if(String(r.rows[0].owner_id)!==String(userId)&&!['owner','moderator'].includes(r.rows[0].role))throw new HttpError(403,'دسترسی مدیریت گروه را نداری.');
  return r.rows[0];
}

export async function list(){
  const r=await pool.query(`select g.id,g.name,g.description,g.is_private,g.owner_id,count(gm.user_id)::int member_count
    from groups g left join group_members gm on gm.group_id=g.id and gm.status='approved'
    group by g.id order by g.created_at desc`);
  return r.rows.map(map);
}

export async function create(userId,v){
  const client=await pool.connect();
  try{
    await client.query('begin');
    const r=await client.query('insert into groups(name,description,is_private,owner_id) values($1,$2,$3,$4) returning id,name,description,is_private,owner_id',[v.name.trim(),v.description?.trim()||'',v.isPrivate,userId]);
    await client.query("insert into group_members(group_id,user_id,status,role) values($1,$2,'approved','owner')",[r.rows[0].id,userId]);
    await client.query('commit');
    return {...r.rows[0],isPrivate:r.rows[0].is_private,ownerId:r.rows[0].owner_id};
  }catch(e){await client.query('rollback');throw e}finally{client.release()}
}

export async function getDetails(userId,id){
  const g=await getGroup(id);
  const my=await pool.query('select status,role from group_members where group_id=$1 and user_id=$2',[id,userId]);
  const manager=String(g.owner_id)===String(userId)||['owner','moderator'].includes(my.rows[0]?.role);
  const members=await pool.query(`select u.id,u.username,u.display_name,u.avatar_url,gm.role,gm.status,gm.joined_at
      from group_members gm join users u on u.id=gm.user_id where gm.group_id=$1 ${manager?'':'and gm.status=\'approved\''} order by gm.status desc,gm.joined_at asc`,[id]);
  return {group:{...g,isPrivate:g.is_private,ownerId:g.owner_id},members:members.rows.map(x=>({id:x.id,username:x.username,displayName:x.display_name,avatarUrl:x.avatar_url,role:x.role,status:x.status,joinedAt:x.joined_at})),membership:my.rows[0]||null};
}

export async function join(userId,id){
  const g=await getGroup(id);
  const status=g.is_private?'pending':'approved';
  await pool.query(`insert into group_members(group_id,user_id,status,role) values($1,$2,$3,'member')
    on conflict(group_id,user_id) do update set status=excluded.status`,[id,userId,status]);
  if(status==='pending') await notify(g.owner_id,{type:'group_join_request',title:'درخواست عضویت گروه',body:'یک کاربر برای عضویت در گروه شما درخواست داده است.'});
  return {status};
}

export async function approve(userId,groupId,targetId,approved){
  await manager(userId,groupId);
  const r=await pool.query("update group_members set status=$1 where group_id=$2 and user_id=$3 and status='pending' returning user_id",[approved?'approved':'rejected',groupId,targetId]);
  if(!r.rowCount)throw new HttpError(404,'درخواست عضویت پیدا نشد.');
  await notify(targetId,{type:'group_membership',title:approved?'عضویت تأیید شد':'درخواست عضویت رد شد',body:approved?'عضویت تو در گروه تأیید شد.':'درخواست عضویت تو در گروه رد شد.'});
  return {ok:true};
}

export async function remove(userId,groupId,targetId){
  const g=await getGroup(groupId); await manager(userId,groupId);
  if(String(g.owner_id)===String(targetId))throw new HttpError(400,'مالک گروه را نمی‌توان حذف کرد.');
  await pool.query('delete from group_members where group_id=$1 and user_id=$2',[groupId,targetId]);
  await notify(targetId,{type:'group_removed',title:'از گروه حذف شدی',body:'عضویت تو از یک گروه حذف شد.'});
  return {ok:true};
}

export async function promoteOwner(userId,groupId,targetId){
  const g=await getGroup(groupId);
  if(String(g.owner_id)!==String(userId))throw new HttpError(403,'فقط مالک گروه می‌تواند مالک جدید تعیین کند.');
  const target=await pool.query("select status from group_members where group_id=$1 and user_id=$2",[groupId,targetId]);
  if(!target.rowCount||target.rows[0].status!=='approved')throw new HttpError(400,'کاربر عضو تأییدشدهٔ گروه نیست.');
  const client=await pool.connect();
  try{
    await client.query('begin');
    await client.query("update groups set owner_id=$1 where id=$2",[targetId,groupId]);
    await client.query("update group_members set role='member' where group_id=$1 and user_id=$2",[groupId,userId]);
    await client.query("update group_members set role='owner' where group_id=$1 and user_id=$2",[groupId,targetId]);
    await client.query('commit');
  }catch(e){await client.query('rollback');throw e}finally{client.release()}
  await notify(targetId,{type:'group_owner',title:'مدیر گروه شدی',body:'مدیریت یک گروه به تو منتقل شد.'});
  return {ok:true};
}

export async function invite(userId,groupId,username){
  await manager(userId,groupId);
  const g=await getGroup(groupId);
  const target=await pool.query("select id from users where username=$1 and status='approved'",[String(username||'').toLowerCase()]);
  if(!target.rowCount)throw new HttpError(404,'کاربر پیدا نشد.');
  if(String(target.rows[0].id)===String(userId))throw new HttpError(400,'نمی‌توانی خودت را دعوت کنی.');
  await pool.query(`insert into group_members(group_id,user_id,status,role) values($1,$2,'approved','member')
    on conflict(group_id,user_id) do update set status='approved',role=case when group_members.role='owner' then group_members.role else 'member' end`,[groupId,target.rows[0].id]);
  await notify(target.rows[0].id,{type:'group_invite',title:'دعوت به گروه',body:`به گروه «${g.name}» دعوت شدی.`});
  return {ok:true};
}

export async function leave(userId,groupId){
  const g=await getGroup(groupId);
  if(String(g.owner_id)===String(userId))throw new HttpError(400,'مالک گروه ابتدا باید مدیریت را منتقل کند.');
  await pool.query('delete from group_members where group_id=$1 and user_id=$2',[groupId,userId]);
  return {ok:true};
}

export async function destroy(userId,groupId){
  const g=await getGroup(groupId); if(String(g.owner_id)!==String(userId))throw new HttpError(403,'فقط مالک گروه می‌تواند گروه را حذف کند.');
  await pool.query('delete from groups where id=$1',[groupId]); return {ok:true};
}

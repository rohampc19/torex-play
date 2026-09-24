import {pool} from '../config/db.js';
import {create as notify} from '../services/notification.service.js';

export const stats=async(_req,res)=>{const [u,p,g,r,n]=await Promise.all([
  pool.query('select count(*) n from users'),pool.query("select count(*) n from users where status='pending'"),pool.query('select count(*) n from groups'),pool.query("select count(*) n from reports where status='open'"),pool.query('select count(*) n from news')
]);res.json({stats:{users:Number(u.rows[0].n),pending:Number(p.rows[0].n),groups:Number(g.rows[0].n),openReports:Number(r.rows[0].n),news:Number(n.rows[0].n)}})};

export const pending=async(_req,res)=>{const r=await pool.query("select id,username,display_name,email,created_at from users where status='pending' order by created_at asc");res.json({users:r.rows.map(x=>({id:x.id,username:x.username,displayName:x.display_name,email:x.email,createdAt:x.created_at}))})};

export const users=async(_req,res)=>{const r=await pool.query("select id,username,display_name,email,role,status,score,level,created_at from users order by created_at desc limit 200");res.json({users:r.rows.map(x=>({id:x.id,username:x.username,displayName:x.display_name,email:x.email,role:x.role,status:x.status,score:Number(x.score),level:Number(x.level),createdAt:x.created_at}))})};

export const approve=async(req,res)=>{
  if(!['approve','reject'].includes(req.params.action))return res.status(400).json({message:'عملیات نامعتبر است.'});
  const status=req.params.action==='approve'?'approved':'rejected';
  const r=await pool.query('update users set status=$1 where id=$2 returning id',[status,req.params.id]);
  if(!r.rowCount)return res.status(404).json({message:'کاربر پیدا نشد.'});
  await notify(req.params.id,{type:'account',title:status==='approved'?'حساب تأیید شد':'درخواست ثبت‌نام رد شد',body:status==='approved'?'حساب تو توسط مدیر تأیید شد.':'درخواست ثبت‌نام تو تأیید نشد.'});
  res.json({ok:true,status});
};

export const block=async(req,res)=>{const r=await pool.query("update users set status='blocked' where id=$1 returning id",[req.params.id]);if(!r.rowCount)return res.status(404).json({message:'کاربر پیدا نشد.'});res.json({ok:true})};
export const unblock=async(req,res)=>{const r=await pool.query("update users set status='approved' where id=$1 returning id",[req.params.id]);if(!r.rowCount)return res.status(404).json({message:'کاربر پیدا نشد.'});res.json({ok:true})};
export const reports=async(_req,res)=>{const r=await pool.query(`select rp.id,rp.kind,rp.target_id,rp.reason,rp.status,rp.created_at,u.username reporter from reports rp join users u on u.id=rp.reporter_id where rp.status='open' order by rp.created_at desc limit 100`);res.json({reports:r.rows})};
export const closeReport=async(req,res)=>{const r=await pool.query("update reports set status='closed',resolved_at=now() where id=$1 returning id",[req.params.id]);if(!r.rowCount)return res.status(404).json({message:'گزارش پیدا نشد.'});res.json({ok:true})};

export const logs=async(_req,res)=>{const {ChatEvent}=await import('../models/event.js');const r=await ChatEvent.find({}).sort({createdAt:-1}).limit(100).lean().catch(()=>[]);res.json({logs:r.map(x=>({id:String(x._id),type:x.type,meta:x.meta||{},createdAt:x.createdAt}))})};

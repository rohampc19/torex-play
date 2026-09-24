import {Router} from 'express';
import {pool} from '../config/db.js';
import {Presence} from '../models/presence.js';
const r=Router();
r.get('/',async(_req,res,next)=>{try{
  const [stats,news,presence]=await Promise.all([
    pool.query("select (select count(*) from users where status='approved')::int users,(select count(*) from groups)::int groups,(select count(*) from news where published=true)::int news"),
    pool.query('select id,title,excerpt,category,featured,created_at from news where published=true order by featured desc,created_at desc limit 6'),
    Presence.find({online:true}).sort({lastSeen:-1}).limit(12).select('username lastSeen -_id').lean().catch(()=>[])
  ]);
  const s=stats.rows[0];res.json({stats:{users:Number(s.users),groups:Number(s.groups),news:Number(s.news)},latestNews:news.rows.map(x=>({...x,featured:!!x.featured,createdAt:x.created_at})),onlineUsers:presence.map(x=>({username:x.username,lastSeen:x.lastSeen}))});
}catch(e){next(e)}});
export default r;

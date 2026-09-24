import {Router} from 'express';
import {pool} from '../config/db.js';
import {optionalAuth} from '../middleware/auth.js';
const r=Router();
r.get('/',optionalAuth,async(req,res,next)=>{try{
  const q=await pool.query(`select u.id,u.username,u.display_name,u.score,u.level,
    coalesce((select count(*) from follows f where f.following_id=u.id),0)::int followers_count,
    (coalesce((select count(*) from posts p where p.author_id=u.id),0)+coalesce((select count(*) from comments c where c.user_id=u.id),0)+coalesce((select count(*) from friend_requests fr where (fr.sender_id=u.id or fr.receiver_id=u.id) and fr.status='accepted'),0))::int activity
    from users u where u.status='approved' order by u.score desc,activity desc,followers_count desc limit 50`);
  const items=q.rows.map((x,i)=>({rank:i+1,username:x.username,displayName:x.display_name,score:Number(x.score),level:Number(x.level),followersCount:Number(x.followers_count),activity:Number(x.activity)}));
  let myRank=null;if(req.user){const mine=await pool.query(`select rank from (select id,dense_rank() over(order by score desc) rank from users where status='approved') x where id=$1`,[req.user.sub]);myRank=mine.rows[0]?.rank?Number(mine.rows[0].rank):null}
  res.json({items,myRank});
}catch(e){next(e)}});
export default r;

import {pool} from '../config/db.js';
import {HttpError} from '../utils/httpError.js';

export async function listAll(){
  const r=await pool.query(`select n.id,n.title,n.excerpt,n.body,n.category,n.featured,n.published,n.created_at,u.username author
    from news n left join users u on u.id=n.author_id order by n.created_at desc limit 200`);
  return r.rows.map(x=>({...x,featured:!!x.featured,published:!!x.published,createdAt:x.created_at}));
}
export async function create(v,authorId){const r=await pool.query('insert into news(title,excerpt,body,category,author_id,published,featured) values($1,$2,$3,$4,$5,$6,$7) returning id,title,excerpt,body,category,published,featured,created_at',[v.title,v.excerpt,v.body,v.category,authorId,v.published!==false,!!v.featured]);return {...r.rows[0],createdAt:r.rows[0].created_at};}
export async function update(id,v){const r=await pool.query('update news set title=coalesce($1,title),excerpt=coalesce($2,excerpt),body=coalesce($3,body),category=coalesce($4,category),featured=coalesce($5,featured),published=coalesce($6,published) where id=$7 returning id,title,excerpt,body,category,published,featured',[v.title??null,v.excerpt??null,v.body??null,v.category??null,v.featured??null,v.published??null,id]);if(!r.rowCount)throw new HttpError(404,'خبر پیدا نشد.');return r.rows[0];}
export async function remove(id){const r=await pool.query('delete from news where id=$1',[id]);if(!r.rowCount)throw new HttpError(404,'خبر پیدا نشد.');return {ok:true};}

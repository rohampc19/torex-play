import * as s from '../services/news.service.js';
export const list=async(req,res)=>res.json({items:await s.listNews({q:String(req.query.q||''),category:String(req.query.category||''),featured:req.query.featured==='true'})});
export const get=async(req,res)=>res.json({news:await s.getNews(req.params.id,req.user?.sub||null)});
export const like=async(req,res)=>res.json(await s.likeNews(req.user.sub,req.params.id));
export const comment=async(req,res)=>res.status(201).json({news:await s.addComment(req.user.sub,req.params.id,req.body.text)});
export const likeComment=async(req,res)=>res.json(await s.likeComment(req.user.sub,req.params.id,req.params.commentId));

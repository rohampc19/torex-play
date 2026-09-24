import * as s from '../services/community.service.js';
export const list=async(req,res)=>res.json(await s.listPosts(req.user?.sub,{page:req.query.page,limit:req.query.limit}));
export const create=async(req,res)=>res.status(201).json({post:await s.createPost(req.user.sub,req.body)});
export const like=async(req,res)=>res.json(await s.likePost(req.user.sub,req.params.id));
export const comments=async(req,res)=>res.json({comments:await s.comments(req.params.id)});
export const comment=async(req,res)=>res.status(201).json({comments:await s.addComment(req.user.sub,req.params.id,req.body.text)});
export const remove=async(req,res)=>res.json(await s.deletePost(req.user.sub,req.params.id));

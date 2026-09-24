import * as s from '../services/user.service.js';
export const profile=async(req,res)=>res.json({user:await s.getUser(req.params.username,req.user?.sub||null)});
export const update=async(req,res)=>res.json({user:await s.updateMe(req.user.sub,req.body)});
export const follow=async(req,res)=>res.json(await s.toggleFollow(req.user.sub,req.params.id));

import * as s from '../services/notification.service.js';
export const list=async(req,res)=>res.json({items:await s.list(req.user.sub),unreadCount:await s.unreadCount(req.user.sub)});
export const read=async(req,res)=>res.json(await s.markRead(req.user.sub,req.params.id));
export const readAll=async(req,res)=>res.json(await s.markAll(req.user.sub));

import * as s from '../services/friend.service.js';
export const list=async(req,res)=>res.json({friends:await s.friends(req.user.sub),incoming:await s.incoming(req.user.sub),outgoing:await s.outgoing(req.user.sub)});
export const request=async(req,res)=>res.status(201).json(await s.request(req.user.sub,req.params.username));
export const decide=async(req,res)=>res.json(await s.decide(req.user.sub,req.params.id,req.params.action==='accept'?'accepted':'rejected'));
export const block=async(req,res)=>res.json(await s.block(req.user.sub,req.params.username));

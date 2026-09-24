import * as s from '../services/news-admin.service.js';
export const list=async(_req,res)=>res.json({items:await s.listAll()});
export const create=async(req,res)=>res.status(201).json({news:await s.create(req.body,req.user.sub)});
export const update=async(req,res)=>res.json({news:await s.update(req.params.id,req.body)});
export const remove=async(req,res)=>res.json(await s.remove(req.params.id));

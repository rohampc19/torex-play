import {HttpError} from '../utils/httpError.js';
import {verifyAccess} from '../utils/auth.js';

function tokenFrom(req){return req.cookies?.accessToken||req.headers.authorization?.replace(/^Bearer\s+/,'');}
export function optionalAuth(req,_res,next){try{const token=tokenFrom(req);if(token)req.user=verifyAccess(token)}catch{}next()}
export function requireAuth(req,_res,next){try{const token=tokenFrom(req);if(!token)throw new Error();req.user=verifyAccess(token);next()}catch{next(new HttpError(401,'نشست معتبر نیست.'))}}
export const requireRole=(...roles)=>(req,_res,next)=>{if(!req.user||!roles.includes(req.user.role))return next(new HttpError(403,'دسترسی مجاز نیست.'));next()};

import {io} from 'socket.io-client';
export const createSocket=()=>io('/',{
  path:'/socket.io',
  withCredentials:true,
  autoConnect:true,
  reconnection:true,
  reconnectionAttempts:Infinity,
  reconnectionDelay:700,
  reconnectionDelayMax:5000,
  timeout:10000,
});

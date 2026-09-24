import {createContext,useContext,useEffect,useState} from 'react';
import {authApi} from '../services/api';
const C=createContext(null);
export function AuthProvider({children}){const [user,setUser]=useState(null),[loading,setLoading]=useState(true);useEffect(()=>{authApi.me().then(r=>setUser(r.user)).catch(()=>{}).finally(()=>setLoading(false))},[]);const login=async b=>{const r=await authApi.login(b);setUser(r.user);return r},register=async b=>authApi.register(b),logout=async()=>{await authApi.logout().catch(()=>{});setUser(null)};return <C.Provider value={{user,loading,login,register,logout,setUser}}>{children}</C.Provider>}
export const useAuth=()=>useContext(C);

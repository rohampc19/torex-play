import {createContext,useContext} from 'react';
import toast from 'react-hot-toast';
const C=createContext({success:()=>{},error:()=>{},info:()=>{}});
export function ToastProvider({children}){const value={success:(m)=>toast.success(m),error:(m)=>toast.error(m),info:(m)=>toast(m)};return <C.Provider value={value}>{children}</C.Provider>}
export const useToast=()=>useContext(C);

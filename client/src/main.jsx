import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import './styles.css';

if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(()=>{}));

createRoot(document.getElementById('root')).render(<React.StrictMode><BrowserRouter><AuthProvider><ToastProvider><App/><Toaster position="top-center" toastOptions={{style:{background:'#0b1525',color:'#fff',border:'1px solid rgba(255,255,255,.1)'}}}/></ToastProvider></AuthProvider></BrowserRouter></React.StrictMode>);

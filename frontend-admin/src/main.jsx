import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import axios from 'axios'

// 1. Interceptor de IDA (Pone el Gafete)
axios.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 2. 🚨 INTERCEPTOR DE REGRESO REFINADO (Detecta si el Guardia nos rechazó)
axios.interceptors.response.use(
  (response) => response, // Si todo sale bien, dejamos pasar los datos
  (error) => {
    // Obtenemos la URL a la que se intentó hacer la petición
    const originalRequestUrl = error.config ? error.config.url : '';

    // 🛑 LA MAGIA AQUÍ: Si el error viene de intentar hacer Login, 
    // lo dejamos pasar para que el componente Login.jsx muestre su mensaje normal.
    if (originalRequestUrl.includes('/login')) {
      return Promise.reject(error);
    }

    // Si el servidor nos contesta con Error 401 o 403 (Problemas de seguridad)
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      
      // Creamos una pantalla negra estética que se sobrepone a todo
      const lockdownScreen = document.createElement('div');
      lockdownScreen.innerHTML = `
        <div style="position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.95); z-index:99999; display:flex; justify-content:center; align-items:center; color:white; font-family:sans-serif; flex-direction:column; text-align:center;">
            <style>
                @keyframes pulse { from { transform: scale(1); opacity: 1; } to { transform: scale(1.1); opacity: 0.8; } }
            </style>
            <span style="font-size:80px; margin-bottom:20px; animation: pulse 1s infinite alternate;">🕵️‍♂️</span>
            <h1 style="color:#ff4757; font-size:50px; margin:0; letter-spacing: 2px;">¡TE HEMOS PILLADO!</h1>
            <p style="font-size:22px; color:#f1f2f6; max-width: 600px;">Hemos detectado una anomalía grave en tu firma de seguridad.</p>
            <p style="font-size:16px; color:#a4b0be; margin-top:20px;">Cerrando sesión por motivos de seguridad...</p>
        </div>
      `;
      document.body.appendChild(lockdownScreen);
      
      // Esperamos 3.5 segundos de suspenso, borramos la evidencia y lo botamos
      setTimeout(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        window.location.href = '/'; 
      }, 3500);
    }
    return Promise.reject(error);
  }
);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

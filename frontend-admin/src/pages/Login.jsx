import { useState } from 'react';
import axios from 'axios';
import './Login.css';

const Login = ({ onLoginSuccess }) => {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const API_URL = import.meta.env.VITE_API_URL;
      const res = await axios.post(`${API_URL}/api/auth/login`, { usuario, password });

      if (res.data.success) {
        // Guardamos el Gafete (Token) y los datos del usuario en el navegador
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('usuario', JSON.stringify(res.data.usuario));
        onLoginSuccess(); // Le avisamos a App.jsx que ya entramos
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Credenciales incorrectas';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-bg">
      {/* Burbujas decorativas de fondo */}
      <div className="login-bubble bubble-1" />
      <div className="login-bubble bubble-2" />
      <div className="login-bubble bubble-3" />

      <div className="login-card">
        <div className="login-logo">🍕</div>
        <h1 className="login-title">Pizzas Laurita</h1>
        <p className="login-subtitle">Sistema de Gestión</p>

        <form onSubmit={handleLogin} className="login-form">
          {error && (
            <div className="login-error">
              <span>⚠️</span> {error}
            </div>
          )}

          <div className="login-field">
            <label htmlFor="login-usuario">Usuario</label>
            <input
              id="login-usuario"
              type="text"
              placeholder="ej. admin"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              disabled={loading}
              required
              autoComplete="username"
            />
          </div>

          <div className="login-field">
            <label htmlFor="login-password">Contraseña</label>
            <input
              id="login-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? (
              <span className="login-spinner">⏳ Verificando...</span>
            ) : (
              '🔐 Entrar al Sistema'
            )}
          </button>
        </form>

        <p className="login-footer">SIGP Admin · v2.0</p>
      </div>

      {/* 🍕 PANTALLA DE CARGA CINEMÁTICA — aparece encima de todo al autenticar */}
      {loading && (
        <div className="loading-overlay">
          <div className="pizza-cargando">🍕</div>
          <h2 className="loading-titulo">Conectando con la cocina...</h2>
          <p className="texto-parpadeante">
            Despertando los hornos en la nube, un momento por favor.
          </p>
          <div className="loading-bar-container">
            <div className="loading-bar-fill" />
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;

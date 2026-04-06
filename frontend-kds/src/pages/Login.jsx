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
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('usuario', JSON.stringify(res.data.usuario));
        onLoginSuccess();
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Credenciales incorrectas';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="kds-login-bg">
      {/* Llamas decorativas de fondo */}
      <div className="kds-bubble bubble-1" />
      <div className="kds-bubble bubble-2" />
      <div className="kds-bubble bubble-3" />

      <div className="kds-login-card">
        <div className="kds-login-logo">👨‍🍳</div>
        <h1 className="kds-login-title">Monitor de Cocina</h1>
        <p className="kds-login-subtitle">KDS · Producción en tiempo real</p>

        <form onSubmit={handleLogin} className="kds-login-form">
          {error && (
            <div className="kds-login-error">
              <span>⚠️</span> {error}
            </div>
          )}

          <div className="kds-login-field">
            <label htmlFor="kds-usuario">Usuario</label>
            <input
              id="kds-usuario"
              type="text"
              placeholder="ej. cocinero"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              disabled={loading}
              required
              autoComplete="username"
            />
          </div>

          <div className="kds-login-field">
            <label htmlFor="kds-password">Contraseña</label>
            <input
              id="kds-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className="kds-login-btn" disabled={loading}>
            {loading ? '⏳ Verificando...' : '🔥 Entrar a Cocina'}
          </button>
        </form>

        <p className="kds-login-footer">Pizzas Laurita · SIGP v2.0</p>
      </div>

      {/* 🔥 PANTALLA DE CARGA KDS — se activa al autenticar */}
      {loading && (
        <div className="kds-loading-overlay">
          <div className="kds-icon-cargando">👨‍🍳</div>
          <h2 className="kds-loading-titulo">Encendiendo los hornos...</h2>
          <p className="kds-texto-parpadeante">
            Conectando con la cocina en la nube, un momento.
          </p>
          <div className="kds-loading-bar-container">
            <div className="kds-loading-bar-fill" />
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;

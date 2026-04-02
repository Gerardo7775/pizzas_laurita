import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SidebarLayout from './layouts/SidebarLayout';
import PuntoVenta from './pages/PuntoVenta';
import CocinaKDS from './pages/CocinaKDS';
import NotFound from './pages/NotFound';
import Historial from './pages/Historial';
import CorteCaja from './pages/CorteCaja';
import Login from './pages/Login'; // 🔐 Importar el Login de Cocina
import ModalConfirmacion from './components/ModalConfirmacion'; // 🚨 Nuevo Modal KDS

function App() {
  // Estado para verificar si el usuario está logueado
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  
  // Estado para el modal de cierre de sesión
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleConfirmLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    setIsAuthenticated(false);
    setShowLogoutModal(false);
  };

  const handleCancelLogout = () => {
    setShowLogoutModal(false);
  };

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  // 🛡️ Si NO está autenticado, mostramos el Login con tema KDS
  if (!isAuthenticated) {
    return <Login onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  // ✅ Si SÍ está autenticado, mostramos el sistema de Monitor
  return (
    <Router>
      {/* Botón flotante para salir de Cocina */}
      <button 
        id="btn-logout-kds"
        onClick={handleLogoutClick} 
        style={{ 
          position: 'fixed', 
          top: 15, 
          right: 20, 
          zIndex: 9999, 
          background: 'rgba(231, 76, 60, 0.2)', 
          backdropFilter: 'blur(5px)',
          color: '#ff4757', 
          border: '1px solid #ff4757', 
          padding: '8px 16px', 
          borderRadius: '10px', 
          cursor: 'pointer',
          fontWeight: '700',
          fontSize: '13px',
          transition: 'all 0.3s'
        }}
        onMouseOver={(e) => { e.target.style.background = '#ff4757'; e.target.style.color = '#fff'; }}
        onMouseOut={(e) => { e.target.style.background = 'rgba(231, 76, 60, 0.2)'; e.target.style.color = '#ff4757'; }}
      >
        🔥 Salir de Cocina
      </button>

      {/* Modal de Confirmación Estético KDS */}
      <ModalConfirmacion 
        active={showLogoutModal}
        onConfirm={handleConfirmLogout}
        onCancel={handleCancelLogout}
        titulo="Salir del Monitor"
        mensaje="¿Estás seguro de que deseas salir de la cocina? No verás los pedidos entrantes."
      />

      <Routes>
        <Route path="/" element={<SidebarLayout />}>
          <Route index element={<Navigate to="/cocina" replace />} />
          <Route path="pos" element={<PuntoVenta />} />
          <Route path="cocina" element={<CocinaKDS />} />
          <Route path="historial" element={<Historial />} />
          <Route path="caja" element={<CorteCaja />} />
        </Route>
        
        <Route path="*" element={<NotFound appName="Ventas & KDS" />} />
      </Routes>
    </Router>
  );
}

export default App;

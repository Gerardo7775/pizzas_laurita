import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SidebarLayout from './layouts/SidebarLayout';
import BackOffice from './pages/BackOffice';
import Historial from './pages/Historial';
import Estadisticas from './pages/Estadisticas';
import NotFound from './pages/NotFound';
import Login from './pages/Login'; // 🔐 Pantalla de acceso
import ModalConfirmacion from './components/ModalConfirmacion'; // 🚨 Nuevo Modal

function App() {
  // Verificamos si ya hay un token guardado al abrir la página
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

  // Si NO está autenticado → solo mostramos la pantalla de Login
  if (!isAuthenticated) {
    return <Login onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  // Si SÍ está autenticado → mostramos el sistema completo
  return (
    <Router>
      {/* Botón flotante de cerrar sesión */}
      <button
        id="btn-logout"
        onClick={handleLogoutClick}
        style={{
          position: 'fixed',
          top: 12,
          right: 24,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'transparent',
          color: '#e74c3c',
          border: '1.5px solid #e74c3c',
          padding: '7px 16px',
          borderRadius: '8px',
          cursor: 'pointer',
          fontWeight: '600',
          fontSize: '13px',
          fontFamily: 'inherit',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = '#e74c3c';
          e.currentTarget.style.color = '#fff';
          e.currentTarget.style.boxShadow = '0 4px 14px rgba(231,76,60,0.35)';
          e.currentTarget.style.transform = 'translateY(-1px)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = '#e74c3c';
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        🚪 Cerrar Sesión
      </button>

      {/* Modal de Confirmación Estético */}
      <ModalConfirmacion 
        active={showLogoutModal}
        onConfirm={handleConfirmLogout}
        onCancel={handleCancelLogout}
        titulo="Cerrar Sesión"
        mensaje="¿Estás seguro de que deseas salir del sistema? Se perderán las pestañas que no hayas guardado."
      />

      <Routes>
        <Route path="/" element={<SidebarLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard"    element={<BackOffice />} />
          <Route path="inventario"   element={<BackOffice />} />
          <Route path="catalogo"     element={<BackOffice />} />
          <Route path="paquetes"     element={<BackOffice />} />
          <Route path="historial"    element={<Historial />} />
          <Route path="estadisticas" element={<Estadisticas />} />
        </Route>
        <Route path="*" element={<NotFound appName="SIGP Administrador" />} />
      </Routes>
    </Router>
  );
}

export default App;

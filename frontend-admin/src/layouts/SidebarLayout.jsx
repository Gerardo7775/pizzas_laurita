import { NavLink, Outlet } from 'react-router-dom';
import './SidebarLayout.css';

const SidebarLayout = () => {
  return (
    <div className="app-container">
      {/* BARRA LATERAL ADMIN */}
      <nav className="sidebar">
        <div className="brand">⚙️ SIGP Admin</div>
        
        <NavLink to="/dashboard" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
          📊 Dashboard
        </NavLink>
        <NavLink to="/inventario" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
          📦 Inventario
        </NavLink>
        <NavLink to="/catalogo" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
          🍕 Catálogo y Recetas
        </NavLink>
        <NavLink to="/paquetes" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
          🎁 Combos / Paquetes
        </NavLink>
        <NavLink to="/historial" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
          📖 Ventas e Historial
        </NavLink>
        <NavLink to="/estadisticas" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
          📈 Panel de Estadísticas
        </NavLink>
      </nav>

      {/* CONTENIDO PRINCIPAL DINÁMICO */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default SidebarLayout;

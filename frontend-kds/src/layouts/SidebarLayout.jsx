import { NavLink, Outlet } from 'react-router-dom';
import './SidebarLayout.css'; 

const SidebarLayout = () => {
  return (
    <div className="app-container">
      {/* BARRA LATERAL */}
      <nav className="sidebar">
        <div className="brand" style={{fontSize: '12px', textAlign: 'center'}}>SIGP<br/>POS & KDS</div>
        
        <NavLink to="/pos" className={({ isActive }) => isActive ? "nav-btn active" : "nav-btn"}>
          🛒<span>Venta</span>
        </NavLink>
        
        <NavLink to="/cocina" className={({ isActive }) => isActive ? "nav-btn active" : "nav-btn"}>
          👨‍🍳<span>Cocina</span>
        </NavLink>

        <NavLink to="/historial" className={({ isActive }) => isActive ? "nav-btn active" : "nav-btn"}>
          📖<span>Historial</span>
        </NavLink>

        <NavLink to="/caja" className={({ isActive }) => isActive ? "nav-btn active" : "nav-btn"}>
          📊<span>Caja</span>
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

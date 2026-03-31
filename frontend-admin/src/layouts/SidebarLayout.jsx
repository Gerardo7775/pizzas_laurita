import { NavLink, Outlet } from 'react-router-dom';
import './SidebarLayout.css'; // Aquí meteremos el CSS oscuro que hicimos en el HTML

const SidebarLayout = () => {
  return (
    <div className="app-container">
      {/* BARRA LATERAL */}
      <nav className="sidebar">
        <div className="brand">SIGP</div>
        
        <NavLink to="/pos" className={({ isActive }) => isActive ? "nav-btn active" : "nav-btn"}>
          🛒<span>Venta</span>
        </NavLink>
        
        <NavLink to="/cocina" className={({ isActive }) => isActive ? "nav-btn active" : "nav-btn"}>
          👨‍🍳<span>Cocina</span>
        </NavLink>

        <NavLink to="/admin" className={({ isActive }) => isActive ? "nav-btn active" : "nav-btn"}>
          ⚙️<span>Admin</span>
        </NavLink>
      </nav>

      {/* CONTENIDO PRINCIPAL DINÁMICO */}
      <main className="main-content">
        <Outlet /> {/* Aquí React inyectará la pantalla dependiendo de la URL */}
      </main>
    </div>
  );
};

export default SidebarLayout;

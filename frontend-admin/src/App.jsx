import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SidebarLayout from './layouts/SidebarLayout';

// Aquí importaremos las pantallas (Páginas) que iremos creando
// import PuntoVenta from './pages/PuntoVenta';
// import CocinaKDS from './pages/CocinaKDS';
// import BackOffice from './pages/BackOffice';

function App() {
  return (
    <Router>
      <Routes>
        {/* Todas las rutas estarán envueltas por el Layout que tiene la barra lateral */}
        <Route path="/" element={<SidebarLayout />}>
          
          {/* Redirección por defecto al Punto de Venta */}
          <Route index element={<Navigate to="/pos" replace />} />
          
          {/* Aquí irán nuestras pantallas reales (por ahora ponemos un texto de prueba) */}
          <Route path="pos" element={<h2>🛒 Pantalla de Punto de Venta (En construcción)</h2>} />
          <Route path="cocina" element={<h2>👨‍🍳 Pantalla de Cocina KDS (En construcción)</h2>} />
          <Route path="admin" element={<h2>⚙️ BackOffice Administrativo (En construcción)</h2>} />
          
        </Route>
      </Routes>
    </Router>
  );
}

export default App;

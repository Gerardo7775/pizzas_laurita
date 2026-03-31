import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SidebarLayout from './layouts/SidebarLayout';
import PuntoVenta from './pages/PuntoVenta';
import CocinaKDS from './pages/CocinaKDS';
import NotFound from './pages/NotFound';
import Historial from './pages/Historial';   // <-- IMPORTAR
import CorteCaja from './pages/CorteCaja';   // <-- IMPORTAR


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SidebarLayout />}>
          <Route index element={<Navigate to="/pos" replace />} />
          <Route path="pos" element={<PuntoVenta />} />
          <Route path="cocina" element={<CocinaKDS />} />
          
          <Route path="historial" element={<Historial />} />
          <Route path="caja" element={<CorteCaja />} />
        </Route>
        
        {/* Ruta 404 Fuera del Layout */}
        <Route path="*" element={<NotFound appName="Ventas & KDS" />} />
      </Routes>
    </Router>
  );
}

export default App;

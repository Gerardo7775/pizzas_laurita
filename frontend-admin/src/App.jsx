import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SidebarLayout from './layouts/SidebarLayout';
import BackOffice from './pages/BackOffice';
import NotFound from './pages/NotFound';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SidebarLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          
          <Route path="dashboard" element={<BackOffice />} />
          <Route path="inventario" element={<BackOffice />} />
          <Route path="catalogo" element={<BackOffice />} />
          <Route path="paquetes" element={<BackOffice />} />
        </Route>
        
        {/* Ruta 404 Fuera del Layout */}
        <Route path="*" element={<NotFound appName="SIGP Administrador" />} />
      </Routes>
    </Router>
  );
}

export default App;

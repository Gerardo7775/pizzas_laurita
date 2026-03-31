import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SidebarLayout from './layouts/SidebarLayout';
import PuntoVenta from './pages/PuntoVenta';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SidebarLayout />}>
          <Route index element={<Navigate to="/pos" replace />} />
          
          <Route path="pos" element={<PuntoVenta />} />
          
          <Route path="cocina" element={<h2>👨‍🍳 Pantalla de Cocina KDS (En construcción)</h2>} />
          <Route path="admin" element={<h2>⚙️ BackOffice Administrativo (En construcción)</h2>} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;

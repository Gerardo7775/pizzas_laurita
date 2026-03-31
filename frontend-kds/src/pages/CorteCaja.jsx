import { useState, useEffect } from 'react';
import axios from 'axios';

const CorteCaja = () => {
  const [resumen, setResumen] = useState({ total_dia: 0, cantidad_pedidos: 0 });

  useEffect(() => {
    const fetchCaja = async () => {
      try {
        const res = await axios.get('http://localhost:3000/api/pedidos/historial');
        if (res.data.success) {
          setResumen(res.data.data.resumen);
        }
      } catch (error) {
        console.error('Error fetching caja', error);
      }
    };
    fetchCaja();
  }, []);

  const handleCorteZ = () => {
    // Alerta de confirmación gerencial
    if(window.confirm('¿Estás seguro de generar el Corte Z? Esto reiniciará las ventas para el siguiente turno.')) {
      alert(`¡Corte Generado Exitosamente!\n\nTotal a entregar: $${resumen.total_dia.toFixed(2)}`);
    }
  };

  return (
    <div style={{ padding: '30px', backgroundColor: '#f4f7f6', height: '100%' }}>
      <h1 style={{ color: '#00b894', marginTop: 0 }}>📊 Corte de Turno (Caja)</h1>
      <p style={{ color: '#636e72' }}>Resumen financiero de las operaciones del día actual.</p>

      <div style={{ display: 'flex', gap: '20px', marginTop: '30px' }}>
        
        <div style={{ flex: 1, backgroundColor: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', borderLeft: '5px solid #00b894' }}>
          <h3 style={{ margin: 0, color: '#b2bec3', textTransform: 'uppercase' }}>Ingresos Totales</h3>
          <h1 style={{ fontSize: '40px', margin: '10px 0 0 0', color: '#2d3436' }}>
            ${resumen.total_dia.toFixed(2)}
          </h1>
        </div>

        <div style={{ flex: 1, backgroundColor: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', borderLeft: '5px solid #6c5ce7' }}>
          <h3 style={{ margin: 0, color: '#b2bec3', textTransform: 'uppercase' }}>Tickets Emitidos</h3>
          <h1 style={{ fontSize: '40px', margin: '10px 0 0 0', color: '#2d3436' }}>
            {resumen.cantidad_pedidos}
          </h1>
        </div>

      </div>

      <button 
        onClick={handleCorteZ}
        style={{ marginTop: '40px', padding: '15px 40px', backgroundColor: '#d63031', color: 'white', border: 'none', borderRadius: '8px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 6px rgba(214,48,49,0.3)' }}
      >
        🔒 Generar Corte Z y Cerrar Turno
      </button>

    </div>
  );
};

export default CorteCaja;

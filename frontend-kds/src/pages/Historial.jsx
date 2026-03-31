import { useState, useEffect } from 'react';
import axios from 'axios';

const Historial = () => {
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const fetchHistorial = async () => {
      try {
        const res = await axios.get('http://localhost:3000/api/pedidos/historial');
        if (res.data.success) {
          setPedidos(res.data.data.pedidos);
        }
      } catch (error) {
        console.error('Error fetching historial', error);
      } finally {
        setCargando(false);
      }
    };
    fetchHistorial();
  }, []);

  // --- FUNCIÓN PARA IMPRIMIR TICKET ---
  const imprimirTicket = (pedido) => {
    // 1. Crear una nueva ventana invisible
    const ventanaImpresion = window.open('', '_blank', 'width=400,height=600');
    
    // 2. Inyectar HTML con formato de impresora térmica (Ticket de 58mm / 80mm)
    ventanaImpresion.document.write(`
      <html>
        <head>
          <title>Ticket ${pedido.folio}</title>
          <style>
            body { font-family: monospace; padding: 10px; width: 300px; margin: 0 auto; color: #000; }
            h2 { text-align: center; margin: 0 0 10px 0; }
            .divider { border-bottom: 1px dashed #000; margin: 10px 0; }
            .row { display: flex; justify-content: space-between; }
            .total { font-weight: bold; font-size: 18px; margin-top: 10px; text-align: right; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; }
          </style>
        </head>
        <body>
          <h2>🍕 PIZZERÍA SIGP</h2>
          <div style="text-align: center;">Sucursal Centro Histórico</div>
          <div class="divider"></div>
          <div><strong>Folio:</strong> ${pedido.folio}</div>
          <div><strong>Fecha:</strong> ${new Date(pedido.fecha_creacion).toLocaleString()}</div>
          <div class="divider"></div>
          <div class="row"><span>1x Consumo General</span> <span>$${pedido.total}</span></div>
          <div class="divider"></div>
          <div class="total">TOTAL: $${pedido.total}</div>
          <div class="footer">¡Gracias por su preferencia!</div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    ventanaImpresion.document.close();
  };

  if (cargando) return <h2 style={{padding: '20px'}}>Cargando historial...</h2>;

  return (
    <div style={{ padding: '30px', backgroundColor: '#f4f7f6', height: '100%', overflowY: 'auto' }}>
      <h1 style={{ color: '#6c5ce7', marginTop: 0 }}>📖 Historial de Pedidos</h1>
      
      <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr>
              <th style={{ padding: '15px', backgroundColor: '#fafafa', borderBottom: '1px solid #dfe6e9' }}>Folio</th>
              <th style={{ padding: '15px', backgroundColor: '#fafafa', borderBottom: '1px solid #dfe6e9' }}>Hora</th>
              <th style={{ padding: '15px', backgroundColor: '#fafafa', borderBottom: '1px solid #dfe6e9' }}>Estado</th>
              <th style={{ padding: '15px', backgroundColor: '#fafafa', borderBottom: '1px solid #dfe6e9' }}>Total</th>
              <th style={{ padding: '15px', backgroundColor: '#fafafa', borderBottom: '1px solid #dfe6e9' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {pedidos.map(p => (
              <tr key={p.id} style={{ borderBottom: '1px solid #dfe6e9' }}>
                <td style={{ padding: '15px' }}><strong>{p.folio}</strong></td>
                <td style={{ padding: '15px' }}>{new Date(p.fecha_creacion).toLocaleTimeString()}</td>
                <td style={{ padding: '15px' }}>
                  <span style={{ 
                    padding: '5px 10px', borderRadius: '15px', fontSize: '12px', fontWeight: 'bold', color: 'white',
                    backgroundColor: p.estado === 'PENDIENTE' ? '#fdcb6e' : p.estado === 'CANCELADO' ? '#d63031' : '#00b894' 
                  }}>
                    {p.estado}
                  </span>
                </td>
                <td style={{ padding: '15px', fontWeight: 'bold' }}>${p.total}</td>
                <td style={{ padding: '15px' }}>
                  <button 
                    onClick={() => imprimirTicket(p)}
                    style={{ padding: '8px 12px', backgroundColor: '#b2bec3', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    🖨️ Imprimir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Historial;

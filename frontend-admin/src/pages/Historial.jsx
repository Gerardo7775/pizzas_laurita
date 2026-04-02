import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';

const Historial = () => {
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);

  // --- ESTADOS DE FILTRO ---
  const [filtroEstado, setFiltroEstado] = useState('TODOS');
  const [filtroFechaDesde, setFiltroFechaDesde] = useState('');
  const [filtroFechaHasta, setFiltroFechaHasta] = useState('');
  const [orden, setOrden] = useState('HORA_DESC'); 

  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const fetchHistorial = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/pedidos/historial`);
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

    const token = localStorage.getItem('token');
    const socket = io(API_URL, {
      auth: { token }
    });
    
    // Escuchar nuevos pedidos en cocina (para ponerlos en el historial como PENDIENTE)
    socket.on('nuevo_pedido_cocina', (data) => {
      setPedidos(prev => [data, ...prev]);
    });

    // Escuchar actualizaciones de estado (incluido ENTREGADO y CANCELADO)
    socket.on('estado_pedido_actualizado', (data) => {
      setPedidos(prev => prev.map(p => {
        if (p.id === parseInt(data.id)) {
          return { ...p, estado: data.nuevo_estado, fecha_entrega: data.nuevo_estado === 'ENTREGADO' ? new Date().toISOString() : p.fecha_entrega };
        }
        return p;
      }));
    });

    return () => socket.disconnect();
  }, []);

  // --- LÓGICA DE FILTRADO Y ORDENAMIENTO ---
  const pedidosFiltrados = useMemo(() => {
    let result = [...pedidos];
    
    // Filtro Estado
    if (filtroEstado !== 'TODOS') {
      result = result.filter(p => p.estado === filtroEstado);
    }
    
    // Filtro Rango de Fechas
    if (filtroFechaDesde) {
       const start = new Date(filtroFechaDesde);
       start.setHours(0, 0, 0, 0);
       result = result.filter(p => new Date(p.fecha_creacion) >= start);
    }
    if (filtroFechaHasta) {
       const end = new Date(filtroFechaHasta);
       end.setHours(23, 59, 59, 999);
       result = result.filter(p => new Date(p.fecha_creacion) <= end);
    }
    
    // Ordenamiento
    result.sort((a,b) => {
       if (orden === 'HORA_DESC') return new Date(b.fecha_creacion) - new Date(a.fecha_creacion);
       if (orden === 'HORA_ASC') return new Date(a.fecha_creacion) - new Date(b.fecha_creacion);
       if (orden === 'PRECIO_DESC') return parseFloat(b.total) - parseFloat(a.total);
       if (orden === 'PRECIO_ASC') return parseFloat(a.total) - parseFloat(b.total);
       return 0;
    });
    
    return result;
  }, [pedidos, filtroEstado, filtroFechaDesde, filtroFechaHasta, orden]);

  // Total de solo los resultados visibles ignorando CANCELADOS para la métrica financiera
  const totalFiltrado = pedidosFiltrados
    .filter(p => p.estado !== 'CANCELADO')
    .reduce((sum, p) => sum + parseFloat(p.total), 0);

  // --- FUNCIÓN PARA IMPRIMIR TICKET ---
  const imprimirTicket = (pedido) => {
    const ventanaImpresion = window.open('', '_blank', 'width=400,height=600');
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
      
      {/* --- PANEL DE GESTIÓN Y FILTROS --- */}
      <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '150px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px', color: '#2d3436' }}>📑 Estado</label>
          <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #dfe6e9', backgroundColor: '#fafafa', outline: 'none' }}>
            <option value="TODOS">Todos los estados</option>
            <option value="ENTREGADO">✅ Entregados</option>
            <option value="PENDIENTE">⏳ Pendientes</option>
            <option value="PREPARANDO">🔪 Preparando</option>
            <option value="HORNEANDO">🔥 Horneando</option>
            <option value="LISTO_ENTREGA">📦 Listos p/Entregar</option>
            <option value="CANCELADO">⛔ Cancelados</option>
          </select>
        </div>
        <div style={{ flex: 1, minWidth: '150px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px', color: '#2d3436' }}>📅 Desde (Fecha)</label>
          <input type="date" value={filtroFechaDesde} onChange={e => setFiltroFechaDesde(e.target.value)} style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #dfe6e9', outline: 'none' }} />
        </div>
        <div style={{ flex: 1, minWidth: '150px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px', color: '#2d3436' }}>📅 Hasta (Fecha)</label>
          <input type="date" value={filtroFechaHasta} onChange={e => setFiltroFechaHasta(e.target.value)} style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #dfe6e9', outline: 'none' }} />
        </div>
        <div style={{ flex: 1, minWidth: '150px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px', color: '#2d3436' }}>↕️ Ordenar por</label>
          <select value={orden} onChange={e => setOrden(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #dfe6e9', backgroundColor: '#fafafa', outline: 'none' }}>
            <option value="HORA_DESC">🕒 Más recientes primero</option>
            <option value="HORA_ASC">🕒 Más antiguos primero</option>
            <option value="PRECIO_DESC">💰 Mayor precio primero</option>
            <option value="PRECIO_ASC">💰 Menor precio primero</option>
          </select>
        </div>
        
        {/* TOTALIZADOR */}
        <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginTop: '10px', paddingTop: '15px', borderTop: '2px dashed #eee' }}>
            <div style={{ fontSize: '14px', color: '#636e72', marginRight: '20px' }}>
                Mostrando: <strong style={{color: '#2d3436'}}>{pedidosFiltrados.length}</strong> {pedidosFiltrados.length === 1 ? 'pedido' : 'pedidos'}
            </div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#00b894', backgroundColor: 'rgba(0,184,148,0.1)', padding: '5px 15px', borderRadius: '8px' }}>
                Ingreso de filtro: ${totalFiltrado.toFixed(2)}
            </div>
        </div>
      </div>
      
      {/* --- TABLA --- */}
      <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr>
              <th style={{ padding: '15px', backgroundColor: '#fafafa', borderBottom: '1px solid #dfe6e9' }}>Folio</th>
              <th style={{ padding: '15px', backgroundColor: '#fafafa', borderBottom: '1px solid #dfe6e9' }}>Creado</th>
              <th style={{ padding: '15px', backgroundColor: '#fafafa', borderBottom: '1px solid #dfe6e9' }}>Entregado</th>
              <th style={{ padding: '15px', backgroundColor: '#fafafa', borderBottom: '1px solid #dfe6e9' }}>Estado</th>
              <th style={{ padding: '15px', backgroundColor: '#fafafa', borderBottom: '1px solid #dfe6e9' }}>Total</th>
              <th style={{ padding: '15px', backgroundColor: '#fafafa', borderBottom: '1px solid #dfe6e9' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {pedidosFiltrados.length === 0 ? (
               <tr>
                 <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#b2bec3' }}>No hay pedidos que coincidan con el filtro actual.</td>
               </tr>
            ) : pedidosFiltrados.map(p => {
              // Color base según estado:
              let stateBg = '#b2bec3';
              if (p.estado === 'PENDIENTE') stateBg = '#fdcb6e';
              else if (p.estado === 'CANCELADO') stateBg = '#d63031';
              else if (p.estado === 'ENTREGADO') stateBg = '#00b894';
              else if (p.estado === 'HORNEANDO' || p.estado === 'PREPARANDO') stateBg = '#e17055';
              else if (p.estado === 'LISTO_ENTREGA') stateBg = '#0984e3';

              return (
                <tr key={p.id} style={{ borderBottom: '1px solid #dfe6e9', backgroundColor: p.estado === 'CANCELADO' ? '#fff0f0' : 'transparent' }}>
                  <td style={{ padding: '15px' }}><strong>{p.folio}</strong></td>
                  <td style={{ padding: '15px' }}>
                    {new Date(p.fecha_creacion).toLocaleDateString()} <br/>
                    <span style={{color: '#636e72', fontSize: '0.9em'}}>{new Date(p.fecha_creacion).toLocaleTimeString()}</span>
                  </td>
                  <td style={{ padding: '15px', color: '#636e72', fontSize: '0.9em' }}>
                    {p.fecha_entrega ? new Date(p.fecha_entrega).toLocaleTimeString() : '--:--'}
                  </td>
                  <td style={{ padding: '15px' }}>
                    <span style={{ 
                      padding: '5px 10px', borderRadius: '15px', fontSize: '11px', fontWeight: 'bold', color: 'white',
                      backgroundColor: stateBg 
                    }}>
                      {p.estado}
                    </span>
                  </td>
                  <td style={{ padding: '15px', fontWeight: 'bold' }}>${parseFloat(p.total).toFixed(2)}</td>
                  <td style={{ padding: '15px' }}>
                    <button 
                      onClick={() => imprimirTicket(p)}
                      style={{ padding: '8px 12px', backgroundColor: '#b2bec3', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      🖨️ Imprimir
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Historial;

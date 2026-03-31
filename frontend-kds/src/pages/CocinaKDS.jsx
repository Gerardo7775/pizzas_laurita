import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import './CocinaKDS.css';

const CocinaKDS = () => {
  const [pedidos, setPedidos] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    // 0. CARGAR ESTADO INICIAL DESDE LA BASE DE DATOS (A prueba de recargas "F5")
    const cargarPedidosIniciales = async () => {
      try {
        const res = await axios.get('http://localhost:3000/api/pedidos/cocina');
        if (res.data.success) {
          setPedidos(res.data.data);
        }
      } catch (err) {
        console.error('Error cargando los pedidos historicos:', err);
      }
    };
    cargarPedidosIniciales();

    // 1. Inicializar el socket solo una vez al montar el componente (Sobrevive StrictMode y Recargas)
    if (!socketRef.current) {
      socketRef.current = io('http://localhost:3000');
    }
    const socket = socketRef.current;

    // Validar estado inmediato si ya está conectado
    if (socket.connected) {
      setIsConnected(true);
      socket.emit('unirse_cocina');
    }

    const onConnect = () => {
      setIsConnected(true);
      // Unirnos al canal exclusivo de la cocina
      socket.emit('unirse_cocina');
    };

    const onDisconnect = () => {
      setIsConnected(false);
    };

    // 2. ESCUCHAR NUEVOS PEDIDOS DESDE EL PUNTO DE VENTA
    const onNuevoPedido = (nuevoPedido) => {
      console.log('¡Nuevo pedido recibido por WebSocket!', nuevoPedido);
      
      const pedidoMapeado = {
        ...nuevoPedido,
        id_local: Date.now(), // ID temporal
        estado: 'PENDIENTE',
        hora_ingreso: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
      };

      setPedidos((prevPedidos) => [...prevPedidos, pedidoMapeado]);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('nuevo_pedido_cocina', onNuevoPedido);

    // Limpiamos los listeners para evitar duplicados en re-renderizados
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('nuevo_pedido_cocina', onNuevoPedido);
    };
  }, []);

  // Función para mover el pedido de columna en el tablero Kanban y BD
  const avanzarEstado = async (id, estadoActual) => {
    const transiciones = {
      'PENDIENTE': 'PREPARANDO',
      'PREPARANDO': 'HORNEANDO',
      'HORNEANDO': 'LISTO_ENTREGA'
    };

    const nuevoEstado = transiciones[estadoActual];

    if (nuevoEstado) {
      setPedidos(pedidos.map(p => 
        p.id_local === id ? { ...p, estado: nuevoEstado } : p
      ));
      // Actualizar en el Backend silenciosamente
      try {
        await axios.patch(`http://localhost:3000/api/pedidos/${id}/estado`, { estado: nuevoEstado });
      } catch (e) {
        console.error('Error al sincronizar estado con servidor', e);
      }
    } else {
      // Despacharlo (Desaparece de la KDS localmente)
      setPedidos(pedidos.filter(p => p.id_local !== id));
      try {
        // En base de datos, el flujo final al despacharlo sería ENTREGADO u otro.
        await axios.patch(`http://localhost:3000/api/pedidos/${id}/estado`, { estado: 'ENTREGADO' });
      } catch (e) {
        console.error('Error al marcar como entregado', e);
      }
    }
  };

  // Función auxiliar para renderizar las tarjetas según su estado
  const renderColumna = (estadoFiltro, titulo, emoji) => {
    const pedidosColumna = pedidos.filter(p => p.estado === estadoFiltro);

    return (
      <div className="kanban-column">
        <div className="col-header">{emoji} {titulo} ({pedidosColumna.length})</div>
        
        {pedidosColumna.map((pedido) => (
          <div key={pedido.id_local} className={`order-card ${estadoFiltro === 'PENDIENTE' ? 'danger' : ''}`}>
            
            <div className="order-card-header">
              <span className="folio">#{pedido.folio}</span>
              <span className="timer" style={{ color: estadoFiltro === 'PENDIENTE' ? '#e74c3c' : '#00b894' }}>
                {pedido.hora_ingreso}
              </span>
            </div>

            <ul className="order-items">
              {pedido.items && pedido.items.map((item, idx) => (
                <div key={idx} style={{ marginBottom: '8px' }}>
                  <li><strong>{item.cantidad}x {item.nombre || (item.tipo === 'PAQUETE' ? 'Combo' : 'Producto')}</strong></li>
                  {/* Si trae sub-items (las partes del paquete) */}
                  {item.sub_items && item.sub_items.map((sub, sIdx) => (
                    <div key={sIdx}>
                      <li className="mitad" style={{ paddingLeft: '15px', color: '#555', fontSize: '12px' }}>
                        ↳ {sub.cantidad}x {sub.nombre} ({sub.presentacion_nombre})
                      </li>
                    </div>
                  ))}
                </div>
              ))}
            </ul>

            <button 
              className="kds-btn" 
              style={{ backgroundColor: estadoFiltro === 'HORNEANDO' ? '#00b894' : '' }}
              onClick={() => avanzarEstado(pedido.id_local, pedido.estado)}
            >
              {estadoFiltro === 'PENDIENTE' && 'Empezar a Preparar'}
              {estadoFiltro === 'PREPARANDO' && 'Meter al Horno'}
              {estadoFiltro === 'HORNEANDO' && 'Marcar como Listo'}
              {estadoFiltro === 'LISTO' && 'Despachar a Repartidor'}
            </button>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="kds-container">
      <div className="kds-header">
        <h2 style={{ margin: 0 }}>🍕 Monitor KDS - Cocina</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: isConnected ? '#00b894' : '#e74c3c' }}></div>
          <span style={{ fontWeight: 'bold' }}>{isConnected ? 'Conectado (En vivo)' : 'Desconectado'}</span>
        </div>
      </div>

      <div className="kanban-board">
        {renderColumna('PENDIENTE', 'Entrantes', '📋')}
        {renderColumna('PREPARANDO', 'En Mesa', '👨‍🍳')}
        {renderColumna('HORNEANDO', 'Horno', '🔥')}
        {renderColumna('LISTO_ENTREGA', 'Para Entrega', '✅')}
      </div>
    </div>
  );
};

export default CocinaKDS;

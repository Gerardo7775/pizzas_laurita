import { useState } from 'react';
import axios from 'axios';
import './PuntoVenta.css';

const PuntoVenta = () => {
  // --- ESTADOS (State) ---
  const [carrito, setCarrito] = useState([]);
  const [total, setTotal] = useState(0);
  
  // Estado para el modal de mitades
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saborA, setSaborA] = useState('1'); // IDs simulados (1: Pepperoni)
  const [saborB, setSaborB] = useState('2'); // IDs simulados (2: Hawaiana)

  // --- LÓGICA DEL CARRITO ---
  const agregarNormal = (nombre, precio, presentacion_id) => {
    const nuevoItem = {
      tipo: 'PRODUCTO_NORMAL',
      nombre,
      precio,
      presentacion_id,
      cantidad: 1
    };
    setCarrito([...carrito, nuevoItem]);
    setTotal(total + precio);
  };

  const agregarComboMitades = () => {
    // Nombres legibles para el ticket
    const nombresSabores = { '1': 'Pepperoni', '2': 'Hawaiana', '3': 'Vegetariana' };
    
    const nuevoCombo = {
      tipo: 'PAQUETE',
      nombre: 'Combo Pareja (Pizza Mitades + Refresco)',
      precio: 180,
      paquete_id: 1, // ID del paquete en PostgreSQL
      cantidad: 1,
      saborA_id: parseInt(saborA),
      saborB_id: parseInt(saborB),
      saborA_nombre: nombresSabores[saborA],
      saborB_nombre: nombresSabores[saborB]
    };

    setCarrito([...carrito, nuevoCombo]);
    setTotal(total + 180);
    setIsModalOpen(false); // Cerramos el modal
  };

  // --- ENVIAR AL BACKEND ---
  const cobrarPedido = async () => {
    if (carrito.length === 0) return alert('El carrito está vacío');

    // 1. Construimos el JSON Payload tal como lo espera nuestro Backend
    const payload = {
      cliente: {
        nombre: "Cliente Mostrador",
        tipo_entrega: "LOCAL"
      },
      pedido: {
        total_calculado: total,
        items: carrito.map(item => {
          if (item.tipo === 'PAQUETE') {
            return {
              tipo: "PAQUETE",
              paquete_id: item.paquete_id,
              cantidad: item.cantidad,
              precio_unitario: item.precio,
              sub_items: [
                {
                  tipo: "PIZZA_MITADES",
                  presentacion_id: 3, // Base de Pizza Grande
                  es_mitad_y_mitad: true,
                  sabor_a_id: item.saborA_id,
                  sabor_b_id: item.saborB_id,
                  cantidad: 1,
                  precio_unitario: 0,
                  notas_cocina: "Mitades configuradas desde POS"
                },
                {
                  tipo: "PRODUCTO_NORMAL",
                  presentacion_id: 4, // Refresco 2L
                  cantidad: 1,
                  precio_unitario: 0
                }
              ]
            };
          } else {
            // Producto Normal
            return {
              tipo: "PRODUCTO_NORMAL",
              presentacion_id: item.presentacion_id,
              cantidad: item.cantidad,
              precio_unitario: item.precio
            };
          }
        })
      }
    };

    try {
      // 2. Disparamos a la API
      // Nota: Asegúrate de que el backend esté corriendo en el puerto 3000
      await axios.post('http://localhost:3000/api/pedidos', payload);
      
      alert('¡Pedido cobrado y enviado a la cocina con éxito! 🍕');
      
      // 3. Limpiamos la caja
      setCarrito([]);
      setTotal(0);

    } catch (error) {
      console.error('Error al cobrar:', error);
      alert('Hubo un error al conectar con el servidor.');
    }
  };

  return (
    <div className="pos-container">
      
      {/* SECCIÓN IZQUIERDA: MENÚ */}
      <div className="menu-section">
        <h1 style={{ color: '#6c5ce7', marginTop: 0 }}>Punto de Venta</h1>
        
        <h2 className="category-title">🔥 Combos y Paquetes</h2>
        <div className="grid-menu">
          <button 
            className="btn-item" 
            style={{ borderColor: '#6c5ce7' }} 
            onClick={() => setIsModalOpen(true)}
          >
            Combo Pareja <span>$180.00</span>
          </button>
        </div>

        <h2 className="category-title">🍕 Pizzas y Snacks</h2>
        <div className="grid-menu">
          <button className="btn-item" onClick={() => agregarNormal('Pepperoni Gde', 150, 1)}>
            Pepperoni Gde <span>$150.00</span>
          </button>
          <button className="btn-item" onClick={() => agregarNormal('Papas Francesas', 55, 7)}>
            Papas Francesas <span>$55.00</span>
          </button>
        </div>
      </div>

      {/* SECCIÓN DERECHA: CARRITO (TICKET) */}
      <div className="cart-section">
        <div className="cart-header">
          <h2 style={{ margin: 0 }}>📝 Detalle del Pedido</h2>
        </div>
        
        <ul className="cart-items">
          {carrito.length === 0 ? (
            <div style={{ color: '#b2bec3', textAlign: 'center', marginTop: '50px' }}>
              El carrito está vacío
            </div>
          ) : (
            carrito.map((item, index) => (
              <li key={index} className="cart-item">
                <div className="cart-item-title">
                  <span style={{ color: item.tipo === 'PAQUETE' ? '#6c5ce7' : '#2d3436' }}>
                    {item.cantidad}x {item.nombre}
                  </span>
                  <span>${item.precio.toFixed(2)}</span>
                </div>
                {/* Desglose visual si es un combo de mitades */}
                {item.tipo === 'PAQUETE' && (
                  <>
                    <div className="cart-item-sub">↳ 🍕 Mitad {item.saborA_nombre} / Mitad {item.saborB_nombre}</div>
                    <div className="cart-item-sub">↳ 🥤 1x Refresco Cola 2L</div>
                  </>
                )}
              </li>
            ))
          )}
        </ul>

        <div className="cart-footer">
          <div className="total-row">
            <span>Total:</span>
            <span>${total.toFixed(2)}</span>
          </div>
          <button className="btn-checkout" onClick={cobrarPedido}>
            Cobrar y Enviar a Cocina
          </button>
        </div>
      </div>

      {/* MODAL DE MITADES */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ marginTop: 0 }}>Configurar Combo Pareja</h3>
            
            <label><strong>Mitad 1:</strong></label>
            <select value={saborA} onChange={(e) => setSaborA(e.target.value)}>
              <option value="1">Pepperoni</option>
              <option value="2">Hawaiana</option>
              <option value="3">Vegetariana</option>
            </select>

            <label><strong>Mitad 2:</strong></label>
            <select value={saborB} onChange={(e) => setSaborB(e.target.value)}>
              <option value="2">Hawaiana</option>
              <option value="1">Pepperoni</option>
              <option value="3">Vegetariana</option>
            </select>

            <button className="btn-confirm" onClick={agregarComboMitades}>
              Confirmar y Agregar
            </button>
            <button 
              className="btn-confirm" 
              style={{ backgroundColor: '#dfe6e9', color: '#2d3436' }} 
              onClick={() => setIsModalOpen(false)}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default PuntoVenta;

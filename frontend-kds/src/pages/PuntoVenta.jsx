import { useState, useEffect } from 'react';
import axios from 'axios';
import './PuntoVenta.css';

const PuntoVenta = () => {
  // --- ESTADOS (State) ---
  const [carrito, setCarrito] = useState([]);
  const [total, setTotal] = useState(0);
  const [menuPaquetes, setMenuPaquetes] = useState([]);
  const [menuProductos, setMenuProductos] = useState([]);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const resPaquetes = await axios.get('http://localhost:3000/api/paquetes');
        const resMenu = await axios.get('http://localhost:3000/api/menu');
        if (resPaquetes.data.success) setMenuPaquetes(resPaquetes.data.data);
        if (resMenu.data.success) setMenuProductos(resMenu.data.data.productos);
      } catch (err) {
        console.error('Error cargando menu POS', err);
      }
    };
    fetchMenu();
  }, []);
  
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

  const agregarPaquete = (paquete) => {
    const nuevoCombo = {
      tipo: 'PAQUETE',
      nombre: paquete.paquete_nombre,
      precio: parseFloat(paquete.precio_paquete),
      paquete_id: paquete.paquete_id,
      cantidad: 1,
      items: paquete.items // Items desde el BD
    };
    setCarrito([...carrito, nuevoCombo]);
    setTotal(total + parseFloat(paquete.precio_paquete));
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
              nombre: item.nombre, // Agregado para el KDS
              sub_items: Array.isArray(item.items) ? item.items.map(subItem => ({
                tipo: "PRODUCTO_NORMAL",
                presentacion_id: subItem.presentacion_id,
                cantidad: subItem.cantidad,
                precio_unitario: 0,
                // Extra metadata para la tabla de KDS:
                nombre: subItem.producto_nombre,
                presentacion_nombre: subItem.presentacion_nombre
              })) : []
            };
          } else {
            // Producto Normal
            return {
              tipo: "PRODUCTO_NORMAL",
              presentacion_id: item.presentacion_id,
              cantidad: item.cantidad,
              precio_unitario: item.precio,
              nombre: item.nombre // Agregado para el KDS
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
          {menuPaquetes.length > 0 ? menuPaquetes.map((paquete) => (
            <button key={`paq-${paquete.paquete_id}`} className="btn-item" style={{ borderColor: '#6c5ce7' }} onClick={() => agregarPaquete(paquete)}>
              {paquete.paquete_nombre} <span>${parseFloat(paquete.precio_paquete).toFixed(2)}</span>
            </button>
          )) : (
            <p style={{color: '#777'}}>No hay combos activos</p>
          )}
        </div>

        <h2 className="category-title">🍕 Pizzas y Snacks</h2>
        <div className="grid-menu">
          {menuProductos.length > 0 ? menuProductos.map((prod) => (
            <button key={`prod-${prod.presentacion_id}`} className="btn-item" onClick={() => agregarNormal(`${prod.producto_nombre} ${prod.presentacion_nombre}`, parseFloat(prod.precio), prod.presentacion_id)}>
              {prod.producto_nombre} ({prod.presentacion_nombre}) <span>${parseFloat(prod.precio).toFixed(2)}</span>
            </button>
          )) : (
            <p style={{color: '#777'}}>No hay productos activos</p>
          )}
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
                {item.tipo === 'PAQUETE' && item.items && item.items.map((sub, idx) => (
                    <div key={idx} className="cart-item-sub">↳ {sub.cantidad}x {sub.producto_nombre} ({sub.presentacion_nombre})</div>
                ))}
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

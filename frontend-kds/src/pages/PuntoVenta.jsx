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
  const [productoMitadActual, setProductoMitadActual] = useState(null);
  const [saborA, setSaborA] = useState(''); 
  const [saborB, setSaborB] = useState(''); 

  // Estado para configurador múltiple de combos
  const [comboConfigModalOpen, setComboConfigModalOpen] = useState(false);
  const [paqueteAConfigurar, setPaqueteAConfigurar] = useState(null);
  const [seleccionesPaquete, setSeleccionesPaquete] = useState({}); 

  // Estado para UX de éxito en cobro
  const [orderSuccess, setOrderSuccess] = useState(false);

  // --- LÓGICA DE MITADES DINÁMICAS ---
  const handleProductClick = (prod) => {
    if (prod.es_mitad_mitad) {
      const opciones = menuProductos.filter(p => !p.es_mitad_mitad && p.tamano_id === prod.tamano_id && p.categoria === prod.categoria);
      if (opciones.length < 2) return alert('No hay suficientes sabores con este tamaño configurados en el catálogo para armar una mitad.');
      
      setProductoMitadActual(prod);
      setSaborA(opciones[0].presentacion_id.toString());
      setSaborB(opciones[1].presentacion_id.toString());
      setIsModalOpen(true);
    } else {
      agregarNormal(`${prod.producto_nombre} (${prod.presentacion_nombre})`, parseFloat(prod.precio), prod.presentacion_id);
    }
  };

  const agregarComboMitades = () => {
    if (!saborA || !saborB) return alert("Selecciona ambos sabores");
    if (saborA === saborB) return alert("Selecciona dos sabores distintos por favor");
    const objA = menuProductos.find(p => p.presentacion_id.toString() === saborA.toString());
    const objB = menuProductos.find(p => p.presentacion_id.toString() === saborB.toString());
    
    const nombre = `${productoMitadActual.producto_nombre} (${productoMitadActual.presentacion_nombre}) - 1/2 ${objA.producto_nombre}, 1/2 ${objB.producto_nombre}`;
    agregarNormal(nombre, parseFloat(productoMitadActual.precio), productoMitadActual.presentacion_id);
    setIsModalOpen(false);
  };

  const eliminarDelCarrito = (index) => {
    const item = carrito[index];
    setTotal(total - item.precio);
    const nuevoCarrito = [...carrito];
    nuevoCarrito.splice(index, 1);
    setCarrito(nuevoCarrito);
  };

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
    // Expandimos los items del paquete según su cantidad
    const flatItems = [];
    paquete.items.forEach((item) => {
      for(let c=0; c < item.cantidad; c++) {
        flatItems.push({...item, cantidad: 1});
      }
    });

    const requiresConfig = flatItems.some(i => i.is_dinamico);
    
    if (requiresConfig) {
      setPaqueteAConfigurar({ ...paquete, itemsExpanded: flatItems });
      
      const initialSel = {};
      flatItems.forEach((item, idx) => {
        if (item.is_dinamico) {
           const opciones = menuProductos.filter(p => p.categoria_id?.toString() === item.categoria_id?.toString() && p.tamano_id?.toString() === item.tamano_id?.toString());
           if(opciones.length > 0) {
              const es_mitad = opciones[0].es_mitad_mitad;
              if (es_mitad) {
                 const opcionesMitad = menuProductos.filter(p => !p.es_mitad_mitad && p.categoria_id?.toString() === item.categoria_id?.toString() && p.tamano_id?.toString() === item.tamano_id?.toString());
                 initialSel[idx] = { base: opciones[0].presentacion_id.toString(), mitadA: opcionesMitad[0]?.presentacion_id.toString(), mitadB: opcionesMitad[1]?.presentacion_id.toString() };
              } else {
                 initialSel[idx] = { base: opciones[0].presentacion_id.toString() };
              }
           } else {
              initialSel[idx] = { base: '' };
           }
        }
      });
      setSeleccionesPaquete(initialSel);
      setComboConfigModalOpen(true);
    } else {
      const nuevoCombo = {
        tipo: 'PAQUETE',
        nombre: paquete.paquete_nombre,
        precio: parseFloat(paquete.precio_paquete),
        paquete_id: paquete.paquete_id,
        cantidad: 1,
        items: flatItems
      };
      setCarrito([...carrito, nuevoCombo]);
      setTotal(total + parseFloat(paquete.precio_paquete));
    }
  };

  const confirmarComboDinamico = () => {
    const finalItems = [];
    
    for (const [idx, item] of paqueteAConfigurar.itemsExpanded.entries()) {
      if (item.is_dinamico) {
         const sel = seleccionesPaquete[idx];
         if (!sel || !sel.base) return alert('Completa todas las opciones abiertas del combo');
         const productoBase = menuProductos.find(p => p.presentacion_id.toString() === sel.base.toString());
         if (!productoBase) return alert('Selección inválida en el combo');
         
         if (productoBase.es_mitad_mitad) {
             if (!sel.mitadA || !sel.mitadB) return alert('Completa las mitades requeridas para ' + productoBase.producto_nombre);
             const objA = menuProductos.find(p => p.presentacion_id.toString() === sel.mitadA.toString());
             const objB = menuProductos.find(p => p.presentacion_id.toString() === sel.mitadB.toString());
             finalItems.push({
               is_dinamico: false,
               presentacion_id: productoBase.presentacion_id,
               cantidad: 1,
               producto_nombre: `${productoBase.producto_nombre} - 1/2 ${objA.producto_nombre}, 1/2 ${objB.producto_nombre}`,
               presentacion_nombre: productoBase.presentacion_nombre
             });
         } else {
             finalItems.push({
               is_dinamico: false,
               presentacion_id: productoBase.presentacion_id,
               cantidad: 1,
               producto_nombre: productoBase.producto_nombre,
               presentacion_nombre: productoBase.presentacion_nombre
             });
         }
      } else {
         finalItems.push({ ...item });
      }
    }

    const nuevoCombo = {
      tipo: 'PAQUETE',
      nombre: paqueteAConfigurar.paquete_nombre,
      precio: parseFloat(paqueteAConfigurar.precio_paquete),
      paquete_id: paqueteAConfigurar.paquete_id,
      cantidad: 1,
      items: finalItems
    };
    
    setCarrito([...carrito, nuevoCombo]);
    setTotal(total + parseFloat(paqueteAConfigurar.precio_paquete));
    setComboConfigModalOpen(false);
  };

  const handleManejoSelectCombo = (idx, tipoCampo, valor, category_id, tamano_id) => {
     const nuevaSel = { ...seleccionesPaquete[idx] };
     nuevaSel[tipoCampo] = valor;
     
     if (tipoCampo === 'base') {
         const prodNuevo = menuProductos.find(p => p.presentacion_id?.toString() === valor?.toString());
         if (prodNuevo && prodNuevo.es_mitad_mitad) {
             const opcionesMitad = menuProductos.filter(p => !p.es_mitad_mitad && p.categoria_id?.toString() === category_id?.toString() && p.tamano_id?.toString() === tamano_id?.toString());
             nuevaSel.mitadA = opcionesMitad[0]?.presentacion_id.toString();
             nuevaSel.mitadB = opcionesMitad[1]?.presentacion_id.toString();
         } else {
             delete nuevaSel.mitadA;
             delete nuevaSel.mitadB;
         }
     } else if (tipoCampo === 'mitadA') {
         if (nuevaSel.mitadB === valor) {
             const opcionesMitad = menuProductos.filter(p => !p.es_mitad_mitad && p.categoria_id?.toString() === category_id?.toString() && p.tamano_id?.toString() === tamano_id?.toString());
             const availableB = opcionesMitad.filter(m => m.presentacion_id?.toString() !== valor);
             if (availableB.length > 0) nuevaSel.mitadB = availableB[0].presentacion_id.toString();
         }
     }
     setSeleccionesPaquete({ ...seleccionesPaquete, [idx]: nuevaSel });
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
      await axios.post('http://localhost:3000/api/pedidos', payload);
      
      // Activamos Success UI en lugar del alert nativo
      setOrderSuccess(true);
      
      // 3. Limpiamos la caja
      setCarrito([]);
      setTotal(0);

      // 4. Auto-ocultamos el modal después de 2.5 segundos para no interrumpir el flujo KDS
      setTimeout(() => setOrderSuccess(false), 2500);

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
            <div className="pos-empty-state">
              <div className="pos-empty-icon">🎁</div>
              <p className="pos-empty-title">Sin combos disponibles</p>
              <p className="pos-empty-sub">Crea combos desde el panel de administración</p>
            </div>
          )}
        </div>

        <h2 className="category-title">🍕 Pizzas y Snacks</h2>
        <div className="grid-menu">
          {menuProductos.length > 0 ? menuProductos.map((prod) => (
            <button key={`prod-${prod.presentacion_id}`} className="btn-item" onClick={() => handleProductClick(prod)}>
              {prod.producto_nombre} ({prod.presentacion_nombre}) <span>${parseFloat(prod.precio).toFixed(2)}</span>
            </button>
          )) : (
            <div className="pos-empty-state">
              <div className="pos-empty-icon pos-empty-pizza">🍕</div>
              <p className="pos-empty-title">Sin productos en el menú</p>
              <p className="pos-empty-sub">Añade pizzas y snacks desde el catálogo</p>
            </div>
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
            <div className="cart-empty">
              <div className="cart-empty-icon">🛒</div>
              <p className="cart-empty-title">Carrito vacío</p>
              <p className="cart-empty-sub">Selecciona productos del menú para comenzar el pedido</p>
            </div>
          ) : (
            carrito.map((item, index) => (
              <li key={index} className="cart-item">
                <div className="cart-item-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ color: item.tipo === 'PAQUETE' ? '#6c5ce7' : '#2d3436', marginRight: '10px' }}>
                      {item.cantidad}x {item.nombre}
                    </span>
                    <span style={{ fontWeight: 'bold' }}>${item.precio.toFixed(2)}</span>
                  </div>
                  <button 
                     className="btn-outline" 
                     onClick={() => eliminarDelCarrito(index)} 
                     style={{ padding: '2px 6px', fontSize: '12px', borderColor: 'var(--danger)', color: 'var(--danger)', cursor: 'pointer', background: 'transparent' }}
                     title="Eliminar del Carrito"
                  >
                     🗑️
                  </button>
                </div>
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
      {isModalOpen && productoMitadActual && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ marginTop: 0 }}>Armar {productoMitadActual.producto_nombre} ({productoMitadActual.presentacion_nombre})</h3>
            
            <label><strong>Mitad 1:</strong></label>
            <select value={saborA} onChange={(e) => {
                setSaborA(e.target.value);
                if (e.target.value === saborB) {
                    const ops = menuProductos.filter(p => !p.es_mitad_mitad && p.tamano_id === productoMitadActual.tamano_id && p.categoria === productoMitadActual.categoria && p.presentacion_id.toString() !== e.target.value);
                    if (ops.length > 0) setSaborB(ops[0].presentacion_id.toString());
                }
            }} style={{ width: '100%', marginBottom: '15px', padding: '10px' }}>
              {menuProductos.filter(p => !p.es_mitad_mitad && p.tamano_id === productoMitadActual.tamano_id && p.categoria === productoMitadActual.categoria).map(opt => (
                <option key={`a-${opt.presentacion_id}`} value={opt.presentacion_id}>
                  {opt.producto_nombre}
                </option>
              ))}
            </select>

            <label><strong>Mitad 2:</strong></label>
            <select value={saborB} onChange={(e) => setSaborB(e.target.value)} style={{ width: '100%', marginBottom: '20px', padding: '10px' }}>
              {menuProductos.filter(p => !p.es_mitad_mitad && p.tamano_id === productoMitadActual.tamano_id && p.categoria === productoMitadActual.categoria && p.presentacion_id.toString() !== saborA).map(opt => (
                <option key={`b-${opt.presentacion_id}`} value={opt.presentacion_id}>
                  {opt.producto_nombre}
                </option>
              ))}
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

      {/* MODAL CONFIGURADOR DE COMBO DINÁMICO */}
      {comboConfigModalOpen && paqueteAConfigurar && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <h3 style={{ marginTop: 0 }}>Armar Combo: {paqueteAConfigurar.paquete_nombre}</h3>
            
            <div style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: '15px' }}>
              {paqueteAConfigurar.itemsExpanded.map((item, idx) => {
                 if (!item.is_dinamico) {
                    return (
                       <div key={`fix-${idx}`} style={{ padding: '10px', borderBottom: '1px solid #ddd', color: '#555' }}>
                          ✔️ {item.producto_nombre} ({item.presentacion_nombre}) <small>- Fijo</small>
                       </div>
                    );
                 }

                 const opcionesBase = menuProductos.filter(p => p.categoria_id?.toString() === item.categoria_id?.toString() && p.tamano_id?.toString() === item.tamano_id?.toString());
                 const baseActual = seleccionesPaquete[idx]?.base;
                 const baseObj = menuProductos.find(p => p.presentacion_id?.toString() === baseActual?.toString());
                 const esMitad = baseObj && baseObj.es_mitad_mitad;
                 const opcionesMitad = menuProductos.filter(p => !p.es_mitad_mitad && p.categoria_id?.toString() === item.categoria_id?.toString() && p.tamano_id?.toString() === item.tamano_id?.toString());

                 return (
                    <div key={`dyn-${idx}`} style={{ padding: '10px', borderBottom: '1px solid #ddd', background: '#f8f9fa' }}>
                       <label style={{ display: 'block', marginBottom: '5px' }}>
                          <strong>Elegir: {item.producto_nombre} ({item.presentacion_nombre})</strong>
                       </label>
                       
                       <select 
                          value={baseActual || ''} 
                          onChange={(e) => handleManejoSelectCombo(idx, 'base', e.target.value, item.categoria_id, item.tamano_id)}
                          style={{ width: '100%', padding: '8px', marginBottom: esMitad ? '10px' : '0' }}
                       >
                         {opcionesBase.map(ob => (
                            <option key={`cbase-${ob.presentacion_id}`} value={ob.presentacion_id}>{ob.producto_nombre}</option>
                         ))}
                       </select>

                       {esMitad && (
                         <div style={{ display: 'flex', gap: '10px', marginTop: '5px', marginLeft: '15px', borderLeft: '2px solid #6c5ce7', paddingLeft: '10px' }}>
                            <div style={{ flex: 1 }}>
                               <small>Mitad 1:</small>
                               <select 
                                 value={seleccionesPaquete[idx]?.mitadA || ''} 
                                 onChange={(e) => handleManejoSelectCombo(idx, 'mitadA', e.target.value, item.categoria_id, item.tamano_id)}
                                 style={{ width: '100%', padding: '5px' }}
                               >
                                 {opcionesMitad.map(m => <option key={`mA-${m.presentacion_id}`} value={m.presentacion_id}>{m.producto_nombre}</option>)}
                               </select>
                            </div>
                            <div style={{ flex: 1 }}>
                               <small>Mitad 2:</small>
                               <select 
                                 value={seleccionesPaquete[idx]?.mitadB || ''} 
                                 onChange={(e) => handleManejoSelectCombo(idx, 'mitadB', e.target.value, item.categoria_id, item.tamano_id)}
                                 style={{ width: '100%', padding: '5px' }}
                               >
                                 {opcionesMitad.filter(m => m.presentacion_id?.toString() !== seleccionesPaquete[idx]?.mitadA).map(m => (
                                     <option key={`mB-${m.presentacion_id}`} value={m.presentacion_id}>{m.producto_nombre}</option>
                                 ))}
                               </select>
                            </div>
                         </div>
                       )}
                    </div>
                 );
              })}
            </div>

            <button className="btn-confirm" onClick={confirmarComboDinamico} style={{ background: '#6c5ce7' }}>
              Confirmar Combo
            </button>
            <button 
              className="btn-confirm" 
              style={{ backgroundColor: '#dfe6e9', color: '#2d3436' }} 
              onClick={() => setComboConfigModalOpen(false)}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* ======================================= */}
      {/* MODAL DE ÉXITO (AUTO-CIERRE)            */}
      {/* ======================================= */}
      {orderSuccess && (
        <div className="modal-overlay" style={{ zIndex: 9999, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(3px)' }}>
          <div className="modal-content" style={{ textAlign: 'center', maxWidth: '400px', padding: '40px 20px', borderRadius: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', animation: 'popIn 0.3s ease-out' }}>
            <div style={{ fontSize: '70px', marginBottom: '10px' }}>✅</div>
            <h2 style={{ color: '#00b894', margin: '0 0 10px 0', fontSize: '28px' }}>¡Pedido Cobrado!</h2>
            <p style={{ color: '#636e72', fontSize: '18px', marginBottom: '20px' }}>Enviado a cocina con éxito 🍕🧑‍🍳</p>
            <div style={{ width: '100%', height: '4px', background: '#ecf0f1', borderRadius: '2px', overflow: 'hidden', marginTop: '10px' }}>
                <div style={{ height: '100%', background: '#00b894', animation: 'progress 2.5s linear' }}></div>
            </div>
          </div>
          <style>{`
            @keyframes popIn { 0% { opacity: 0; transform: scale(0.8); } 100% { opacity: 1; transform: scale(1); } }
            @keyframes progress { 0% { width: 100%; } 100% { width: 0%; } }
          `}</style>
        </div>
      )}

    </div>
  );
};

export default PuntoVenta;

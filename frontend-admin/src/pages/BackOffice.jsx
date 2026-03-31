import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './BackOffice.css';

const BackOffice = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const activePath = location.pathname.substring(1) || 'dashboard'; // Quitamos el '/'

  // --- ESTADOS GLOBALES ---
  const [inventario, setInventario] = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [catalogo, setCatalogo] = useState([]);
  const [paquetes, setPaquetes] = useState([]);
  const [cargando, setCargando] = useState(false);
  
  // --- ESTADOS DEL MODAL DE INGREDIENTE ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nuevoIng, setNuevoIng] = useState({
    nombre: '', unidad_medida: 'gr', stock_actual: '', stock_minimo: '', costo_unitario: ''
  });

  // --- ESTADOS DEL MODAL RECETA (BOM) ---
  const [isRecetaModalOpen, setIsRecetaModalOpen] = useState(false);
  const [presentacionSeleccionada, setPresentacionSeleccionada] = useState(null);
  const [recetaActual, setRecetaActual] = useState([]);
  const [ingredienteTemporal, setIngredienteTemporal] = useState('');
  const [cantidadTemporal, setCantidadTemporal] = useState('');

  // --- ESTADOS DEL MODAL PAQUETES ---
  const [isPaqueteModalOpen, setIsPaqueteModalOpen] = useState(false);
  const [nuevoPaquete, setNuevoPaquete] = useState({ nombre: '', descripcion: '', precio_paquete: '' });
  const [itemsPaquete, setItemsPaquete] = useState([]);
  const [presentacionTemporal, setPresentacionTemporal] = useState('');
  const [cantidadItemTemporal, setCantidadItemTemporal] = useState('1');

  // --- CARGAR DATOS ---
  const fetchDatos = async () => {
    setCargando(true);
    try {
      const [resInv, resAle, resCat, resPaq] = await Promise.all([
        axios.get('http://localhost:3000/api/inventario'),
        axios.get('http://localhost:3000/api/inventario/alertas'),
        axios.get('http://localhost:3000/api/catalogo'),
        axios.get('http://localhost:3000/api/paquetes')
      ]);
      setInventario(resInv.data.data || []);
      setAlertas(resAle.data.data || []);
      setCatalogo(resCat.data.data || []);
      setPaquetes(resPaq.data.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    fetchDatos();
  }, []);

  // --- LÓGICA DE CRUD ---
  const handleCrearIngrediente = async () => {
    if(!nuevoIng.nombre) return alert('El nombre es obligatorio');
    
    try {
      await axios.post('http://localhost:3000/api/inventario', {
        ...nuevoIng,
        stock_actual: parseFloat(nuevoIng.stock_actual || 0),
        stock_minimo: parseFloat(nuevoIng.stock_minimo || 0),
        costo_unitario: parseFloat(nuevoIng.costo_unitario || 0)
      });
      alert('Ingrediente registrado con éxito');
      setIsModalOpen(false);
      setNuevoIng({ nombre: '', unidad_medida: 'gr', stock_actual: '', stock_minimo: '', costo_unitario: '' });
      fetchDatos(); // Recargar la tabla
    } catch (error) {
      alert('Error al guardar ingrediente');
    }
  };

  const handleAjustarStock = async (id, nombre, stockActual, unidad) => {
    const nuevoStock = prompt(`Ajustar stock físico para ${nombre}\n(Actual: ${stockActual} ${unidad})\n\nIngrese la nueva cantidad exacta:`);
    if (nuevoStock !== null && !isNaN(nuevoStock) && nuevoStock.trim() !== '') {
      try {
        await axios.patch(`http://localhost:3000/api/inventario/${id}/ajuste`, { nuevo_stock: parseFloat(nuevoStock) });
        fetchDatos(); // Recargar tabla
      } catch (error) {
        alert('Error al ajustar el stock');
      }
    }
  };

  // --- LÓGICA DE RECETAS ---
  const abrirModalReceta = (item) => {
    setPresentacionSeleccionada(item);
    setRecetaActual(item.ingredientes.map(ing => ({
      ingrediente_id: ing.ingrediente_id,
      nombre: ing.nombre,
      cantidad: parseFloat(ing.cantidad_requerida),
      unidad: ing.unidad_medida
    })));
    setIsRecetaModalOpen(true);
  };

  const agregarIngredienteAReceta = () => {
    if (!ingredienteTemporal || !cantidadTemporal) return alert('Selecciona ingrediente y cantidad');
    const ingInfo = inventario.find(i => i.id.toString() === ingredienteTemporal);
    if (!ingInfo) return;

    if (recetaActual.find(r => r.ingrediente_id === ingInfo.id)) {
      return alert('Este ingrediente ya está en la receta. Elimínalo primero para cambiar la cantidad.');
    }

    setRecetaActual([...recetaActual, {
      ingrediente_id: ingInfo.id,
      nombre: ingInfo.nombre,
      cantidad: parseFloat(cantidadTemporal),
      unidad: ingInfo.unidad_medida
    }]);
    setIngredienteTemporal(''); setCantidadTemporal('');
  };

  const quitarIngredienteDeReceta = (id) => {
    setRecetaActual(recetaActual.filter(r => r.ingrediente_id !== id));
  };

  const guardarRecetaEnBD = async () => {
    try {
      await axios.post(`http://localhost:3000/api/catalogo/${presentacionSeleccionada.presentacion_id}/receta`, {
        ingredientes: recetaActual
      });
      alert('Receta guardada. El inventario se descontará automáticamente.');
      setIsRecetaModalOpen(false);
      fetchDatos();
    } catch (error) {
      alert('Error al guardar la receta');
    }
  };

  // --- LÓGICA DE PAQUETES ---
  const agregarItemAPaquete = () => {
    if (!presentacionTemporal || !cantidadItemTemporal) return;
    const producto = catalogo.find(c => c.presentacion_id.toString() === presentacionTemporal);
    if (!producto) return;

    setItemsPaquete([...itemsPaquete, {
      presentacion_id: producto.presentacion_id,
      producto_nombre: producto.producto_nombre,
      presentacion_nombre: producto.presentacion_nombre,
      cantidad: parseInt(cantidadItemTemporal)
    }]);

    setPresentacionTemporal('');
    setCantidadItemTemporal('1');
  };

  const quitarItemDePaquete = (id) => {
    setItemsPaquete(itemsPaquete.filter(i => i.presentacion_id !== id));
  };

  const guardarPaqueteEnBD = async () => {
    if (!nuevoPaquete.nombre || !nuevoPaquete.precio_paquete || itemsPaquete.length === 0) {
      return alert('Completa el nombre, precio y agrega al menos un producto al combo.');
    }

    try {
      await axios.post('http://localhost:3000/api/paquetes', {
        ...nuevoPaquete,
        precio_paquete: parseFloat(nuevoPaquete.precio_paquete),
        items: itemsPaquete
      });
      alert('Combo creado con éxito. Ya está disponible para la venta.');
      setIsPaqueteModalOpen(false);
      setNuevoPaquete({ nombre: '', descripcion: '', precio_paquete: '' });
      setItemsPaquete([]);
      fetchDatos();
    } catch (error) {
      alert('Error al guardar el combo');
    }
  };

  return (
    <div className="admin-container">
      <div className="topbar">
        <div><strong>Sucursal:</strong> Centro Histórico</div>
        <div className="user-info">👤 Gerente: PauMag</div>
      </div>

      <div className="main-panel">
        {/* ================================== */}
        {/* VISTA 1: DASHBOARD                 */}
        {/* ================================== */}
        {activePath === 'dashboard' && (
          <>
            <h1 style={{ marginTop: 0 }}>Resumen Operativo</h1>
            <div className="card-grid">
              <div className="stat-card">
                <h3>Ventas del Día</h3>
                <p className="value">$0.00</p>
              </div>
              <div className="stat-card">
                <h3>Ingredientes Activos</h3>
                <p className="value">{inventario.length}</p>
              </div>
              <div className={`stat-card ${alertas.length > 0 ? 'alert' : ''}`}>
                <h3 style={{ color: alertas.length > 0 ? '#e74c3c' : '' }}>Alertas de Inventario</h3>
                <p className="value" style={{ color: alertas.length > 0 ? '#e74c3c' : '#2ecc71' }}>
                  {alertas.length > 0 ? `⚠️ ${alertas.length} Críticos` : '✅ Óptimo'}
                </p>
                {alertas.length > 0 && <p style={{ margin: '10px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>Requieren reabastecimiento urgente.</p>}
              </div>
            </div>

            {alertas.length > 0 && (
              <div className="table-container" style={{ border: '2px solid var(--danger)' }}>
                <div className="table-header" style={{ backgroundColor: '#fff5f5' }}>
                  <h2 style={{ color: 'var(--danger)' }}>Ingredientes por Agotarse (Stock Mínimo)</h2>
                  <button className="btn btn-primary" onClick={() => navigate('/inventario')}>Ir a Inventario</button>
                </div>
                <table>
                  <thead>
                    <tr><th>Ingrediente</th><th>Stock Actual</th><th>Stock Mínimo Configurado</th><th>Estado</th></tr>
                  </thead>
                  <tbody>
                    {alertas.map(item => (
                      <tr key={item.id}>
                        <td><strong>{item.nombre}</strong></td>
                        <td style={{ color: 'var(--danger)', fontWeight: 'bold' }}>{item.stock_actual} {item.unidad_medida}</td>
                        <td>{item.stock_minimo} {item.unidad_medida}</td>
                        <td><span className="status-badge status-low">CRÍTICO</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* ================================== */}
        {/* VISTA 2: INVENTARIO (CRUD)         */}
        {/* ================================== */}
        {activePath === 'inventario' && (
          <>
            <h1 style={{ marginTop: 0 }}>Gestión de Materia Prima</h1>
            <div className="table-container">
              <div className="table-header">
                <h2>Catálogo de Ingredientes</h2>
                <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
                  + Nuevo Ingrediente
                </button>
              </div>
              <table>
                <thead>
                  <tr><th>ID</th><th>Nombre</th><th>Unidad</th><th>Stock Actual</th><th>Stock Mín.</th><th>Estado</th><th>Acciones</th></tr>
                </thead>
                <tbody>
                  {inventario.map(item => {
                    const esCritico = parseFloat(item.stock_actual) <= parseFloat(item.stock_minimo);
                    return (
                      <tr key={item.id}>
                        <td>#{item.id}</td>
                        <td><strong>{item.nombre}</strong></td>
                        <td>{item.unidad_medida}</td>
                        <td style={{ color: esCritico ? 'var(--danger)' : '', fontWeight: esCritico ? 'bold' : 'normal' }}>
                          {item.stock_actual} {item.unidad_medida}
                        </td>
                        <td>{item.stock_minimo} {item.unidad_medida}</td>
                        <td>
                          {esCritico ? <span className="status-badge status-low">REORDENAR</span> : <span className="status-badge status-ok">ÓPTIMO</span>}
                        </td>
                        <td>
                          <button 
                            className="btn btn-outline"
                            onClick={() => handleAjustarStock(item.id, item.nombre, item.stock_actual, item.unidad_medida)}
                          >
                            ± Ajustar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ================================== */}
        {/* VISTA 3: RECETAS (Placeholder)     */}
        {/* ================================== */}
        {activePath === 'catalogo' && (
          <>
            <h1 style={{ marginTop: 0 }}>Productos y BOM (Recetas)</h1>
            <p style={{ color: 'var(--text-muted)' }}>Mapeo Maestro: Vincula los productos de venta final con tus ingredientes para el descuento automático de inventario.</p>
            <div className="table-container">
              <div className="table-header">
                <h2>Pizzas y Snacks (Catálogo de Venta)</h2>
                <button className="btn btn-primary">+ Nuevo Producto Venta</button>
              </div>
              <table>
                <thead>
                  <tr><th>Categoría</th><th>Producto</th><th>Tamaño / Presentación</th><th>Precio Base</th><th>Estado Receta (BOM)</th><th>Acciones</th></tr>
                </thead>
                <tbody>
                  {catalogo.map((item, idx) => (
                    <tr key={idx}>
                      <td><span className="status-badge" style={{background:'#e0e0e0', color:'#333'}}>{item.categoria_nombre}</span></td>
                      <td><strong>{item.producto_nombre}</strong></td>
                      <td>{item.presentacion_nombre}</td>
                      <td>${parseFloat(item.precio).toFixed(2)}</td>
                      <td>
                        {item.ingredientes.length > 0 
                          ? <span className="status-badge status-ok">{item.ingredientes.length} Ingredientes</span>
                          : <span className="status-badge status-low">Sin Configurar</span>
                        }
                      </td>
                      <td>
                        <button 
                          className="btn btn-outline"
                          onClick={() => abrirModalReceta(item)}
                        >
                          ✏️ Armar Receta
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        
        {/* ================================== */}
        {/* VISTA 4: PAQUETES (Placeholder)    */}
        {/* ================================== */}
        {activePath === 'paquetes' && (
          <>
            <h1 style={{ marginTop: 0 }}>Configurador de Paquetes</h1>
            <p style={{ color: 'var(--text-muted)' }}>Crea contenedores que agrupan varios productos bajo un solo precio.</p>
            <div className="table-container">
              <div className="table-header">
                <h2>Combos y Paquetes Activos</h2>
                <button className="btn btn-primary" onClick={() => setIsPaqueteModalOpen(true)}>
                  + Armar Nuevo Combo
                </button>
              </div>
              <table>
                <thead>
                  <tr><th>Nombre del Combo</th><th>Precio</th><th>Productos Incluidos</th><th>Estado</th></tr>
                </thead>
                <tbody>
                  {paquetes.map((paq, idx) => (
                    <tr key={idx}>
                      <td><strong>{paq.paquete_nombre}</strong></td>
                      <td style={{ color: 'var(--primary)', fontWeight: 'bold' }}>${parseFloat(paq.precio_paquete).toFixed(2)}</td>
                      <td>
                        <ul style={{ margin: 0, paddingLeft: '15px', fontSize: '13px', color: 'var(--text-main)' }}>
                          {paq.items.map((item, i) => (
                            <li key={i}>{item.cantidad}x {item.producto_nombre} ({item.presentacion_nombre})</li>
                          ))}
                        </ul>
                      </td>
                      <td><span className="status-badge status-ok">Activo</span></td>
                    </tr>
                  ))}
                  {paquetes.length === 0 && (
                    <tr><td colSpan="4" style={{ textAlign: 'center', padding: '30px' }}>No hay combos registrados.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* ================================== */}
      {/* MODAL DE NUEVO INGREDIENTE         */}
      {/* ================================== */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h2 style={{ marginTop: 0, borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>Registrar Materia Prima</h2>
            
            <div className="form-group">
              <label>Nombre del Ingrediente</label>
              <input type="text" value={nuevoIng.nombre} onChange={(e) => setNuevoIng({...nuevoIng, nombre: e.target.value})} placeholder="Ej. Champiñones" />
            </div>

            <div style={{ display: 'flex', gap: '15px' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Unidad de Medida</label>
                <select value={nuevoIng.unidad_medida} onChange={(e) => setNuevoIng({...nuevoIng, unidad_medida: e.target.value})}>
                  <option value="gr">Gramos (gr)</option>
                  <option value="kg">Kilogramos (kg)</option>
                  <option value="ml">Mililitros (ml)</option>
                  <option value="lt">Litros (lt)</option>
                  <option value="pza">Piezas (pza)</option>
                </select>
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Costo Unitario ($)</label>
                <input type="number" value={nuevoIng.costo_unitario} onChange={(e) => setNuevoIng({...nuevoIng, costo_unitario: e.target.value})} placeholder="0.00" />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '15px' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Stock de Entrada Inicial</label>
                <input type="number" value={nuevoIng.stock_actual} onChange={(e) => setNuevoIng({...nuevoIng, stock_actual: e.target.value})} placeholder="0" />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Stock Mínimo (Alerta)</label>
                <input type="number" value={nuevoIng.stock_minimo} onChange={(e) => setNuevoIng({...nuevoIng, stock_minimo: e.target.value})} placeholder="0" />
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleCrearIngrediente}>Guardar Ingrediente</button>
            </div>
          </div>
        </div>
      )}

      {/* ================================== */}
      {/* MODAL: EDITOR DE RECETA (BOM)      */}
      {/* ================================== */}
      {isRecetaModalOpen && (
        <div className="modal-overlay">
          <div className="modal" style={{ width: '600px', maxWidth: '95%' }}>
            <h2 style={{ marginTop: 0, borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
              Receta: {presentacionSeleccionada?.producto_nombre} ({presentacionSeleccionada?.presentacion_nombre})
            </h2>
            
            {/* Lista actual de la receta */}
            <div style={{ background: '#f9f9f9', padding: '15px', borderRadius: '8px', marginBottom: '20px', minHeight: '100px' }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#555' }}>Ingredientes que componen este producto:</h4>
              {recetaActual.length === 0 ? (
                <p style={{ color: 'var(--danger)', fontSize: '13px', margin: 0 }}>Alerta: No hay ingredientes. El inventario no se descontará en la venta.</p>
              ) : (
                <ul style={{ paddingLeft: '20px', margin: 0 }}>
                  {recetaActual.map(ing => (
                    <li key={ing.ingrediente_id} style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span><strong>{ing.cantidad} {ing.unidad}</strong> de {ing.nombre}</span>
                      <button className="btn" onClick={() => quitarIngredienteDeReceta(ing.ingrediente_id)} style={{ background: 'var(--danger)', color: 'white', padding: '2px 8px' }}>×</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Formulario para agregar ingrediente */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', marginBottom: '20px' }}>
              <div className="form-group" style={{ flex: 2, marginBottom: 0 }}>
                <label>Materia Prima</label>
                <select value={ingredienteTemporal} onChange={e => setIngredienteTemporal(e.target.value)}>
                  <option value="">-- Seleccionar --</option>
                  {inventario.map(inv => (
                    <option key={inv.id} value={inv.id}>{inv.nombre} ({inv.unidad_medida})</option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                <label>Cantidad</label>
                <input type="number" value={cantidadTemporal} onChange={e => setCantidadTemporal(e.target.value)} placeholder="Ej. 150" />
              </div>
              <button className="btn btn-outline" onClick={agregarIngredienteAReceta}>Añadir</button>
            </div>

            {/* Acciones */}
            <div className="modal-actions" style={{ borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
              <button className="btn btn-outline" onClick={() => setIsRecetaModalOpen(false)}>Cerrar</button>
              <button className="btn btn-primary" onClick={guardarRecetaEnBD}>Guardar Receta BOM</button>
            </div>
          </div>
        </div>
      )}

      {/* ================================== */}
      {/* MODAL DE NUEVO COMBO / PAQUETE     */}
      {/* ================================== */}
      {isPaqueteModalOpen && (
        <div className="modal-overlay">
          <div className="modal" style={{ width: '600px', maxWidth: '95%' }}>
            <h2 style={{ marginTop: 0, borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>Armar Nuevo Combo</h2>
            
            <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
              <div className="form-group" style={{ flex: 2, marginBottom: 0 }}>
                <label>Nombre Público</label>
                <input type="text" value={nuevoPaquete.nombre} onChange={e => setNuevoPaquete({...nuevoPaquete, nombre: e.target.value})} placeholder="Ej. Combo Familiar" />
              </div>
              <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                <label>Precio ($)</label>
                <input type="number" value={nuevoPaquete.precio_paquete} onChange={e => setNuevoPaquete({...nuevoPaquete, precio_paquete: e.target.value})} placeholder="250.00" />
              </div>
            </div>

            <div style={{ background: '#f9f9f9', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#555' }}>Productos Incluidos:</h4>
              {itemsPaquete.length === 0 ? <p style={{ fontSize: '13px', margin: 0, color: 'var(--danger)' }}>Aún no has agregado productos al combo.</p> : null}
              <ul style={{ paddingLeft: '20px', margin: 0 }}>
                {itemsPaquete.map(item => (
                  <li key={item.presentacion_id} style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{item.cantidad}x <strong>{item.producto_nombre}</strong> ({item.presentacion_nombre})</span>
                    <button className="btn" onClick={() => quitarItemDePaquete(item.presentacion_id)} style={{ padding: '2px 8px', background: 'var(--danger)', color: 'white' }}>×</button>
                  </li>
                ))}
              </ul>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', marginBottom: '20px' }}>
              <div className="form-group" style={{ flex: 2, marginBottom: 0 }}>
                <label>Agregar Producto al Combo</label>
                <select value={presentacionTemporal} onChange={e => setPresentacionTemporal(e.target.value)}>
                  <option value="">-- Seleccionar del Catálogo --</option>
                  {catalogo.map(cat => (
                    <option key={cat.presentacion_id} value={cat.presentacion_id}>{cat.producto_nombre} - {cat.presentacion_nombre}</option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                <label>Cant.</label>
                <input type="number" value={cantidadItemTemporal} onChange={e => setCantidadItemTemporal(e.target.value)} />
              </div>
              <button className="btn btn-outline" onClick={agregarItemAPaquete}>Añadir</button>
            </div>

            <div className="modal-actions" style={{ borderTop: '1px solid var(--border)', paddingTop: '15px' }}>
              <button className="btn btn-outline" onClick={() => setIsPaqueteModalOpen(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={guardarPaqueteEnBD}>💾 Guardar Combo</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default BackOffice;

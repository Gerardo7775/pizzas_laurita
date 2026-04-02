import { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import './BackOffice.css';

// --- Utilidad: Similitud entre dos strings (0 a 1) ---
const normalizar = (str) => str
  .toLowerCase()
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // quita acentos
  .replace(/[^a-z0-9 ]/g, '').trim();

const similitud = (a, b) => {
  const na = normalizar(a);
  const nb = normalizar(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.9;
  // Bigrama: porcentaje de bigramas compartidos
  const bigramas = (s) => {
    const bg = new Set();
    for (let i = 0; i < s.length - 1; i++) bg.add(s[i] + s[i+1]);
    return bg;
  };
  const ba = bigramas(na);
  const bb = bigramas(nb);
  const interseccion = [...ba].filter(x => bb.has(x)).length;
  const union = new Set([...ba, ...bb]).size;
  return union === 0 ? 0 : interseccion / union;
};

const BackOffice = () => {
  const API_URL = import.meta.env.VITE_API_URL;

  const location = useLocation();
  const navigate = useNavigate();
  const activePath = location.pathname.substring(1) || 'dashboard'; // Quitamos el '/'

  // --- ESTADOS GLOBALES ---
  const [inventario, setInventario] = useState([]);
  const [busquedaInventario, setBusquedaInventario] = useState('');
  const [alertas, setAlertas] = useState([]);
  const [catalogo, setCatalogo] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [tamanos, setTamanos] = useState([]);
  const [paquetes, setPaquetes] = useState([]);
  const [ventasDia, setVentasDia] = useState(0);
  const [cargando, setCargando] = useState(false);
  
  // --- ESTADOS DEL MODAL PRODUCTO ---
  const [isProductoModalOpen, setIsProductoModalOpen] = useState(false);
  const [nuevoProducto, setNuevoProducto] = useState({
    producto_id: null,
    presentacion_id: null,
    nombre: '',
    categoria_id: '',
    tamano_id: '',
    precio: '',
    es_mitad_mitad: false
  });

  // --- ESTADOS DEL MODAL RECETA (BOM) ---
  const [isRecetaModalOpen, setIsRecetaModalOpen] = useState(false);
  const [presentacionAEditar, setPresentacionAEditar] = useState(null); 
  const [ingredientesReceta, setIngredientesReceta] = useState([]);
  const [busquedaBom, setBusquedaBom] = useState('');
  const [cantidadBomItem, setCantidadBomItem] = useState('');
  const [ingredienteBomSeleccionado, setIngredienteBomSeleccionado] = useState('');
  const [recetaClonSeleccionada, setRecetaClonSeleccionada] = useState('');
  
  // --- ESTADOS DE NOTIFICACIONES (reemplazan alert/prompt nativos) ---
  const [toast, setToast] = useState(null); // { type: 'success'|'error'|'warning', message }
  const [inputModal, setInputModal] = useState(null); // { title, description, placeholder, onConfirm }
  const [inputModalValue, setInputModalValue] = useState('');

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const showInputModal = (title, description, placeholder, onConfirm, inputType = 'number', defaultValue = '') => {
    setInputModalValue(defaultValue);
    setInputModal({ title, description, placeholder, onConfirm, inputType });
  };

  // --- ESTADOS DEL MODAL DE INGREDIENTE ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nuevoIng, setNuevoIng] = useState({
    nombre: '', 
    unidad_compra: 'Barra',
    unidad_receta: 'gr',
    factor_conversion: '',
    stock_actual_receta: '',
    stock_minimo: '',
    costo_unitario: ''
  });
  const [editandoIng, setEditandoIng] = useState(null); // ingrediente completo al editar
  const [confirmDialog, setConfirmDialog] = useState(null); // { title, message, onConfirm }

  // Ingredientes similares en tiempo real (al escribir el nombre)
  const similares = useMemo(() => {
    const query = nuevoIng.nombre.trim();
    if (query.length < 3) return [];
    return inventario
      .map(ing => ({ ...ing, score: similitud(query, ing.nombre) }))
      .filter(ing => ing.score > 0.45)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }, [nuevoIng.nombre, inventario]);

  // --- ESTADOS DEL MODAL PAQUETES ---
  const [isPaqueteModalOpen, setIsPaqueteModalOpen] = useState(false);
  const [nuevoPaquete, setNuevoPaquete] = useState({ nombre: '', descripcion: '', precio_paquete: '' });
  const [itemsPaquete, setItemsPaquete] = useState([]);
  const [presentacionTemporal, setPresentacionTemporal] = useState('');
  const [cantidadItemTemporal, setCantidadItemTemporal] = useState('1');

  // --- ESTADOS PARA MULTI-DROPDOWN INTELIGENTE DE COMBOS ---
  const [comboSearchQuery, setComboSearchQuery] = useState('');
  const [showComboDropdown, setShowComboDropdown] = useState(false);
  const comboDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (comboDropdownRef.current && !comboDropdownRef.current.contains(event.target)) {
        setShowComboDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => { document.removeEventListener('mousedown', handleClickOutside); };
  }, []);

  const comodinesFiltrados = useMemo(() => {
    const arr = [];
    categorias.forEach(cat => tamanos.forEach(tam => {
      const nombreDinamico = `Cualquier ${cat.nombre} - ${tam.nombre}`;
      if (nombreDinamico.toLowerCase().includes(comboSearchQuery.toLowerCase())) {
        arr.push({ id: `DYN_${cat.id}_${tam.id}`, label: nombreDinamico });
      }
    }));
    return arr;
  }, [comboSearchQuery, categorias, tamanos]);

  const fijosFiltrados = useMemo(() => {
    return catalogo
      .filter(p => `${p.producto_nombre} ${p.presentacion_nombre}`.toLowerCase().includes(comboSearchQuery.toLowerCase()))
      .map(p => ({ id: p.presentacion_id.toString(), label: `${p.producto_nombre} - ${p.presentacion_nombre}` }));
  }, [comboSearchQuery, catalogo]);

  const handleSelectComboItem = (id, label) => {
     setPresentacionTemporal(id);
     setComboSearchQuery(label); // Mostramos el label bonito en el input visual
     setShowComboDropdown(false);
  };

  // --- CARGAR DATOS ---
  const fetchVentasDia = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/pedidos/historial`);
      if (res.data.success) {
        const pedidos = res.data.data.pedidos || [];
        const hoyStr = new Date().toDateString();
        const suma = pedidos.reduce((acc, p) => {
          if (new Date(p.fecha_creacion).toDateString() === hoyStr && p.estado !== 'CANCELADO') {
            return acc + parseFloat(p.total);
          }
          return acc;
        }, 0);
        setVentasDia(suma);
      }
    } catch (error) {
       console.warn('Error al calcular ventas del día', error);
    }
  };

  const fetchDatos = async () => {
    setCargando(true);
    try {
      fetchVentasDia(); // Parcial
      // Usamos allSettled: si una falla, las demás siguen actualizando la UI
      const [resInv, resAle, resCat, resPaq, resCategorias, resTamanos] = await Promise.allSettled([
        axios.get(`${API_URL}/api/inventario`),
        axios.get(`${API_URL}/api/inventario/alertas`),
        axios.get(`${API_URL}/api/catalogo`),
        axios.get(`${API_URL}/api/paquetes`),
        axios.get(`${API_URL}/api/catalogo/categorias`),
        axios.get(`${API_URL}/api/catalogo/tamanos`)
      ]);

      if (resInv.status === 'fulfilled')  setInventario(resInv.value.data.data || []);
      if (resAle.status === 'fulfilled')  setAlertas(resAle.value.data.data || []);
      if (resCat.status === 'fulfilled')  setCatalogo(resCat.value.data.data || []);
      if (resPaq.status === 'fulfilled')  setPaquetes(resPaq.value.data.data || []);
      if (resCategorias.status === 'fulfilled') {
        const cats = resCategorias.value.data.data || [];
        setCategorias(cats);
        // Defaults en cascada
        if (cats.length > 0) setNuevoProducto(prev => ({ ...prev, categoria_id: cats[0].id }));
      }
      if (resTamanos.status === 'fulfilled') {
        const tams = resTamanos.value.data.data || [];
        setTamanos(tams);
        if (tams.length > 0) setNuevoProducto(prev => ({ ...prev, tamano_id: tams[0].id }));
      }

      // Log de errores individuales sin romper la UI
      [resInv, resAle, resCat, resPaq, resCategorias, resTamanos].forEach((res, i) => {
        if (res.status === 'rejected') {
          console.warn(`API fallo en petición ${i}:`, res.reason?.message);
        }
      });
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    fetchDatos();

    // WebSocket para recargar inventario al despachar pedidos
    const token = localStorage.getItem('token');
    const socket = io(API_URL, {
      auth: { token }
    });
    
    socket.on('stock_actualizado', async () => {
      // Recargar solo el stock sin mostrar spinner completo
      try {
        const [resInv, resAle] = await Promise.all([
          axios.get(`${API_URL}/api/inventario`),
          axios.get(`${API_URL}/api/inventario/alertas`)
        ]);
        setInventario(resInv.data.data || []);
        setAlertas(resAle.data.data || []);
      } catch (e) {
        console.warn('Error al actualizar inventario vía socket', e);
      }
    });

    socket.on('nuevo_pedido_cocina', fetchVentasDia);
    socket.on('estado_pedido_actualizado', fetchVentasDia);

    return () => socket.disconnect();
  }, []);

  // --- LÓGICA DE CRUD ---
  const handleCrearIngrediente = async () => {
    if (!nuevoIng.nombre) return showToast('El nombre del ingrediente es obligatorio.', 'warning');
    if (!nuevoIng.factor_conversion || parseFloat(nuevoIng.factor_conversion) <= 0) {
      return showToast('El factor de conversión debe ser numérico y mayor a 0.', 'warning');
    }
    // Bloquear si hay un duplicado muy parecido (≥95% de similitud)
    const duplicado = similares.find(s => s.score >= 0.95);
    if (duplicado) {
      return showToast(`Ya existe "${duplicado.nombre}". Revisa si es el mismo ingrediente.`, 'error');
    }
    try {
      await axios.post(`${API_URL}/api/inventario`, {
        nombre:               nuevoIng.nombre,
        unidad_compra:        nuevoIng.unidad_compra,
        unidad_receta:        nuevoIng.unidad_receta,
        factor_conversion:    parseFloat(nuevoIng.factor_conversion),
        stock_actual_receta:  parseFloat(nuevoIng.stock_actual_receta || 0),
        stock_minimo:         parseFloat(nuevoIng.stock_minimo || 0),
        costo_unitario:       parseFloat(nuevoIng.costo_unitario || 0)
      });
      showToast('Ingrediente registrado con éxito 🎉');
      setIsModalOpen(false);
      setNuevoIng({ nombre: '', unidad_compra: 'Barra', unidad_receta: 'gr', factor_conversion: '', stock_actual_receta: '', stock_minimo: '', costo_unitario: '' });
      fetchDatos();
    } catch (error) {
      showToast('Error al guardar el ingrediente', 'error');
    }
  };

  const handleAbrirEditar = (item) => {
    setEditandoIng({
      id:                item.id,
      nombre:            item.nombre,
      unidad_compra:     item.unidad_compra,
      unidad_receta:     item.unidad_receta,
      factor_conversion: item.factor_conversion,
      stock_minimo:      item.stock_minimo,
      costo_unitario:    item.costo_unitario
    });
  };

  const handleGuardarEdicion = async () => {
    if (!editandoIng.nombre) return showToast('El nombre es obligatorio.', 'warning');
    try {
      await axios.put(`${API_URL}/api/inventario/${editandoIng.id}`, {
        nombre:            editandoIng.nombre,
        unidad_compra:     editandoIng.unidad_compra,
        unidad_receta:     editandoIng.unidad_receta,
        factor_conversion: parseFloat(editandoIng.factor_conversion),
        stock_minimo:      parseFloat(editandoIng.stock_minimo || 0),
        costo_unitario:    parseFloat(editandoIng.costo_unitario || 0)
      });
      showToast('Ingrediente actualizado correctamente ✅');
      setEditandoIng(null);
      fetchDatos();
    } catch (error) {
      showToast('Error al actualizar el ingrediente', 'error');
    }
  };

  const handleEliminar = async (ing) => {
    setConfirmDialog({
      title: '¿Eliminar ingrediente?',
      message: `Estás a punto de eliminar "${ing.nombre}" del inventario.\nEsta acción no se puede deshacer.`,
      onConfirm: async () => {
        try {
          await axios.delete(`${API_URL}/api/inventario/${ing.id}`);
          showToast(`"${ing.nombre}" eliminado correctamente 🗑️`);
          fetchDatos();
        } catch (error) {
          showToast(error.response?.data?.message || 'Error al eliminar el ingrediente', 'error');
        }
      }
    });
  };

  const handleAjustarStock = (id, nombre, stockActual, unidadReceta) => {
    showInputModal(
      `± Ajuste Manual de Stock`,
      `Ingrediente: **${nombre}**\nStock actual: ${parseFloat(stockActual).toFixed(0)} ${unidadReceta}\n\nIngresa la cantidad EXACTA que hay físicamente ahora (en ${unidadReceta}):`,
      `Ej. ${parseFloat(stockActual).toFixed(0)}`,
      async (valor, closeModal) => {
        if (!isNaN(valor) && valor.trim() !== '') {
          try {
            await axios.patch(`${API_URL}/api/inventario/${id}/ajuste`, { nuevo_stock: parseFloat(valor) });
            showToast(`Stock de ${nombre} ajustado a ${valor} ${unidadReceta}`);
            fetchDatos();
            closeModal();
          } catch {
            showToast('Error al ajustar el stock', 'error');
          }
        } else {
          showToast('Ingresa un valor numérico válido', 'warning');
        }
      }
    );
  };

  const handleRegistrarCompra = (id, nombre, unidadCompra, factorConversion, unidadReceta) => {
    showInputModal(
      `📦 Ingreso de Almacén`,
      `Ingrediente: **${nombre}**\n\n¿Cuántas [${unidadCompra}] recibió del proveedor?\n1 ${unidadCompra} = ${factorConversion} ${unidadReceta}`,
      `Ej. 2`,
      async (valor, closeModal) => {
        if (!isNaN(valor) && parseFloat(valor) > 0) {
          try {
            const res = await axios.post(`${API_URL}/api/inventario/${id}/compra`, { cantidad_comprada: parseFloat(valor) });
            showToast(res.data.message + ' 📦');
            fetchDatos();
            closeModal();
          } catch {
            showToast('Error al registrar la compra', 'error');
          }
        } else {
          showToast('Ingresa una cantidad comprada válida', 'warning');
        }
      }
    );
  };

  // --- LÓGICA DE PAQUETES ---
  const agregarItemAPaquete = () => {
    if (!presentacionTemporal || !cantidadItemTemporal) return;
    
    if (presentacionTemporal.startsWith('DYN_')) {
      const [_, catId, tamId] = presentacionTemporal.split('_');
      const categoria = categorias.find(c => c.id.toString() === catId.toString());
      const tamano = tamanos.find(t => t.id.toString() === tamId.toString());
      if (!categoria || !tamano) return;
      
      setItemsPaquete([...itemsPaquete, {
        unique_id: Date.now() + Math.random(),
        is_dinamico: true,
        categoria_id: categoria.id,
        tamano_id: tamano.id,
        presentacion_id: null,
        producto_nombre: `(Comodín) Cualquier ${categoria.nombre}`,
        presentacion_nombre: tamano.nombre,
        cantidad: parseInt(cantidadItemTemporal)
      }]);
    } else {
      const producto = catalogo.find(c => c.presentacion_id.toString() === presentacionTemporal);
      if (!producto) return;

      setItemsPaquete([...itemsPaquete, {
        unique_id: Date.now() + Math.random(),
        is_dinamico: false,
        presentacion_id: producto.presentacion_id,
        producto_nombre: producto.producto_nombre,
        presentacion_nombre: producto.presentacion_nombre,
        cantidad: parseInt(cantidadItemTemporal)
      }]);
    }

    setPresentacionTemporal('');
    setComboSearchQuery('');
    setCantidadItemTemporal('1');
  };

  const quitarItemDePaquete = (uid) => {
    setItemsPaquete(itemsPaquete.filter(i => i.unique_id !== uid));
  };

  const guardarPaqueteEnBD = async () => {
    if (!nuevoPaquete.nombre || !nuevoPaquete.precio_paquete || itemsPaquete.length === 0) {
      return showToast('Completa el nombre del paquete, su precio y agrega al menos un producto.', 'warning');
    }
    try {
      const payload = {
        nombre: nuevoPaquete.nombre,
        descripcion: nuevoPaquete.descripcion || '',
        precio_paquete: parseFloat(nuevoPaquete.precio_paquete),
        items: itemsPaquete
      };

      if (nuevoPaquete.id) {
         await axios.put(`${API_URL}/api/paquetes/${nuevoPaquete.id}`, payload);
         showToast('Combo actualizado correctamente. ✏️');
      } else {
         await axios.post(`${API_URL}/api/paquetes`, payload);
         showToast('Combo creado. Ya está disponible para la venta. 🎉');
      }

      setIsPaqueteModalOpen(false);
      setNuevoPaquete({ id: null, nombre: '', descripcion: '', precio_paquete: '' });
      setItemsPaquete([]);
      fetchDatos();
    } catch (error) {
      showToast('Error al guardar el combo', 'error');
    }
  };

  const handleEditarPaquete = (paq) => {
    setNuevoPaquete({
      id: paq.paquete_id,
      nombre: paq.paquete_nombre,
      descripcion: paq.paquete_descripcion || '',
      precio_paquete: paq.precio_paquete
    });
    
    // Convertir de lectura a items interactivos
    const loadedItems = paq.items.map((it, idx) => ({
       unique_id: Date.now() + Math.random() + idx,
       is_dinamico: it.is_dinamico,
       presentacion_id: it.presentacion_id,
       categoria_id: it.categoria_id,
       tamano_id: it.tamano_id,
       producto_nombre: it.producto_nombre,
       presentacion_nombre: it.presentacion_nombre,
       cantidad: it.cantidad
    }));

    setItemsPaquete(loadedItems);
    setIsPaqueteModalOpen(true);
  };

  const handleEliminarPaquete = (paq) => {
    setConfirmDialog({
      title: '¿Eliminar Combo?',
      message: `Estás a punto de eliminar "${paq.paquete_nombre}".\nEsta acción no se puede deshacer y el combo dejará de estar disponible en Caja.`,
      isDanger: true,
      confirmText: 'Sí, Eliminar Definitivamente',
      onConfirm: async () => {
        try {
          await axios.delete(`${API_URL}/api/paquetes/${paq.paquete_id}`);
          showToast(`"${paq.paquete_nombre}" eliminado de los combos 🗑️`);
          fetchDatos();
        } catch (error) {
          showToast(error.response?.data?.message || 'Error al eliminar el combo', 'error');
        }
      }
    });
  };

  const handleCrearProducto = async () => {
    if (!nuevoProducto.nombre.trim() || !nuevoProducto.categoria_id || !nuevoProducto.tamano_id || nuevoProducto.precio === '') {
      return showToast('Por favor llena todos los campos obligatorios (*).', 'warning');
    }

    // 1. Bloquear duplicados
    const isEdit = nuevoProducto.producto_id !== null;
    const tamanoObj = tamanos.find(t => t.id.toString() === nuevoProducto.tamano_id.toString());
    const matchExacto = catalogo.find(
      p => normalizar(p.producto_nombre) === normalizar(nuevoProducto.nombre) && 
           p.tamano_id === tamanoObj?.id && 
           p.presentacion_id !== nuevoProducto.presentacion_id
    );
    if (matchExacto) {
      return showToast(`El producto "${matchExacto.producto_nombre}" en tamaño "${matchExacto.presentacion_nombre}" ya existe.`, 'warning');
    }

    try {
      const payload = {
        ...nuevoProducto,
        precio: parseFloat(nuevoProducto.precio)
      };

      if (isEdit) {
        await axios.put(`${API_URL}/api/catalogo/productos/${nuevoProducto.producto_id}/presentaciones/${nuevoProducto.presentacion_id}`, payload);
        showToast('Producto actualizado en catálogo correctamente ✏️');
      } else {
        await axios.post(`${API_URL}/api/catalogo/productos`, payload);
        showToast('Producto añadido al catálogo correctamente 🎉');
      }

      setIsProductoModalOpen(false);
      setNuevoProducto({ producto_id: null, presentacion_id: null, nombre: '', categoria_id: categorias.length > 0 ? categorias[0].id : '', tamano_id: tamanos.length > 0 ? tamanos[0].id : '', precio: '' });
      fetchDatos();
    } catch (error) {
      showToast(error.response?.data?.message || 'Error al guardar el producto', 'error');
    }
  };

  const handleEditarItemCatalogo = (item) => {
    const catId = categorias.find(c => c.nombre === item.categoria_nombre)?.id || '';
    setNuevoProducto({
      producto_id: item.producto_id,
      presentacion_id: item.presentacion_id,
      nombre: item.producto_nombre,
      categoria_id: catId,
      tamano_id: item.tamano_id,
      precio: item.precio,
      es_mitad_mitad: item.es_mitad_mitad || false
    });
    setIsProductoModalOpen(true);
  };

  const handleEliminarProducto = (item) => {
    setConfirmDialog({
      title: '¿Eliminar producto de venta?',
      message: `Estás a punto de eliminar "${item.producto_nombre}" (${item.presentacion_nombre}) del catálogo.\n\n⚠️ Toda la receta vinculada también se perderá.`,
      isDanger: true,
      confirmText: 'Sí, Eliminar Definitivamente',
      onConfirm: async () => {
        try {
          await axios.delete(`${API_URL}/api/catalogo/productos/${item.producto_id}/presentaciones/${item.presentacion_id}`);
          showToast(`"${item.producto_nombre}" eliminado del catálogo 🗑️`);
          fetchDatos();
        } catch (error) {
          showToast(error.response?.data?.message || 'Error al eliminar el producto', 'error');
        }
      }
    });
  };

  const handleCrearCategoria = () => {
    showInputModal(
      '🏷️ Nueva Categoría',
      'Ingresa el nombre de la nueva categoría (ej. Bebidas, Postres):',
      'Ej. Snacks...',
      async (nombreCat, closeModal) => {
        if (!nombreCat.trim()) return showToast('El nombre de la categoría no puede estar vacío.', 'warning');
        
        const match = categorias.find(c => similitud(c.nombre, nombreCat) >= 0.95);
        if (match) {
          return showToast(`Ya existe una categoría idéntica o muy parecida: "${match.nombre}"`, 'error');
        }

        try {
          const res = await axios.post(`${API_URL}/api/catalogo/categorias`, { nombre: nombreCat.trim() });
          showToast('Categoría creada! 🏷️');
          const nuevaCat = res.data.data;
          setCategorias(prevCats => [...prevCats, nuevaCat]);
          setNuevoProducto(prevProd => ({ ...prevProd, categoria_id: nuevaCat.id }));
          closeModal();
        } catch (error) {
          showToast('Error al crear la categoría', 'error');
        }
      },
      'text'
    );
  };

  const handleEliminarCategoria = async (id, nombre) => {
    setConfirmDialog({
      title: '¿Eliminar categoría?',
      message: `Estás a punto de eliminar la categoría "${nombre}".\nEsto fallará si aún tiene productos asignados.`,
      onConfirm: async () => {
        try {
          await axios.delete(`${API_URL}/api/catalogo/categorias/${id}`);
          showToast(`Categoría "${nombre}" eliminada 🗑️`);
          setCategorias(categorias.filter(c => c.id !== id));
        } catch (error) {
          showToast(error.response?.data?.message || 'Error al eliminar categoría', 'error');
        }
      }
    });
  };

  const handleEditarCategoria = (id, nombreActual) => {
    showInputModal(
      '🏷️ Editar Categoría',
      'Ingresa el nuevo nombre para esta categoría:',
      'Ej. Bebidas...',
      async (nuevoNombre, closeModal) => {
        if (!nuevoNombre.trim() || nuevoNombre.trim() === nombreActual) return closeModal();
        try {
          const res = await axios.put(`${API_URL}/api/catalogo/categorias/${id}`, { nombre: nuevoNombre.trim() });
          showToast('Categoría actualizada! ✏️');
          setCategorias(categorias.map(c => c.id === id ? res.data.data : c));
          fetchDatos(); 
          closeModal();
        } catch (error) {
          showToast(error.response?.data?.message || 'Error al editar categoría', 'error');
        }
      },
      'text',
      nombreActual
    );
  };

  const handleCrearTamano = () => {
    showInputModal(
      '📏 Nuevo Tamaño',
      'Ingresa el nombre del tamaño oficial (ej. Familiar, Rebanada, 1 Litro):',
      'Ej. Personal...',
      async (nombreTam, closeModal) => {
        if (!nombreTam.trim()) return showToast('El nombre del tamaño no puede estar vacío.', 'warning');

        const match = tamanos.find(t => similitud(t.nombre, nombreTam) >= 0.95);
        if (match) {
          return showToast(`Ya existe un tamaño idéntico o muy parecido: "${match.nombre}"`, 'error');
        }

        try {
          const res = await axios.post(`${API_URL}/api/catalogo/tamanos`, { nombre: nombreTam.trim() });
          showToast('Tamaño creado! 📏');
          const nuevoTam = res.data.data;
          setTamanos(prev => [...prev, nuevoTam]);
          setNuevoProducto(prevProd => ({ ...prevProd, tamano_id: nuevoTam.id }));
          closeModal();
        } catch (error) {
          showToast(error.response?.data?.message || 'Error al crear el tamaño', 'error');
        }
      },
      'text'
    );
  };

  const handleEliminarTamano = async (id, nombre) => {
    setConfirmDialog({
      title: '¿Eliminar tamaño?',
      message: `Estás a punto de eliminar el tamaño "${nombre}".\nEsto fallará si ya hay productos usándolo.`,
      onConfirm: async () => {
        try {
          await axios.delete(`${API_URL}/api/catalogo/tamanos/${id}`);
          showToast(`Tamaño "${nombre}" eliminado 🗑️`);
          setTamanos(tamanos.filter(t => t.id !== id));
        } catch (error) {
          showToast(error.response?.data?.message || 'Error al eliminar tamaño', 'error');
        }
      }
    });
  };

  const handleEditarTamano = (id, nombreActual) => {
    showInputModal(
      '📏 Editar Tamaño',
      'Ingresa el nuevo nombre para este tamaño:',
      'Ej. Megalodón...',
      async (nuevoNombre, closeModal) => {
        if (!nuevoNombre.trim() || nuevoNombre.trim() === nombreActual) return closeModal();
        try {
          const res = await axios.put(`${API_URL}/api/catalogo/tamanos/${id}`, { nombre: nuevoNombre.trim() });
          showToast('Tamaño actualizado! ✏️');
          setTamanos(tamanos.map(t => t.id === id ? res.data.data : t));
          fetchDatos(); 
          closeModal();
        } catch (error) {
          showToast(error.response?.data?.message || 'Error al editar tamaño', 'error');
        }
      },
      'text',
      nombreActual
    );
  };

  const abrirModalReceta = (item) => {
    setPresentacionAEditar(item);
    setIngredientesReceta(item.ingredientes || []);
    setBusquedaBom('');
    setCantidadBomItem('');
    setIngredienteBomSeleccionado('');
    setIsRecetaModalOpen(true);
  };

  const agregarIngredienteAReceta = () => {
    if (!ingredienteBomSeleccionado || !cantidadBomItem || parseFloat(cantidadBomItem) <= 0) {
      return showToast('Selecciona un ingrediente válido y una cantidad mayor a 0', 'warning');
    }
    const ing = inventario.find(i => i.id === parseInt(ingredienteBomSeleccionado));
    if (!ing) return;
    
    if (ingredientesReceta.some(r => r.ingrediente_id === ing.id)) {
      return showToast('Ese ingrediente ya está en la receta', 'warning');
    }

    setIngredientesReceta([...ingredientesReceta, {
      ingrediente_id: ing.id,
      nombre: ing.nombre,
      unidad_medida: ing.unidad_receta,
      cantidad_requerida: parseFloat(cantidadBomItem)
    }]);

    setIngredienteBomSeleccionado('');
    setCantidadBomItem('');
  };

  const quitarIngredienteDeReceta = (id) => {
    setIngredientesReceta(ingredientesReceta.filter(i => i.ingrediente_id !== id));
  };

  const clonarReceta = () => {
    if (!recetaClonSeleccionada) return showToast('Selecciona un producto del cual copiar', 'warning');
    const prodDestino = catalogo.find(c => c.presentacion_id.toString() === recetaClonSeleccionada.toString());
    if (prodDestino && prodDestino.ingredientes) {
      const nuevosIngredientes = [...ingredientesReceta];
      let agregados = 0;
      prodDestino.ingredientes.forEach(ing => {
        // Aseguramos cantidad_requerida para que el render del modal y el guardado funcionen
        const mappedIng = { ...ing, cantidad_requerida: ing.cantidad_requerida || ing.cantidad };
        if (!nuevosIngredientes.some(actual => actual.ingrediente_id === mappedIng.ingrediente_id)) {
            nuevosIngredientes.push(mappedIng);
            agregados++;
        }
      });
      setIngredientesReceta(nuevosIngredientes);
      setRecetaClonSeleccionada('');
      if (agregados > 0) {
        showToast(`Se copiaron ${agregados} ingredientes de ${prodDestino.producto_nombre} 📋`);
      } else {
        showToast('No se agregaron ingredientes nuevos (ya estaban todos presentados)', 'warning');
      }
    }
  };

  const guardarRecetaBOM = async () => {
    if (ingredientesReceta.length === 0) {
      return showToast('Debes agregar al menos un ingrediente para armar la receta.', 'warning');
    }
    try {
      const payload = {
        ingredientes: ingredientesReceta.map(i => ({
          ingrediente_id: i.ingrediente_id,
          cantidad: i.cantidad_requerida
        }))
      };
      await axios.post(`${API_URL}/api/catalogo/${presentacionAEditar.presentacion_id}/receta`, payload);
      showToast('Receta configurada con éxito 🎉');
      setIsRecetaModalOpen(false);
      fetchDatos();
    } catch (error) {
      showToast('Error al guardar la receta', 'error');
    }
  };

  const inventarioFiltrado = inventario.filter(item => 
    item.nombre.toLowerCase().includes(busquedaInventario.toLowerCase()) ||
    item.unidad_compra.toLowerCase().includes(busquedaInventario.toLowerCase()) ||
    item.unidad_receta.toLowerCase().includes(busquedaInventario.toLowerCase())
  );

  const productosSinReceta = catalogo.filter(item => 
    !item.es_mitad_mitad && 
    item.categoria_nombre?.toLowerCase() === 'pizza' && 
    item.ingredientes.length === 0
  );

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
                <p className="value">${ventasDia.toFixed(2)}</p>
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
              <div className={`stat-card ${productosSinReceta.length > 0 ? 'alert' : ''}`} style={productosSinReceta.length > 0 ? { borderLeftColor: '#f39c12' } : {}}>
                <h3 style={{ color: productosSinReceta.length > 0 ? '#d35400' : '' }}>Bloqueos de Venta</h3>
                <p className="value" style={{ color: productosSinReceta.length > 0 ? '#e67e22' : '#2ecc71' }}>
                  {productosSinReceta.length > 0 ? `⚠️ ${productosSinReceta.length} Sin Receta` : '✅ Todos Listos'}
                </p>
                {productosSinReceta.length > 0 && <p style={{ margin: '10px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>Mermas no se deducirán.</p>}
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

            {productosSinReceta.length > 0 && (
              <div className="table-container" style={{ border: '2px solid #e67e22', marginTop: '20px' }}>
                <div className="table-header" style={{ backgroundColor: '#fff8e1' }}>
                  <h2 style={{ color: '#d35400' }}>Productos sin Receta Activa (No disponibles en Caja)</h2>
                  <button className="btn btn-primary" onClick={() => navigate('/catalogo')}>Ir a Configurar Catálogo</button>
                </div>
                <table>
                  <thead>
                    <tr><th>Producto</th><th>Tamaño</th><th>Precio Base</th><th>Estado de Receta</th></tr>
                  </thead>
                  <tbody>
                    {productosSinReceta.map(item => (
                      <tr key={`${item.producto_id}-${item.presentacion_id}`}>
                        <td><strong>{item.producto_nombre}</strong></td>
                        <td>{item.presentacion_nombre}</td>
                        <td>${parseFloat(item.precio).toFixed(2)}</td>
                        <td><span className="status-badge" style={{ backgroundColor: '#f39c12', color: 'white' }}>Incompleto ⚠️</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* === SECCIÓN ANIMADA: ACCESOS RÁPIDOS === */}
            <div className="dashboard-bottom">
              <div className="pizza-animation-panel">
                <div className="pizza-orbit-container">
                  <div className="pizza-center">🍕</div>
                  <div className="orbit orbit-1"><span className="orbit-icon">🧀</span></div>
                  <div className="orbit orbit-2"><span className="orbit-icon">🍅</span></div>
                  <div className="orbit orbit-3"><span className="orbit-icon">🌿</span></div>
                  <div className="orbit orbit-4"><span className="orbit-icon">🥩</span></div>
                </div>
                <p className="pizza-tagline">Sistema en línea — Todo listo para operar</p>
              </div>

              <div className="quick-access-grid">
                <h2 className="quick-access-title">Accesos Rápidos</h2>
                <div className="quick-cards">
                  <div className="quick-card" onClick={() => navigate('/inventario')}>
                    <span className="quick-icon">📦</span>
                    <strong>Inventario</strong>
                    <p>{inventario.length} ingredientes activos</p>
                  </div>
                  <div className="quick-card" onClick={() => navigate('/catalogo')}>
                    <span className="quick-icon">🍕</span>
                    <strong>Catálogo & Recetas</strong>
                    <p>Configura ingredientes por pizza</p>
                  </div>
                  <div className="quick-card" onClick={() => navigate('/paquetes')}>
                    <span className="quick-icon">📦</span>
                    <strong>Combos</strong>
                    <p>{paquetes.length} paquetes activos</p>
                  </div>
                  <div className="quick-card quick-card-highlight" onClick={() => navigate('/historial')}>
                    <span className="quick-icon">💰</span>
                    <strong>Ventas del Día</strong>
                    <p>${ventasDia.toFixed(2)} facturado hoy</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ================================== */}
        {/* VISTA 2: INVENTARIO (CRUD)         */}
        {/* ================================== */}
        {activePath === 'inventario' && (
          <>
            <h1 style={{ marginTop: 0 }}>Gestión de Materia Prima</h1>
            <div className="table-container">
              <div className="table-header" style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', alignItems: 'center', justifyContent: 'space-between' }}>
                <h2 style={{ margin: 0 }}>Catálogo de Ingredientes</h2>
                <div style={{ flex: 1, minWidth: '250px', display: 'flex', justifyContent: 'center' }}>
                  <input
                    type="text"
                    placeholder="🔍 Buscar por nombre o unidad de medida..."
                    value={busquedaInventario}
                    onChange={(e) => setBusquedaInventario(e.target.value)}
                    style={{
                      width: '100%', maxWidth: '350px', padding: '10px 14px',
                      borderRadius: '8px', border: '1px solid var(--border)', fontSize: '14px',
                      outline: 'none', transition: 'box-shadow 0.2s'
                    }}
                    onFocus={(e) => e.target.style.boxShadow = '0 0 0 3px rgba(0, 150, 136, 0.2)'}
                    onBlur={(e) => e.target.style.boxShadow = 'none'}
                  />
                </div>
                <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
                  + Nuevo Ingrediente
                </button>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Ingrediente</th>
                    <th>Unidad Compra</th>
                    <th>Unidad Receta</th>
                    <th>Factor Conv.</th>
                    <th>Stock Actual</th>
                    <th>Stock Mín.</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {inventario.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ padding: 0, border: 'none' }}>
                        <div className="empty-state">
                          <div className="empty-state-icon">📦</div>
                          <h3 className="empty-state-title">¡Tu almacén está vacío!</h3>
                          <p className="empty-state-subtitle">Empieza agregando los ingredientes que usas en tu cocina.<br/>Queso, masa, pepperoni... ¡todo lo que hace especial a tu pizza!</p>
                          <button className="btn btn-primary empty-state-btn" onClick={() => setIsModalOpen(true)}>
                            + Agregar primer ingrediente
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : inventarioFiltrado.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
                        <h3 style={{ margin: '0 0 8px 0', color: '#2d3436' }}>Sin resultados</h3>
                        <p style={{ margin: 0 }}>No encontramos ningún ingrediente que coincida con "<strong>{busquedaInventario}</strong>".</p>
                        <button className="btn btn-outline" style={{ marginTop: '16px' }} onClick={() => setBusquedaInventario('')}>
                          Limpiar Búsqueda
                        </button>
                      </td>
                    </tr>
                  ) : inventarioFiltrado.map(item => {
                    const esCritico = parseFloat(item.stock_actual) <= parseFloat(item.stock_minimo);
                    return (
                      <tr key={item.id}>
                        <td><strong>{item.nombre}</strong></td>
                        <td>
                          <span className="status-badge" style={{background:'#e3f2fd', color:'#1565c0'}}>
                            {item.unidad_compra}
                          </span>
                        </td>
                        <td>
                          <span className="status-badge" style={{background:'#fce4ec', color:'#880e4f'}}>
                            {item.unidad_receta}
                          </span>
                        </td>
                        <td style={{textAlign:'center', fontWeight:'bold', color:'var(--primary)'}}>
                          1:{item.factor_conversion}
                        </td>
                        <td style={{ color: esCritico ? 'var(--danger)' : '', fontWeight: esCritico ? 'bold' : 'normal' }}>
                          {parseFloat(item.stock_actual).toFixed(0)} {item.unidad_receta}
                        </td>
                        <td>{parseFloat(item.stock_minimo).toFixed(0)} {item.unidad_receta}</td>
                        <td>
                          {esCritico 
                            ? <span className="status-badge status-low">REORDENAR</span> 
                            : <span className="status-badge status-ok">ÓPTIMO</span>
                          }
                        </td>
                        <td style={{display:'flex', gap:'6px', flexWrap:'wrap'}}>
                          <button 
                            className="btn btn-primary"
                            style={{fontSize:'12px', padding:'6px 10px', background:'#2e7d32'}}
                            onClick={() => handleRegistrarCompra(item.id, item.nombre, item.unidad_compra, item.factor_conversion, item.unidad_receta)}
                          >
                            📦 Ingreso
                          </button>
                          <button 
                            className="btn btn-outline"
                            style={{fontSize:'12px', padding:'6px 10px'}}
                            onClick={() => handleAjustarStock(item.id, item.nombre, item.stock_actual, item.unidad_receta)}
                          >
                            ± Ajustar
                          </button>
                          <button 
                            className="btn btn-outline"
                            style={{fontSize:'12px', padding:'6px 10px', borderColor:'var(--primary)', color:'var(--primary)'}}
                            onClick={() => handleAbrirEditar(item)}
                          >
                            ✏️ Editar
                          </button>
                          <button 
                            className="btn btn-outline"
                            style={{fontSize:'12px', padding:'6px 10px', borderColor:'var(--danger)', color:'var(--danger)'}}
                            onClick={() => handleEliminar(item)}
                          >
                            🗑️
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
                <button className="btn btn-primary" onClick={() => {
                  setNuevoProducto({ producto_id: null, presentacion_id: null, nombre: '', categoria_id: categorias.length > 0 ? categorias[0].id : '', tamano_id: tamanos.length > 0 ? tamanos[0].id : '', precio: '' });
                  setIsProductoModalOpen(true);
                }}>+ Nuevo Producto Venta</button>
              </div>
              <table>
                <thead>
                  <tr><th>Categoría</th><th>Producto</th><th>Tamaño / Presentación</th><th>Precio Base</th><th>Estado Receta (BOM)</th><th>Acciones</th></tr>
                </thead>
                <tbody>
                  {catalogo.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ padding: 0, border: 'none' }}>
                        <div className="empty-state">
                          <div className="empty-state-icon">🍕</div>
                          <h3 className="empty-state-title">¡Aún no hay productos en el catálogo!</h3>
                          <p className="empty-state-subtitle">Agrega tus pizzas, snacks y bebidas para poder armar recetas<br/>y conectarlas con tu inventario de ingredientes.</p>
                          <button className="btn btn-primary empty-state-btn" onClick={() => setIsProductoModalOpen(true)}>
                            + Agregar primer producto
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : catalogo.map((item, idx) => (
                    <tr key={idx}>
                      <td><span className="status-badge" style={{background:'#e0e0e0', color:'#333'}}>{item.categoria_nombre}</span></td>
                      <td><strong>{item.producto_nombre}</strong></td>
                      <td>{item.presentacion_nombre}</td>
                      <td>${parseFloat(item.precio).toFixed(2)}</td>
                      <td>
                        {item.es_mitad_mitad 
                          ? <span className="status-badge status-good" style={{background: '#27ae60', color: 'white'}}>Mitad Dinámica</span>
                          : item.categoria_nombre?.toLowerCase() !== 'pizza'
                            ? <span className="status-badge status-good" style={{background: '#8e44ad', color: 'white'}}>No Requiere</span>
                            : item.ingredientes.length > 0 
                              ? <span className="status-badge status-ok">{item.ingredientes.length} Ingredientes</span>
                              : <span className="status-badge status-low">Sin Configurar</span>
                        }
                      </td>
                      <td>
                        <div style={{display:'flex', gap:'5px'}}>
                          <button 
                            className="btn btn-outline"
                            title="Editar Atributos Base"
                            style={{ padding: '6px 10px', fontSize:'12px', borderColor: 'var(--primary)', color:'var(--primary)'}}
                            onClick={() => handleEditarItemCatalogo(item)}
                          >
                            ✏️ Editar
                          </button>
                          { !item.es_mitad_mitad && item.categoria_nombre?.toLowerCase() === 'pizza' && (
                            <button 
                              className="btn btn-outline"
                              title="Armar Receta BOM"
                              style={{ padding: '6px 10px', fontSize:'12px'}}
                              onClick={() => abrirModalReceta(item)}
                            >
                              🍕 Receta
                            </button>
                          )}
                          <button 
                            className="btn btn-outline"
                            title="Borrar Completamente"
                            style={{ padding: '6px 10px', fontSize:'12px', borderColor: 'var(--danger)', color:'var(--danger)'}}
                            onClick={() => handleEliminarProducto(item)}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* SECCIÓN GESTIÓN DE CATEGORÍAS Y TAMAÑOS */}
            <div style={{ display: 'flex', gap: '30px', marginTop: '40px', flexWrap: 'wrap' }}>
              
              {/* CATEGORIAS */}
              <div className="table-container" style={{ flex: 1, minWidth: '400px' }}>
                <div className="table-header">
                  <h2>Categorías</h2>
                  <button className="btn btn-primary" onClick={handleCrearCategoria}>+ Nueva</button>
                </div>
                <table>
                  <thead>
                    <tr><th>ID</th><th>Nombre de Categoría</th><th>Acciones</th></tr>
                  </thead>
                  <tbody>
                    {categorias.length === 0 ? (
                      <tr><td colSpan="3" style={{ textAlign: 'center', padding: '30px' }}>No hay categorías registradas.</td></tr>
                    ) : categorias.map(cat => (
                      <tr key={cat.id}>
                        <td style={{ color: 'var(--text-muted)' }}>#{cat.id}</td>
                        <td><strong>{cat.nombre}</strong></td>
                        <td>
                          <button 
                            className="btn btn-outline" 
                            style={{ padding: '4px 8px', fontSize: '12px', marginRight: '5px' }} 
                            onClick={() => handleEditarCategoria(cat.id, cat.nombre)}
                          >
                            ✏️ Editar
                          </button>
                          <button 
                            className="btn btn-outline" 
                            style={{ borderColor: 'var(--danger)', color: 'var(--danger)', padding: '4px 8px', fontSize: '12px' }} 
                            onClick={() => handleEliminarCategoria(cat.id, cat.nombre)}
                          >
                            🗑️ Eliminar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* TAMAÑOS */}
              <div className="table-container" style={{ flex: 1, minWidth: '400px' }}>
                <div className="table-header">
                  <h2>Tamaños</h2>
                  <button className="btn btn-primary" onClick={handleCrearTamano}>+ Nuevo</button>
                </div>
                <table>
                  <thead>
                    <tr><th>ID</th><th>Nombre del Tamaño</th><th>Acciones</th></tr>
                  </thead>
                  <tbody>
                    {tamanos.length === 0 ? (
                      <tr><td colSpan="3" style={{ textAlign: 'center', padding: '30px' }}>No hay tamaños registrados.</td></tr>
                    ) : tamanos.map(tam => (
                      <tr key={tam.id}>
                        <td style={{ color: 'var(--text-muted)' }}>#{tam.id}</td>
                        <td><strong>{tam.nombre}</strong></td>
                        <td>
                          <button 
                            className="btn btn-outline" 
                            style={{ padding: '4px 8px', fontSize: '12px', marginRight: '5px' }} 
                            onClick={() => handleEditarTamano(tam.id, tam.nombre)}
                          >
                            ✏️ Editar
                          </button>
                          <button 
                            className="btn btn-outline" 
                            style={{ borderColor: 'var(--danger)', color: 'var(--danger)', padding: '4px 8px', fontSize: '12px' }} 
                            onClick={() => handleEliminarTamano(tam.id, tam.nombre)}
                          >
                            🗑️ Eliminar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
                  <tr><th>Nombre del Combo</th><th>Precio</th><th>Productos Incluidos</th><th>Estado</th><th>Acciones</th></tr>
                </thead>
                <tbody>
                  {paquetes.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ padding: 0, border: 'none' }}>
                        <div className="empty-state">
                          <div className="empty-state-icon">🎁</div>
                          <h3 className="empty-state-title">¡No hay combos armados todavía!</h3>
                          <p className="empty-state-subtitle">Crea tu primer paquete especial. Agrupa una pizza con una bebida<br/>y ofrece un precio irresistible a tus clientes.</p>
                          <button className="btn btn-primary empty-state-btn" onClick={() => setIsPaqueteModalOpen(true)}>
                            + Armar primer combo
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : paquetes.map((paq, idx) => (
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
                      <td>
                         <button 
                           className="btn btn-outline" 
                           style={{ padding: '4px 8px', fontSize: '12px', marginRight: '5px' }} 
                           onClick={() => handleEditarPaquete(paq)}
                         >
                           ✏️ Editar
                         </button>
                         <button 
                           className="btn btn-outline" 
                           style={{ borderColor: 'var(--danger)', color: 'var(--danger)', padding: '4px 8px', fontSize: '12px' }} 
                           onClick={() => handleEliminarPaquete(paq)}
                         >
                           🗑️ Eliminar
                         </button>
                      </td>
                    </tr>
                  ))}
                  {paquetes.length === 0 && (
                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: '30px' }}>No hay combos registrados.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* ================================== */}
      {/* MODAL: EDITAR INGREDIENTE          */}
      {/* ================================== */}
      {editandoIng && (
        <div className="modal-overlay">
          <div className="modal" style={{width:'520px', maxWidth:'95%'}}>
            <h2 style={{ marginTop: 0, borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
              ✏️ Editar Ingrediente
            </h2>

            <div className="form-group">
              <label>Nombre del Ingrediente *</label>
              <input type="text" value={editandoIng.nombre}
                onChange={(e) => setEditandoIng({...editandoIng, nombre: e.target.value})} />
            </div>

            <div style={{ display: 'flex', gap: '15px' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>🛒 Unidad de Compra</label>
                <select value={editandoIng.unidad_compra} onChange={(e) => setEditandoIng({...editandoIng, unidad_compra: e.target.value})}>
                  {['Barra','Bolsa','Caja','Lata','Litro','Pza','Rollo','Saco'].map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>🥢 Unidad de Receta</label>
                <select value={editandoIng.unidad_receta} onChange={(e) => setEditandoIng({...editandoIng, unidad_receta: e.target.value})}>
                  {['gr','ml','pza','rebanada'].map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '15px' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>× Factor de Conversión</label>
                <input type="number" value={editandoIng.factor_conversion}
                  onChange={(e) => setEditandoIng({...editandoIng, factor_conversion: e.target.value})} />
                <small style={{color:'var(--primary)', display:'block', marginTop:'4px'}}>
                  → 1 {editandoIng.unidad_compra} = {editandoIng.factor_conversion} {editandoIng.unidad_receta}
                </small>
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>💰 Costo por {editandoIng.unidad_compra} ($)</label>
                <input type="number" value={editandoIng.costo_unitario}
                  onChange={(e) => setEditandoIng({...editandoIng, costo_unitario: e.target.value})} />
              </div>
            </div>

            <div className="form-group">
              <label>Alerta Mínima (en {editandoIng.unidad_receta})</label>
              <input type="number" value={editandoIng.stock_minimo}
                onChange={(e) => setEditandoIng({...editandoIng, stock_minimo: e.target.value})} />
            </div>

            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setEditandoIng(null)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleGuardarEdicion}>Guardar Cambios</button>
            </div>
          </div>
        </div>
      )}

      {/* ================================== */}
      {/* MODAL: CONFIRMACIÓN GENÉRICA       */}
      {/* ================================== */}
      {confirmDialog && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal" style={{ width: '420px', maxWidth: '95%', textAlign: 'center' }}>
            <div style={{ fontSize: '52px', marginBottom: '12px' }}>⚠️</div>
            <h2 style={{ marginTop: 0, marginBottom: '8px', color: 'var(--text-main)' }}>
              {confirmDialog.title}
            </h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
              {confirmDialog.message}
            </p>
            <div className="modal-actions" style={{ justifyContent: 'center' }}>
              <button className="btn btn-outline" onClick={() => setConfirmDialog(null)}>Cancelar</button>
              <button
                className="btn"
                style={{ backgroundColor: 'var(--danger)', color: 'white', borderColor: 'var(--danger)' }}
                onClick={() => {
                  confirmDialog.onConfirm();
                  setConfirmDialog(null);
                }}
              >
                Sí, Eliminar Definitivamente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================== */}
      {/* MODAL DE NUEVO INGREDIENTE         */}
      {/* ================================== */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal" style={{width:'560px', maxWidth:'95%'}}>
            <h2 style={{ marginTop: 0, borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
              🧄 Registrar Materia Prima
            </h2>

            {/* Info de ejemplo */}
            <div style={{background:'#e8f5e9', borderRadius:'8px', padding:'10px 14px', marginBottom:'16px', fontSize:'13px', color:'#2e7d32'}}>
              <strong>Regla de oro:</strong> El stock siempre se guarda en la Unidad de Receta (la más pequeña). <br/>
              Ej: Compras <em>Barras</em> pero la cocina usa <em>gramos</em>.
            </div>

            <div className="form-group">
              <label>Nombre del Ingrediente *</label>
              <input
                type="text"
                value={nuevoIng.nombre}
                onChange={(e) => setNuevoIng({...nuevoIng, nombre: e.target.value})}
                placeholder="Ej. Queso Mozzarella"
                style={{
                  borderColor: similares.some(s => s.score >= 0.95) ? 'var(--danger)' 
                             : similares.length > 0 ? '#f39c12' 
                             : ''
                }}
              />
              {/* Advertencias de similitud en tiempo real */}
              {similares.length > 0 && (
                <div className={`nombre-warning ${similares.some(s => s.score >= 0.95) ? 'nombre-warning--error' : 'nombre-warning--warn'}`}>
                  <span className="nombre-warning-icon">
                    {similares.some(s => s.score >= 0.95) ? '🚫' : '⚠️'}
                  </span>
                  <div>
                    <strong>
                      {similares.some(s => s.score >= 0.95)
                        ? 'Ya existe un ingrediente muy similar:'
                        : 'Ingredientes parecidos encontrados:'}
                    </strong>
                    <ul style={{margin:'4px 0 0 0', paddingLeft:'16px', fontSize:'13px'}}>
                      {similares.map(s => (
                        <li key={s.id}>
                          <strong>{s.nombre}</strong>
                          <span style={{marginLeft:'8px', opacity:0.7}}>
                            ({Math.round(s.score * 100)}% similar)
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
              {nuevoIng.nombre.trim().length >= 3 && similares.length === 0 && (
                <small style={{color:'#2e7d32', display:'block', marginTop:'5px'}}>✅ Nombre disponible</small>
              )}
            </div>

            {/* Fila 1: UMC y UMI */}
            <div style={{ display: 'flex', gap: '15px' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>🛋️ Unidad de Compra (UMC)</label>
                <select value={nuevoIng.unidad_compra} onChange={(e) => setNuevoIng({...nuevoIng, unidad_compra: e.target.value})}>
                  <option value="Barra">Barra</option>
                  <option value="Bolsa">Bolsa</option>
                  <option value="Caja">Caja</option>
                  <option value="Lata">Lata</option>
                  <option value="Litro">Litro</option>
                  <option value="Pza">Pieza</option>
                  <option value="Rollo">Rollo</option>
                  <option value="Saco">Saco</option>
                </select>
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>🥤 Unidad de Receta (UMI)</label>
                <select value={nuevoIng.unidad_receta} onChange={(e) => setNuevoIng({...nuevoIng, unidad_receta: e.target.value})}>
                  <option value="gr">Gramos (gr)</option>
                  <option value="ml">Mililitros (ml)</option>
                  <option value="pza">Pieza (pza)</option>
                  <option value="rebanada">Rebanada</option>
                </select>
              </div>
            </div>

            {/* Fila 2: Factor y Costo */}
            <div style={{ display: 'flex', gap: '15px' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>× Factor de Conversión *</label>
                <input 
                  type="number" 
                  value={nuevoIng.factor_conversion} 
                  onChange={(e) => setNuevoIng({...nuevoIng, factor_conversion: e.target.value})} 
                  placeholder={`¿Cuántos ${nuevoIng.unidad_receta} = 1 ${nuevoIng.unidad_compra}?`}
                />
                {nuevoIng.factor_conversion && (
                  <small style={{color:'var(--primary)', marginTop:'4px', display:'block'}}>
                    → 1 {nuevoIng.unidad_compra} = {nuevoIng.factor_conversion} {nuevoIng.unidad_receta}
                  </small>
                )}
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>💰 Costo por {nuevoIng.unidad_compra} ($)</label>
                <input type="number" value={nuevoIng.costo_unitario} onChange={(e) => setNuevoIng({...nuevoIng, costo_unitario: e.target.value})} placeholder="0.00" />
              </div>
            </div>

            {/* Fila 3: Stock inicial y Mínimo */}
            <div style={{ display: 'flex', gap: '15px' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Stock Inicial (en {nuevoIng.unidad_receta})</label>
                <input type="number" value={nuevoIng.stock_actual_receta} onChange={(e) => setNuevoIng({...nuevoIng, stock_actual_receta: e.target.value})} placeholder="0" />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Alerta Mínima (en {nuevoIng.unidad_receta})</label>
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

      {/* (Modal antiguo removido para evitar colisión de renderizado en React) */}

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
                {itemsPaquete.map((item, idx) => (
                  <li key={item.unique_id || idx} style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{item.cantidad}x <strong style={{ color: item.is_dinamico ? '#8e44ad' : '#333' }}>{item.producto_nombre}</strong> ({item.presentacion_nombre})</span>
                    <button className="btn" onClick={() => quitarItemDePaquete(item.unique_id || idx)} style={{ padding: '2px 8px', background: 'var(--danger)', color: 'white' }}>×</button>
                  </li>
                ))}
              </ul>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', marginBottom: '20px' }}>
              <div className="form-group dropdown-container" ref={comboDropdownRef} style={{ flex: 2, marginBottom: 0, position: 'relative' }}>
                <label>Busca y selecciona un producto o comodín</label>
                <input 
                   type="text" 
                   value={comboSearchQuery} 
                   onChange={e => { 
                      setComboSearchQuery(e.target.value); 
                      setPresentacionTemporal(''); // Si teclea de nuevo, invalida la selección
                      setShowComboDropdown(true); 
                   }}
                   onFocus={() => setShowComboDropdown(true)}
                   placeholder="Ej. Familiar o Coca Cola..."
                   style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '6px' }}
                />
                
                {showComboDropdown && (
                    <div className="modern-dropdown" style={{
                         position: 'absolute', top: '100%', left: 0, right: 0, 
                         background: 'white', border: '1px solid var(--border)', 
                         borderRadius: '8px', zIndex: 1000, 
                         maxHeight: '260px', overflowY: 'auto', 
                         boxShadow: '0 8px 16px rgba(0,0,0,0.1)', marginTop: '4px'
                    }}>
                        {comodinesFiltrados.length > 0 && (
                            <>
                              <div style={{ padding: '8px 12px', background: '#f1f2f6', fontSize: '12px', fontWeight: 'bold', color: '#2f3542' }}>
                                 ✨ COMODINES DINÁMICOS
                              </div>
                              {comodinesFiltrados.map(item => (
                                 <div 
                                    key={item.id}
                                    onClick={() => handleSelectComboItem(item.id, item.label)}
                                    style={{ padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid #eee', fontSize: '14px', color: '#8e44ad' }}
                                    onMouseEnter={(e) => e.target.style.background = '#f8f9fa'}
                                    onMouseLeave={(e) => e.target.style.background = 'white'}
                                 >
                                    {item.label}
                                 </div>
                              ))}
                            </>
                        )}
                        {fijosFiltrados.length > 0 && (
                            <>
                              <div style={{ padding: '8px 12px', background: '#f1f2f6', fontSize: '12px', fontWeight: 'bold', color: '#2f3542' }}>
                                 🍕 PRODUCTOS FIJOS
                              </div>
                              {fijosFiltrados.map(item => (
                                 <div 
                                    key={item.id}
                                    onClick={() => handleSelectComboItem(item.id, item.label)}
                                    style={{ padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid #eee', fontSize: '14px' }}
                                    onMouseEnter={(e) => e.target.style.background = '#f8f9fa'}
                                    onMouseLeave={(e) => e.target.style.background = 'white'}
                                 >
                                    {item.label}
                                 </div>
                              ))}
                            </>
                        )}
                        {comodinesFiltrados.length === 0 && fijosFiltrados.length === 0 && (
                          <div style={{ padding: '15px', textAlign: 'center', color: '#999', fontSize: '14px' }}>
                             Ningún resultado coincide.
                          </div>
                        )}
                    </div>
                )}
              </div>
              <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                <label>Cant.</label>
                <input type="number" value={cantidadItemTemporal} onChange={e => setCantidadItemTemporal(e.target.value)} />
              </div>
              <button className="btn btn-outline" onClick={agregarItemAPaquete} disabled={!presentacionTemporal}>Añadir</button>
            </div>

            <div className="modal-actions" style={{ borderTop: '1px solid var(--border)', paddingTop: '15px' }}>
              <button className="btn btn-outline" onClick={() => setIsPaqueteModalOpen(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={guardarPaqueteEnBD}>💾 Guardar Combo</button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* TOAST DE NOTIFICACIÓN (reemplaza alert)    */}
      {/* ========================================== */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          <span className="toast-icon">
            {toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : '⚠️'}
          </span>
          <span className="toast-message">{toast.message}</span>
          <button className="toast-close" onClick={() => setToast(null)}>×</button>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL DE INPUT (reemplaza prompt)          */}
      {/* ========================================== */}
      {inputModal && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal" style={{ width: '460px', maxWidth: '95%' }}>
            <h2 style={{ marginTop: 0, borderBottom: '1px solid var(--border)', paddingBottom: '12px', fontSize: '18px' }}>
              {inputModal.title}
            </h2>
            <div style={{ marginBottom: '20px' }}>
              {inputModal.description.split('\n').map((line, i) => (
                line.startsWith('**') && line.endsWith('**')
                  ? <p key={i} style={{ margin: '0 0 4px 0' }}><strong>{line.slice(2, -2)}</strong></p>
                  : <p key={i} style={{ margin: '0 0 4px 0', color: 'var(--text-muted)', fontSize: '14px' }}>{line}</p>
              ))}
            </div>
            <div className="form-group">
              <input
                type={inputModal.inputType || 'number'}
                autoFocus
                value={inputModalValue}
                onChange={e => setInputModalValue(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') { inputModal.onConfirm(inputModalValue); setInputModal(null); }
                  if (e.key === 'Escape') setInputModal(null);
                }}
                placeholder={inputModal.placeholder}
                style={{ fontSize: '16px', padding: '12px' }}
              />
            </div>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setInputModal(null)}>Cancelar</button>
              <button
                className="btn btn-primary"
                onClick={() => { inputModal.onConfirm(inputModalValue, () => setInputModal(null)); }}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================== */}
      {/* MODAL: NUEVO PRODUCTO VENTA        */}
      {/* ================================== */}
      {isProductoModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 1050 }}>
          <div className="modal" style={{width:'550px', maxWidth:'95%'}}>
            <h2 style={{ marginTop: 0, borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
              🍕 + Agregar Producto de Venta
            </h2>
            
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ margin: 0 }}>Categoría *</label>
                <button 
                  className="btn btn-outline" 
                  style={{ padding: '4px 8px', fontSize: '11px' }}
                  onClick={handleCrearCategoria}
                >
                  + Nueva Categoría
                </button>
              </div>
              <select 
                value={nuevoProducto.categoria_id} 
                onChange={(e) => setNuevoProducto({...nuevoProducto, categoria_id: e.target.value})}
              >
                {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
            
            <div className="form-group">
              <label>Nombre del Producto *</label>
              <input 
                type="text" 
                placeholder="Ej. Pizza Carnes Frías, Papas a la Francesa..." 
                value={nuevoProducto.nombre} 
                onChange={(e) => setNuevoProducto({...nuevoProducto, nombre: e.target.value})} 
              />
            </div>

            <div style={{ display: 'flex', gap: '15px' }}>
              <div className="form-group" style={{ flex: 1.3 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', minHeight: '26px' }}>
                  <label style={{ margin: 0, whiteSpace: 'nowrap' }}>Tamaño *</label>
                  <button 
                    className="btn btn-outline" 
                    style={{ padding: '4px 8px', fontSize: '11px', whiteSpace: 'nowrap' }}
                    onClick={handleCrearTamano}
                  >
                    + Nuevo Tamaño
                  </button>
                </div>
                <select 
                  value={nuevoProducto.tamano_id} 
                  onChange={(e) => setNuevoProducto({...nuevoProducto, tamano_id: e.target.value})}
                >
                  {tamanos.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ flex: 0.7 }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', marginBottom: '8px', minHeight: '26px' }}>
                  <label style={{ margin: 0, whiteSpace: 'nowrap' }}>Precio ($) *</label>
                </div>
                <input 
                  type="number" 
                  placeholder="Ej. 180" 
                  value={nuevoProducto.precio} 
                  onChange={(e) => setNuevoProducto({...nuevoProducto, precio: e.target.value})} 
                />
              </div>
            </div>

            <div style={{ background: '#f8f9fa', padding: '10px 15px', borderRadius: '6px', marginBottom: '20px', display: 'flex', alignItems: 'center', border: '1px solid #ddd' }}>
              <input 
                type="checkbox" 
                id="mitad_mitad_check"
                checked={nuevoProducto.es_mitad_mitad} 
                onChange={(e) => setNuevoProducto({...nuevoProducto, es_mitad_mitad: e.target.checked})} 
                style={{ marginRight: '10px', transform: 'scale(1.2)' }}
              />
              <label htmlFor="mitad_mitad_check" style={{ margin: 0, fontWeight: 'bold', cursor: 'pointer', color: '#333' }}>
                ☑️ Establecer como producto "Armar Mitad y Mitad" en caja
              </label>
            </div>

            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setIsProductoModalOpen(false)}>Cancelar</button>
              <button 
                className="btn btn-primary" 
                onClick={handleCrearProducto}
              >
                💾 Guardar Catálogo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================== */}
      {/* MODAL: BUILDER DE RECETA (BOM)       */}
      {/* ================================== */}
      {isRecetaModalOpen && presentacionAEditar && (
        <div className="modal-overlay">
          <div className="modal" style={{ width: '650px', maxWidth: '95%' }}>
            <h2 style={{ marginTop: 0, borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
              🍳 Armar Receta
            </h2>
            <p style={{ margin: '0 0 15px 0', color: 'var(--text-muted)' }}>
              Configurando ingredientes para: <strong style={{ color: 'var(--text-main)' }}>{presentacionAEditar.producto_nombre} ({presentacionAEditar.presentacion_nombre})</strong>
            </p>

            <div style={{ background: '#f9f9f9', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#555' }}>Ingredientes Actuales en la Receta:</h4>
              {ingredientesReceta.length === 0 ? (
                <p style={{ fontSize: '13px', margin: 0, color: 'var(--danger)' }}>Aún no hay ingredientes. Este producto no descontará inventario al venderse.</p>
              ) : (
                <table style={{ background: 'white', border: '1px solid #eee', borderRadius: '6px' }}>
                  <thead>
                    <tr><th style={{ padding: '8px' }}>Ingrediente</th><th style={{ padding: '8px' }}>Cantidad Fija</th><th style={{ padding: '8px', width: '60px' }}>Acción</th></tr>
                  </thead>
                  <tbody>
                    {ingredientesReceta.map((ing, idx) => (
                      <tr key={idx}>
                        <td style={{ padding: '8px' }}><strong>{ing.nombre}</strong></td>
                        <td style={{ padding: '8px' }}>{ing.cantidad_requerida} {ing.unidad_medida}</td>
                        <td style={{ padding: '8px', textAlign: 'center' }}>
                          <button 
                            className="btn btn-outline" 
                            style={{ padding: '2px 8px', borderColor: 'var(--danger)', color: 'var(--danger)' }}
                            onClick={() => quitarIngredienteDeReceta(ing.ingrediente_id)}
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Opciones Avanzadas: Clonar Receta */}
            <div style={{ background: '#eef2f3', padding: '15px', borderRadius: '8px', marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'flex-end', border: '1px solid #dcdde1' }}>
              <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                <label style={{ fontSize: '13px', color: '#34495e', fontWeight: 'bold' }}>💡 Copiar rápidamente desde otra receta existente:</label>
                <select value={recetaClonSeleccionada} onChange={e => setRecetaClonSeleccionada(e.target.value)}>
                  <option value="">-- Seleccionar producto base --</option>
                  {catalogo.filter(c => c.ingredientes.length > 0 && c.presentacion_id !== presentacionAEditar?.presentacion_id).map(prod => (
                    <option key={`clone-${prod.presentacion_id}`} value={prod.presentacion_id}>
                      {prod.producto_nombre} ({prod.presentacion_nombre}) - {prod.ingredientes.length} Ingred.
                    </option>
                  ))}
                </select>
              </div>
              <button 
                className="btn btn-outline" 
                onClick={clonarReceta}
                style={{ borderColor: '#3498db', color: '#3498db', padding: '10px 15px', fontWeight: 'bold' }}
              >
                📋 Importar
              </button>
            </div>

            <h4 style={{ margin: '0 0 10px 0', color: '#555' }}>Añadir Ingrediente:</h4>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', marginBottom: '20px' }}>
              <div className="form-group" style={{ flex: 2, marginBottom: 0 }}>
                <label>Buscador de Inventario</label>
                <input 
                  type="text" 
                  placeholder="Buscar masa, queso, peperoni..." 
                  value={busquedaBom} 
                  onChange={e => setBusquedaBom(e.target.value)} 
                />
                <select 
                  style={{ marginTop: '5px' }}
                  value={ingredienteBomSeleccionado}
                  onChange={e => setIngredienteBomSeleccionado(e.target.value)}
                >
                  <option value="">-- Selecciona una opción --</option>
                  {inventario.filter(i => 
                    i.nombre.toLowerCase().includes(busquedaBom.toLowerCase())
                  ).map(item => (
                    <option key={item.id} value={item.id}>
                      {item.nombre} (Se mide en {item.unidad_receta})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                <label>Cantidad Qty.</label>
                <input 
                  type="number" 
                  placeholder="Ej. 150"
                  value={cantidadBomItem} 
                  onChange={e => setCantidadBomItem(e.target.value)} 
                />
              </div>
              <button className="btn btn-outline" onClick={agregarIngredienteAReceta}>Añadir</button>
            </div>

            <div className="modal-actions" style={{ borderTop: '1px solid var(--border)', paddingTop: '15px' }}>
              <button className="btn btn-outline" onClick={() => setIsRecetaModalOpen(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={guardarRecetaBOM}>💾 Guardar Receta Completa</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default BackOffice;

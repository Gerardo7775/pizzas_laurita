import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import './CocinaKDS.css';

const CocinaKDS = () => {
  const API_URL = import.meta.env.VITE_API_URL;

  const [pedidos, setPedidos] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);

  // Estado para el Modal de Cancelación
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [pedidoACancelar, setPedidoACancelar] = useState(null);
  const [motivoCancelacion, setMotivoCancelacion] = useState('');

  // Estado para el sistema de alertas
  const [alertasBanner, setAlertasBanner] = useState([]); // [{id, folio, nivel, desc}]
  const alertasRegistradasRef = useRef(new Set()); // IDs + nivel ya notificados
  const [tick, setTick] = useState(0); // fuerza re-render del timer

  // Configuración de sonido (persiste en localStorage)
  const [sonidoActivo, setSonidoActivo] = useState(() => localStorage.getItem('kds_sonido') !== 'false');
  const [vozActiva, setVozActiva] = useState(() => localStorage.getItem('kds_voz') !== 'false');
  const [showSettings, setShowSettings] = useState(false);

  // Refs para evitar stale closures en el setInterval
  const sonidoActivoRef = useRef(sonidoActivo);
  const vozActivaRef = useRef(vozActiva);
  useEffect(() => { sonidoActivoRef.current = sonidoActivo; localStorage.setItem('kds_sonido', sonidoActivo); }, [sonidoActivo]);
  useEffect(() => { vozActivaRef.current = vozActiva; localStorage.setItem('kds_voz', vozActiva); }, [vozActiva]);

  // Beep de alerta usando AudioContext nativo (sin archivos externos)
  const reproducirBeep = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const secuencia = [
        { freq: 880, start: 0,   dur: 0.15 },
        { freq: 660, start: 0.2, dur: 0.15 },
        { freq: 880, start: 0.4, dur: 0.25 },
      ];
      secuencia.forEach(({ freq, start, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = freq;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.4, ctx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + dur + 0.05);
      });
    } catch (e) { console.warn('AudioContext no disponible', e); }
  };

  // Voz de alerta usando Web Speech API nativa
  const hablarAlerta = (folio, nivel) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel(); // cancelar si ya estaba hablando
    const texto = nivel === 'EXCEDIDO'
      ? `Atención. El pedido ${folio} ha superado el tiempo estimado. Favor de atenderlo cuanto antes.`
      : `Aviso. El pedido ${folio} está al ochenta por ciento de su tiempo estimado.`;
    const utterance = new SpeechSynthesisUtterance(texto);
    utterance.lang = 'es-MX';
    utterance.rate = 0.92;
    utterance.pitch = 1.05;
    utterance.volume = 1;
    // Intentar usar voz en español si está disponible
    const voces = window.speechSynthesis.getVoices();
    const vozEs = voces.find(v => v.lang.startsWith('es'));
    if (vozEs) utterance.voice = vozEs;
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    // 0. CARGAR ESTADO INICIAL DESDE LA BASE DE DATOS (A prueba de recargas "F5")
    const cargarPedidosIniciales = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/pedidos/cocina`);
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
      socketRef.current = io(API_URL);
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
      // El backend ya manda el objeto con la estructura correcta (id, id_local, folio, estado...)
      setPedidos((prevPedidos) => [...prevPedidos, nuevoPedido]);
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
      try {
        await axios.patch(`${API_URL}/api/pedidos/${id}/estado`, { estado: nuevoEstado });
      } catch (e) {
        console.error('Error al sincronizar estado con servidor', e);
      }
    } else {
      // Despacharlo (LISTO_ENTREGA → ENTREGADO)
      setPedidos(pedidos.filter(p => p.id_local !== id));
      try {
        await axios.patch(`${API_URL}/api/pedidos/${id}/estado`, { estado: 'ENTREGADO' });
      } catch (e) {
        console.error('Error al marcar como entregado', e);
      }
    }
  };
  // ============================================================
  // SISTEMA DE ALERTAS POR RETRASO
  // ============================================================
  useEffect(() => {
    const intervalo = setInterval(() => {
      setTick(t => t + 1); // fuerza re-render para actualizar la barra visualmente

      setPedidos(prev => {
        let cambiaron = false;
        const actualizados = prev.map(p => {
          // Rastrear PREPARANDO, HORNEANDO y LISTO_ENTREGA con inicio registrado
          if (!['PREPARANDO', 'HORNEANDO', 'LISTO_ENTREGA'].includes(p.estado) || !p.inicio_preparacion) return p;

          const tiempoEstimado = parseInt(p.tiempo_estimado_min) || 20;
          const elapsed = (Date.now() - new Date(p.inicio_preparacion).getTime()) / 60000;
          const pct = elapsed / tiempoEstimado;

          let nuevoNivel = 'NORMAL';
          if (elapsed >= tiempoEstimado + 5) nuevoNivel = 'EXCEDIDO';
          else if (pct >= 0.8) nuevoNivel = 'ADVERTENCIA';

          if (nuevoNivel !== p.alerta_retraso) {
            cambiaron = true;
            const clave = `${p.id}-${nuevoNivel}`;
            if (!alertasRegistradasRef.current.has(clave)) {
              alertasRegistradasRef.current.add(clave);
              const desc = nuevoNivel === 'EXCEDIDO'
                ? `lleva +5 min sobre el tiempo estimado ⛔`
                : `ha consumido el 80% del tiempo estimado`;
              setAlertasBanner(prev2 => [
                ...prev2.filter(a => a.id !== p.id),
                { id: p.id, folio: p.folio, nivel: nuevoNivel, desc }
              ]);
              // Disparar sonido y/o voz usando refs (sin stale closure)
              if (sonidoActivoRef.current) reproducirBeep();
              if (vozActivaRef.current) {
                setTimeout(() => hablarAlerta(p.folio, nuevoNivel), sonidoActivoRef.current ? 900 : 0);
              }
              // Guardar el nivel en la BD
              axios.patch(`${API_URL}/api/pedidos/${p.id}/estado`, {
                estado: p.estado,
                alerta_retraso: nuevoNivel
              }).catch(e => console.error('Error sincronizando alerta', e));
            }
            return { ...p, alerta_retraso: nuevoNivel };
          }
          return p;
        });
        return cambiaron ? actualizados : prev;
      });
    }, 10000);

    return () => clearInterval(intervalo);
  }, []);

  // Helper: devuelve color, label y % según el tiempo transcurrido
  const getAlertaInfo = (pedido) => {
    const enSeguimiento = ['PREPARANDO', 'HORNEANDO', 'LISTO_ENTREGA'].includes(pedido.estado);
    if (!enSeguimiento) return null;

    const tiempoEstimado = parseInt(pedido.tiempo_estimado_min) || 20;
    const enHorno = pedido.estado === 'HORNEANDO';
    const listo = pedido.estado === 'LISTO_ENTREGA';

    // Sin inicio registrado (pedido antiguo antes de la migración)
    if (!pedido.inicio_preparacion) {
      const iconoDefault = listo ? '✅' : enHorno ? '🔥' : '⏳';
      const labelDefault = listo
        ? `✅ Listo (estimado: ${tiempoEstimado} min)`
        : enHorno ? `🔥 En horno (estimado: ${tiempoEstimado} min)`
        : `⏳ Iniciando... (estimado: ${tiempoEstimado} min)`;
      return { color: '#74b9ff', bg: 'rgba(116,185,255,0.08)', label: labelDefault, pct: 0, border: '#74b9ff', pulse: false };
    }

    const elapsed = (Date.now() - new Date(pedido.inicio_preparacion).getTime()) / 60000;
    const pct = elapsed / tiempoEstimado;
    const nivel = pedido.alerta_retraso || 'NORMAL';
    const minRestantes = Math.max(0, tiempoEstimado - elapsed).toFixed(0);
    const minPasados = Math.max(0, elapsed - tiempoEstimado).toFixed(0);
    const minTranscurridos = elapsed.toFixed(0);

    // En LISTO_ENTREGA: resumen final del tiempo invertido
    if (listo) {
      // Verificación en VIVO (no solo del estado guardado)
      const isExcedido = elapsed >= tiempoEstimado + 5 || nivel === 'EXCEDIDO';
      const isAdvertencia = !isExcedido && (pct >= 0.8 || nivel === 'ADVERTENCIA');
      const color = isExcedido ? '#e74c3c' : isAdvertencia ? '#f39c12' : '#00b894';
      const icono = isExcedido ? '⛔' : '✅';
      const excededLabel = isExcedido ? ` (+${minPasados} min sobre estimado)` : '';
      return {
        color,
        bg: isExcedido ? 'rgba(231,76,60,0.12)' : 'rgba(0,184,148,0.08)',
        label: `${icono} Tiempo total: ${minTranscurridos} min${excededLabel}`,
        pct: Math.min(pct * 100, 100),
        border: color,
        pulse: isExcedido
      };
    }

    // En HORNEANDO: tiempo total desde inicio de preparación
    if (enHorno) {
      // Verificación en VIVO
      const isExcedido = elapsed >= tiempoEstimado + 5 || nivel === 'EXCEDIDO';
      const isAdvertencia = !isExcedido && (pct >= 0.8 || nivel === 'ADVERTENCIA');
      const color = isExcedido ? '#e74c3c' : isAdvertencia ? '#f39c12' : '#fd79a8';
      const bg = isExcedido ? 'rgba(231,76,60,0.12)' : 'rgba(253,121,168,0.08)';
      const icono = isExcedido ? '⛔' : '🔥';
      return {
        color, bg,
        label: `${icono} Horno: ${minTranscurridos} min total (estimado ${tiempoEstimado} min)`,
        pct: Math.min(pct * 100, 100),
        border: color,
        pulse: isExcedido
      };
    }

    // En PREPARANDO: color según nivel de alerta
    if (nivel === 'EXCEDIDO' || elapsed >= tiempoEstimado + 5) {
      return { color: '#e74c3c', bg: 'rgba(231,76,60,0.12)', label: `⛔ +${minPasados} min EXCEDIDO (${minTranscurridos}/${tiempoEstimado} min)`, pct: 100, border: '#e74c3c', pulse: true };
    } else if (nivel === 'ADVERTENCIA' || pct >= 0.8) {
      return { color: '#f39c12', bg: 'rgba(243,156,18,0.10)', label: `⚠️ ${minTranscurridos}/${tiempoEstimado} min — faltan ${minRestantes} min`, pct: Math.min(pct * 100, 100), border: '#f39c12', pulse: false };
    } else {
      return { color: '#00b894', bg: 'rgba(0,184,148,0.08)', label: `⏱ ${minTranscurridos}/${tiempoEstimado} min — faltan ${minRestantes} min`, pct: Math.min(pct * 100, 100), border: '#00b894', pulse: false };
    }
  };

  // Descartar una alerta del banner
  const dismissAlerta = (id) => {
    setAlertasBanner(prev => prev.filter(a => a.id !== id));
  };


  const cancelarPedido = (id, folio) => {
    setPedidoACancelar({ id, folio });
    setMotivoCancelacion('');
    setCancelModalOpen(true);
  };

  // Confirmar la cancelación con motivo opcional
  const confirmarCancelacion = async () => {
    if (!pedidoACancelar) return;
    const { id } = pedidoACancelar;
    setPedidos(pedidos.filter(p => p.id_local !== id));
    setCancelModalOpen(false);
    try {
      await axios.patch(`${API_URL}/api/pedidos/${id}/estado`, {
        estado: 'CANCELADO',
        motivo_cancelacion: motivoCancelacion.trim() || null
      });
    } catch (e) {
      console.error('Error al cancelar pedido', e);
    }
    setPedidoACancelar(null);
    setMotivoCancelacion('');
  };

  // Función auxiliar para renderizar las tarjetas según su estado
  const renderColumna = (estadoFiltro, titulo, emoji) => {
    const pedidosColumna = pedidos.filter(p => p.estado === estadoFiltro);

    return (
      <div className="kanban-column">
        <div className="col-header">{emoji} {titulo} ({pedidosColumna.length})</div>
        
        {pedidosColumna.map((pedido) => {
          const alerta = getAlertaInfo(pedido);
          const cardBorder = alerta ? alerta.border : (estadoFiltro === 'PENDIENTE' ? '#e74c3c' : '#3a3a5c');
          const cardBg = alerta ? alerta.bg : '';

          return (
          <div
            key={pedido.id_local}
            className={`order-card ${estadoFiltro === 'PENDIENTE' ? 'danger' : ''}`}
            style={{ borderColor: cardBorder, background: cardBg || undefined,
              animation: alerta?.pulse ? 'pulseRed 1.5s ease-in-out infinite' : undefined }}
          >
            <div className="order-card-header">
              <span className="folio">#{pedido.folio}</span>
              <span className="timer" style={{ color: alerta ? alerta.color : (estadoFiltro === 'PENDIENTE' ? '#e74c3c' : '#00b894') }}>
                {/* En estados activos mostrar la hora en que entró a preparación, no la de creación */}
                {pedido.inicio_preparacion
                  ? new Date(pedido.inicio_preparacion).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : pedido.hora_ingreso}
              </span>
            </div>

            {/* BARRA DE PROGRESO DE TIEMPO - solo en PREPARANDO */}
            {alerta && (
              <div style={{ margin: '8px 0', padding: '0 2px' }}>
                <div style={{ fontSize: '11px', color: alerta.color, marginBottom: '3px', fontWeight: '600' }}>
                  {alerta.label}
                </div>
                <div style={{ height: '4px', background: '#2a2a3e', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${alerta.pct}%`, background: alerta.color, borderRadius: '2px', transition: 'width 1s linear' }} />
                </div>
              </div>
            )}

            <ul className="order-items">
              {pedido.items && pedido.items.map((item, idx) => (
                <div key={idx} style={{ marginBottom: '8px' }}>
                  <li><strong>{item.cantidad}x {item.nombre || (item.tipo === 'PAQUETE' ? 'Combo' : 'Producto')}</strong></li>
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
              style={{ backgroundColor: estadoFiltro === 'HORNEANDO' ? '#00b894' : estadoFiltro === 'LISTO_ENTREGA' ? '#0984e3' : '' }}
              onClick={() => avanzarEstado(pedido.id_local, pedido.estado)}
            >
              {estadoFiltro === 'PENDIENTE' && 'Empezar a Preparar'}
              {estadoFiltro === 'PREPARANDO' && 'Meter al Horno'}
              {estadoFiltro === 'HORNEANDO' && 'Marcar como Listo'}
              {estadoFiltro === 'LISTO_ENTREGA' && 'Despachar ✅'}
            </button>
            <button
              onClick={() => cancelarPedido(pedido.id_local, pedido.folio)}
              style={{ width: '100%', marginTop: '6px', padding: '8px', borderRadius: '6px', border: '1px solid #e74c3c', background: 'transparent', color: '#e74c3c', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}
            >
              🚫 Cancelar Pedido
            </button>
          </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="kds-container">
      {/* ========== HEADER ========== */}
      <div className="kds-header">
        <h2 style={{ margin: 0 }}>🍕 Monitor KDS - Cocina</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>

          {/* Botón de configuración de sonido */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowSettings(s => !s)}
              style={{ background: showSettings ? '#3a3a5c' : 'transparent', border: '1.5px solid #3a3a5c', borderRadius: '8px', padding: '6px 12px', color: '#a0a0c0', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '6px' }}
              title="Configuración de alertas"
            >
              ⚙️ <span style={{ fontSize: '12px', fontWeight: '600' }}>Alertas</span>
            </button>

            {/* Panel de configuración desplegable */}
            {showSettings && (
              <div style={{ position: 'absolute', right: 0, top: '110%', background: '#2a2a40', border: '1px solid #3a3a5c', borderRadius: '12px', padding: '16px', minWidth: '220px', zIndex: 1000, boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                <p style={{ margin: '0 0 12px', color: '#a0a0c0', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>Configuración de Alertas</p>

                {/* Toggle: Sonido de beep */}
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', cursor: 'pointer' }}>
                  <span style={{ color: '#e0e0f0', fontSize: '14px' }}>🔔 Sonido de alerta</span>
                  <div
                    onClick={() => setSonidoActivo(v => !v)}
                    style={{ width: '40px', height: '22px', borderRadius: '11px', background: sonidoActivo ? '#00b894' : '#555', position: 'relative', transition: '0.3s', cursor: 'pointer', flexShrink: 0 }}
                  >
                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '2px', left: sonidoActivo ? '20px' : '2px', transition: '0.3s' }} />
                  </div>
                </label>

                {/* Toggle: Voz */}
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', cursor: 'pointer' }}>
                  <span style={{ color: '#e0e0f0', fontSize: '14px' }}>🗣️ Alerta de voz</span>
                  <div
                    onClick={() => setVozActiva(v => !v)}
                    style={{ width: '40px', height: '22px', borderRadius: '11px', background: vozActiva ? '#00b894' : '#555', position: 'relative', transition: '0.3s', cursor: 'pointer', flexShrink: 0 }}
                  >
                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '2px', left: vozActiva ? '20px' : '2px', transition: '0.3s' }} />
                  </div>
                </label>

                {/* Botón de prueba */}
                <button
                  onClick={() => { if (sonidoActivo) reproducirBeep(); if (vozActiva) setTimeout(() => hablarAlerta('PRUEBA', 'EXCEDIDO'), sonidoActivo ? 900 : 0); }}
                  style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #6c5ce7', background: 'transparent', color: '#a29bfe', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}
                >
                  🔊 Probar sonido
                </button>
              </div>
            )}
          </div>

          {/* Indicador de conexión */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: isConnected ? '#00b894' : '#e74c3c' }}></div>
            <span style={{ fontWeight: 'bold' }}>{isConnected ? 'Conectado (En vivo)' : 'Desconectado'}</span>
          </div>
        </div>
      </div>

      {/* BANNER DE ALERTAS POR RETRASO */}
      {alertasBanner.length > 0 && (
        <div style={{ padding: '0 20px 10px 20px' }}>
          {alertasBanner.map(alerta => (
            <div key={`alerta-${alerta.id}`} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 16px', marginBottom: '6px', borderRadius: '8px',
              background: alerta.nivel === 'EXCEDIDO' ? 'rgba(231,76,60,0.18)' : 'rgba(243,156,18,0.15)',
              border: `1px solid ${alerta.nivel === 'EXCEDIDO' ? '#e74c3c' : '#f39c12'}`,
              animation: alerta.nivel === 'EXCEDIDO' ? 'pulseRed 1.5s ease-in-out infinite' : undefined
            }}>
              <span style={{ color: alerta.nivel === 'EXCEDIDO' ? '#e74c3c' : '#f39c12', fontWeight: '700', fontSize: '13px' }}>
                {alerta.nivel === 'EXCEDIDO' ? '⛔' : '⚠️'} Pedido #{alerta.folio} — {alerta.desc}
              </span>
              <button onClick={() => dismissAlerta(alerta.id)}
                style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', fontSize: '16px', lineHeight: 1 }}>
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="kanban-board">
        {renderColumna('PENDIENTE', 'Entrantes', '📋')}
        {renderColumna('PREPARANDO', 'En Mesa', '👨‍🍳')}
        {renderColumna('HORNEANDO', 'Horno', '🔥')}
        {renderColumna('LISTO_ENTREGA', 'Para Entrega', '✅')}
      </div>

      {/* =========================================== */}
      {/* MODAL DE CANCELACIÓN CON JUSTIFICACIÓN      */}
      {/* =========================================== */}
      {cancelModalOpen && pedidoACancelar && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#1e1e2e', border: '1px solid #e74c3c', borderRadius: '16px', padding: '30px', maxWidth: '420px', width: '90%', boxShadow: '0 20px 60px rgba(231,76,60,0.3)', animation: 'popIn 0.2s ease-out' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <span style={{ fontSize: '36px' }}>🚫</span>
              <div>
                <h3 style={{ margin: 0, color: '#e74c3c', fontSize: '20px' }}>Cancelar Pedido</h3>
                <p style={{ margin: 0, color: '#a0a0b0', fontSize: '13px' }}>
                  {pedidoACancelar.folio} — Esta acción no se puede deshacer
                </p>
              </div>
            </div>

            {/* Justificación */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', color: '#a0a0b0', fontSize: '13px', marginBottom: '6px', fontWeight: '600' }}>
                Motivo de cancelación <span style={{ color: '#555', fontWeight: 'normal' }}>(opcional)</span>
              </label>
              <textarea
                value={motivoCancelacion}
                onChange={(e) => setMotivoCancelacion(e.target.value)}
                placeholder="Ej: Cliente canceló, error en el pedido, ingrediente faltante..."
                rows={3}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #444', background: '#2a2a3e', color: '#e0e0f0', fontSize: '14px', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }}
              />
            </div>

            {/* Botones */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => { setCancelModalOpen(false); setPedidoACancelar(null); }}
                style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1.5px solid #444', background: 'transparent', color: '#a0a0b0', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}
              >
                Volver
              </button>
              <button
                onClick={confirmarCancelacion}
                style={{ flex: 2, padding: '12px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #e74c3c, #c0392b)', color: '#fff', cursor: 'pointer', fontWeight: '700', fontSize: '15px', boxShadow: '0 4px 15px rgba(231,76,60,0.4)' }}
              >
                🚫 Confirmar Cancelación
              </button>
            </div>
          </div>
          <style>{`@keyframes popIn { 0% { opacity:0; transform:scale(0.85); } 100% { opacity:1; transform:scale(1); } }`}</style>
        </div>
      )}

    </div>
  );
};

export default CocinaKDS;

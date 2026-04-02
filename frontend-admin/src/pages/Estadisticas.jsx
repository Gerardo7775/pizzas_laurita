import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import './BackOffice.css';

const COLORES_PASTEL = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#ff7f50', '#20b2aa'];

const Estadisticas = () => {
  const [loading, setLoading] = useState(true);
  
  // Filtros de fecha
  const [rango, setRango] = useState('HOY'); // HOY, SEMANA, MES, CUSTOM
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Estados de datos
  const [kpis, setKpis] = useState(null);
  const [horario, setHorario] = useState([]);
  const [topProductos, setTopProductos] = useState([]);
  const [kpisInventario, setKpisInventario] = useState({ mas_usados: [], riesgo_inactividad: [] });

  // Cambiar rango predeterminado
  useEffect(() => {
    const hoy = new Date();
    let start = '';
    let end = hoy.toISOString().split('T')[0];

    if (rango === 'HOY') {
      start = hoy.toISOString().split('T')[0];
    } else if (rango === 'SEMANA') {
      const semanaPasada = new Date();
      semanaPasada.setDate(hoy.getDate() - 7);
      start = semanaPasada.toISOString().split('T')[0];
    } else if (rango === 'MES') {
      const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      start = inicioMes.toISOString().split('T')[0];
    }

    if (rango !== 'CUSTOM') {
      setStartDate(start);
      setEndDate(end);
    }
  }, [rango]);

  // Cargar datos
  const API_URL = import.meta.env.VITE_API_URL;

  const fetchEstadisticas = async () => {
    setLoading(true);
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      // Usando request en paralelo localmente
      const [resKpis, resHorario, resTop, resInv] = await Promise.all([
        axios.get(`${API_URL}/api/estadisticas/kpis`, { params }),
        axios.get(`${API_URL}/api/estadisticas/horario`, { params }),
        axios.get(`${API_URL}/api/estadisticas/top-productos`, { params }),
        axios.get(`${API_URL}/api/estadisticas/inventario`, { params })
      ]);

      setKpis(resKpis.data.data);
      setHorario(resHorario.data.data);
      setTopProductos(resTop.data.data);
      setKpisInventario(resInv.data.data);
    } catch (e) {
      console.error('Error cargando estadísticas', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if ((rango !== 'CUSTOM') || (rango === 'CUSTOM' && startDate && endDate)) {
        fetchEstadisticas();
    }
  }, [startDate, endDate]);

  return (
    <div className="admin-container" style={{ padding: '30px', backgroundColor: '#f4f7f6', height: '100vh', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ color: '#2d3436', margin: 0 }}>📈 Analíticas y Rendimiento</h1>
        <button onClick={fetchEstadisticas} className="btn btn-primary" style={{ backgroundColor: '#0984e3' }}>
          🔄 Actualizar Datos
        </button>
      </div>

      {/* --- PANEL DE FILTROS --- */}
      <div style={{ display: 'flex', gap: '15px', padding: '15px', backgroundColor: 'white', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginBottom: '30px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '150px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px', color: '#636e72' }}>Rango Analítico</label>
          <select value={rango} onChange={e => setRango(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #dfe6e9', outline: 'none' }}>
            <option value="HOY">Hoy</option>
            <option value="SEMANA">Últimos 7 Días</option>
            <option value="MES">Mes Actual</option>
            <option value="CUSTOM">Personalizado...</option>
          </select>
        </div>
        
        {rango === 'CUSTOM' && (
          <>
            <div style={{ flex: 1, minWidth: '150px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>Desde:</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #dfe6e9' }} />
            </div>
            <div style={{ flex: 1, minWidth: '150px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>Hasta:</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #dfe6e9' }} />
            </div>
          </>
        )}
      </div>

      {loading ? (
        <h2 style={{ padding: '20px', color: '#636e72' }}>Analizando miles de registros... ⏳</h2>
      ) : (
        <>
          {/* --- KPIs PRINCIPALES --- */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px', borderLeft: '5px solid #00b894', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
              <p style={{ margin: '0 0 10px 0', color: '#636e72', fontWeight: 'bold', fontSize: '13px' }}>INGRESOS BRUTOS</p>
              <h2 style={{ margin: 0, fontSize: '28px', color: '#2d3436' }}>${kpis?.ingresos.toFixed(2) || '0.00'}</h2>
              <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#b2bec3' }}>Ignorando cancelaciones</p>
            </div>
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px', borderLeft: '5px solid #0984e3', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
              <p style={{ margin: '0 0 10px 0', color: '#636e72', fontWeight: 'bold', fontSize: '13px' }}>TICKETS EXITOSOS</p>
              <h2 style={{ margin: 0, fontSize: '28px', color: '#2d3436' }}>{kpis?.total_entregados || 0}</h2>
              <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#b2bec3' }}>Pedidos despachados</p>
            </div>
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px', borderLeft: '5px solid #d63031', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
              <p style={{ margin: '0 0 10px 0', color: '#636e72', fontWeight: 'bold', fontSize: '13px' }}>TASA DE CANCELACIÓN</p>
              <h2 style={{ margin: 0, fontSize: '28px', color: '#2d3436' }}>{kpis?.tasa_cancelacion || 0}%</h2>
              <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#b2bec3' }}>{kpis?.cancelados || 0} cancelados en total</p>
            </div>
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px', borderLeft: '5px solid #fdcb6e', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
              <p style={{ margin: '0 0 10px 0', color: '#636e72', fontWeight: 'bold', fontSize: '13px' }}>TIEMPO PROMEDIO (COCINA)</p>
              <h2 style={{ margin: 0, fontSize: '28px', color: '#2d3436' }}>{kpis?.tiempo_promedio_min || 0} min</h2>
              <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#d63031', fontWeight: 'bold' }}>{kpis?.tasa_retraso || 0}% de los pedidos sufren retraso</p>
            </div>
          </div>

          {/* --- GRÁFICOS --- */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '20px', marginBottom: '30px' }}>
            
            {/* Gráfico 1: Picos Horarios */}
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
              <h3 style={{ margin: '0 0 20px 0', color: '#2d3436' }}>Picos de Venta por Hora (Demanda)</h3>
              {horario.length === 0 ? (
                <p style={{ color: '#b2bec3' }}>No hay datos suficientes en este rango.</p>
              ) : (
                <div style={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer>
                    <LineChart data={horario}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                      <XAxis dataKey="nombre" axisLine={false} tickLine={false} tick={{fill: '#636e72', fontSize: 12}} />
                      <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{fill: '#636e72', fontSize: 12}} />
                      <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{fill: '#636e72', fontSize: 12}} />
                      <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }} />
                      <Legend />
                      <Line yAxisId="left" type="monotone" dataKey="ordenes" name="Número de Pedidos" stroke="#0984e3" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
                      <Line yAxisId="right" type="monotone" dataKey="ingresos" name="Ingresos ($)" stroke="#00b894" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Gráfico 2: Top Productos */}
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
              <h3 style={{ margin: '0 0 20px 0', color: '#2d3436' }}>Productos Más Vendidos</h3>
              {topProductos.length === 0 ? (
                <p style={{ color: '#b2bec3' }}>No hay ventas registradas.</p>
              ) : (
                <div style={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={topProductos}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {topProductos.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORES_PASTEL[index % COLORES_PASTEL.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value, name) => [`${value} unidades`, name]} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* --- KPI MATERIA PRIMA E INVENTARIO --- */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '20px', marginBottom: '30px' }}>
            
            {/* Ingredientes Más Consumidos */}
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
              <h3 style={{ margin: '0 0 20px 0', color: '#2d3436' }}>Materia Prima Más Utilizada</h3>
              {kpisInventario.mas_usados.length === 0 ? (
                <p style={{ color: '#b2bec3' }}>Sin datos de consumo.</p>
              ) : (
                <div style={{ width: '100%', height: 250 }}>
                  <ResponsiveContainer>
                    <BarChart layout="vertical" data={kpisInventario.mas_usados} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#eee" />
                      <XAxis type="number" axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="nombre" width={100} axisLine={false} tickLine={false} />
                      <Tooltip formatter={(value, name, props) => [`${value} ${props.payload.unidad}`, 'Consumo']} cursor={{fill: 'transparent'}} />
                      <Bar dataKey="consumo" fill="#6c5ce7" radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Riesgo de Inactividad (Caducidad) */}
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '2px solid #ff7675' }}>
              <h3 style={{ margin: '0 0 10px 0', color: '#d63031' }}>⚠️ Riesgo por Inactividad (Posible Caducidad)</h3>
              <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#636e72' }}>Ingredientes sin movimientos en almacén que conservan stock activo.</p>
              
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '10px', borderBottom: '1px solid #dfe6e9' }}>Materia Prima</th>
                    <th style={{ padding: '10px', borderBottom: '1px solid #dfe6e9' }}>Stock Rezagado</th>
                    <th style={{ padding: '10px', borderBottom: '1px solid #dfe6e9', color: '#d63031' }}>Días sin Uso</th>
                  </tr>
                </thead>
                <tbody>
                  {kpisInventario.riesgo_inactividad.length === 0 ? (
                    <tr>
                      <td colSpan="3" style={{ padding: '15px', textAlign: 'center', color: '#b2bec3' }}>Todo el inventario tiene movimiento reciente.</td>
                    </tr>
                  ) : (
                    kpisInventario.riesgo_inactividad.map((req, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px dashed #eee' }}>
                        <td style={{ padding: '12px' }}><strong>{req.nombre}</strong></td>
                        <td style={{ padding: '12px' }}>{req.stock_almacenado} {req.unidad}</td>
                        <td style={{ padding: '12px', color: '#d63031', fontWeight: 'bold' }}>Hace {req.dias_inactivo} días</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

          </div>
        </>
      )}
    </div>
  );
};

export default Estadisticas;

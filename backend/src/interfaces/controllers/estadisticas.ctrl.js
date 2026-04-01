const db = require('../../config/database');

// Función auxiliar para agregar rango paramétrico (Desde/Hasta)
const buildDateFilter = (queryParams, columnPrefix = 'p') => {
    let filter = '';
    const values = [];
    if (queryParams.startDate) {
        values.push(queryParams.startDate + ' 00:00:00');
        filter += ` AND ${columnPrefix}.fecha_creacion >= $${values.length}`;
    }
    if (queryParams.endDate) {
        values.push(queryParams.endDate + ' 23:59:59');
        filter += ` AND ${columnPrefix}.fecha_creacion <= $${values.length}`;
    }
    return { filter, values };
};

exports.getKpisGlobales = async (req, res) => {
    try {
        const { filter, values } = buildDateFilter(req.query, 'p');

        // 1. KPIs Generales de Ventas (Ignorando cancelados)
        const ventasQuery = `
            SELECT 
                COALESCE(SUM(total), 0) AS ingresos_totales,
                COUNT(id) AS total_pedidos
            FROM pedidos p
            WHERE estado != 'CANCELADO' ${filter}
        `;
        
        // 2. Tasa de Cancelación
        const canceladosQuery = `
            SELECT COUNT(id) AS ordenes_canceladas
            FROM pedidos p
            WHERE estado = 'CANCELADO' ${filter}
        `;

        // 3. Métricas de Tiempos (Solo entregados y despachados)
        const tiemposQuery = `
            SELECT 
                COUNT(id) AS total_entregados,
                COALESCE(AVG(EXTRACT(EPOCH FROM (fecha_entrega - fecha_creacion)) / 60), 0) AS tiempo_promedio_min,
                COUNT(CASE WHEN (EXTRACT(EPOCH FROM (fecha_entrega - fecha_creacion)) / 60) > tiempo_estimado_min THEN 1 END) AS pedidos_retrasados
            FROM pedidos p
            WHERE estado = 'ENTREGADO' AND fecha_entrega IS NOT NULL ${filter}
        `;

        const [vRow, cRow, tRow] = await Promise.all([
            db.query(ventasQuery, values),
            db.query(canceladosQuery, values),
            db.query(tiemposQuery, values)
        ]);

        const ventas = vRow.rows[0];
        const cancelados = cRow.rows[0];
        const tiempos = tRow.rows[0];

        // Cálculos estructurados
        const totalRegistros = parseInt(ventas.total_pedidos) + parseInt(cancelados.ordenes_canceladas);
        const tasaCancelacion = totalRegistros > 0 ? ((cancelados.ordenes_canceladas / totalRegistros) * 100).toFixed(1) : 0;
        const totalEntregados = parseInt(tiempos.total_entregados);
        const tasaRetraso = totalEntregados > 0 ? ((parseInt(tiempos.pedidos_retrasados) / totalEntregados) * 100).toFixed(1) : 0;

        res.json({
            success: true,
            data: {
                ingresos: parseFloat(ventas.ingresos_totales),
                tickets: parseInt(ventas.total_pedidos),
                cancelados: parseInt(cancelados.ordenes_canceladas),
                tasa_cancelacion: tasaCancelacion,
                tiempo_promedio_min: parseFloat(tiempos.tiempo_promedio_min).toFixed(0),
                pedidos_retrasados: parseInt(tiempos.pedidos_retrasados),
                tasa_retraso: tasaRetraso,
                total_entregados: totalEntregados
            }
        });
    } catch (e) {
        console.error('Error calculando KPIs:', e);
        res.status(500).json({ success: false, message: 'Error interno en estadísticas' });
    }
};

exports.getDistribucionHoraria = async (req, res) => {
    try {
        const { filter, values } = buildDateFilter(req.query, 'p');

        const query = `
            SELECT 
                EXTRACT(HOUR FROM p.fecha_creacion) AS hora,
                COUNT(p.id) AS numero_ordenes,
                COALESCE(SUM(p.total), 0) AS ingresos_generados
            FROM pedidos p
            WHERE p.estado != 'CANCELADO' ${filter}
            GROUP BY hora
            ORDER BY hora ASC
        `;

        const result = await db.query(query, values);
        
        // Formatear hora de 24h a 12h para la gráfica
        const chartData = result.rows.map(r => {
            const h = parseInt(r.hora);
            const formato = h >= 12 ? 'PM' : 'AM';
            const hora12 = h % 12 === 0 ? 12 : h % 12;
            return {
                nombre: `${hora12}:00 ${formato}`,
                hora_militar: h,
                ordenes: parseInt(r.numero_ordenes),
                ingresos: parseFloat(r.ingresos_generados)
            };
        });

        res.json({ success: true, data: chartData });
    } catch (e) {
        console.error('Error en distribución horaria:', e);
        res.status(500).json({ success: false, message: 'Error interno' });
    }
};

exports.getTopProductos = async (req, res) => {
    try {
        const { filter, values } = buildDateFilter(req.query, 'p');

        // Calcula productos individuales y mitades de pizza
        // IGNORA paquetes por la complejidad dinámica, solo suma directo de los items sueltos. (Una estimación robusta)
        const query = `
            SELECT 
                pr.nombre AS nombre_producto, 
                SUM(dp.cantidad) AS cantidad_vendida,
                SUM(dp.subtotal) AS ingresos
            FROM detalle_pedido dp
            JOIN pedidos p ON dp.pedido_id = p.id
            JOIN presentaciones pz ON dp.presentacion_id = pz.id
            JOIN productos pr ON pz.producto_id = pr.id
            WHERE p.estado != 'CANCELADO' AND dp.presentacion_id IS NOT NULL ${filter}
            GROUP BY pr.id, pr.nombre
            ORDER BY cantidad_vendida DESC
            LIMIT 7
        `;

        const result = await db.query(query, values);
        const data = result.rows.map(r => ({
            name: r.nombre_producto,
            value: parseInt(r.cantidad_vendida),
            ingresos: parseFloat(r.ingresos)
        }));

        res.json({ success: true, data });
    } catch (e) {
        console.error('Error al generar Top Productos:', e);
        res.status(500).json({ success: false, message: 'Error interno' });
    }
};

exports.getInventarioKpis = async (req, res) => {
    try {
        const { filter, values } = buildDateFilter(req.query, 'p');

        // 1. Ingredientes más consumidos (usando historial de ordenes y su receta base)
        const rawConsumedQuery = `
            SELECT 
                i.nombre,
                i.unidad_receta,
                SUM(dp.cantidad * r.cantidad_requerida) AS total_consumido
            FROM detalle_pedido dp
            JOIN pedidos p ON dp.pedido_id = p.id
            JOIN recetas r ON dp.presentacion_id = r.presentacion_id
            JOIN ingredientes i ON r.ingrediente_id = i.id
            WHERE p.estado = 'ENTREGADO' ${filter}
            GROUP BY i.id, i.nombre, i.unidad_receta
            ORDER BY total_consumido DESC
            LIMIT 5
        `;
        
        // 2. Ingredientes con mayor tiempo estacionado / en riesgo (basado en ultima actualización y stock actual)
        // PostgreSQL: EXTRACT(DAY FROM NOW() - ultima_actualizacion)
        const inRiskQuery = `
            SELECT 
                nombre,
                unidad_receta,
                stock_actual,
                EXTRACT(DAY FROM (NOW() - ultima_actualizacion)) AS dias_estacionado
            FROM ingredientes
            WHERE stock_actual > 0
            ORDER BY dias_estacionado DESC, stock_actual DESC
            LIMIT 5
        `;

        const [consumidos, riesgos] = await Promise.all([
            db.query(rawConsumedQuery, values),
            db.query(inRiskQuery) // No lleva filtros de fecha (es stock real-time)
        ]);

        res.json({
            success: true,
            data: {
                mas_usados: consumidos.rows.map(r => ({
                    nombre: r.nombre, 
                    consumo: parseFloat(r.total_consumido).toFixed(2),
                    unidad: r.unidad_receta
                })),
                riesgo_inactividad: riesgos.rows.map(r => ({
                    nombre: r.nombre,
                    dias_inactivo: Math.max(0, parseInt(r.dias_estacionado) || 0),
                    stock_almacenado: parseFloat(r.stock_actual).toFixed(2),
                    unidad: r.unidad_receta
                }))
            }
        });
    } catch (e) {
        console.error('Error calculando KPIs de inventario:', e);
        res.status(500).json({ success: false, message: 'Error interno' });
    }
};

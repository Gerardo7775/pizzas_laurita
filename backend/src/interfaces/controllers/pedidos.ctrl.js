/**
 * Controlador de Pedidos
 * Capa de Interfaces
 * 
 * Se encarga exclusivamente de mapear (req, res) e invocar
 * a la capa de Aplicación (Servicios).
 */

const { prepararPedidoUseCase } = require('../../application/services/pedido.service');
const { descontarStockPorPedido } = require('../../application/services/stock.service');
const db = require('../../config/database');
const socketManager = require('../../infrastructure/websockets/socketManager');

module.exports = {
  crearPedido: async (req, res) => {
    try {
      const payload = req.body;
      const io = socketManager.getIO();
      
      const exito = await prepararPedidoUseCase(payload, io);

      res.status(201).json({ mensaje: 'Pedido recibido y guardado con exito' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  },

    getHistorialDia: async (req, res) => {
        // ... (Logica Existente de Historial) ...
        try {
            const result = await db.query(`
                SELECT id, folio, cliente_nombre, estado, total, fecha_creacion, fecha_entrega 
                FROM pedidos 
                ORDER BY fecha_creacion DESC
            `);
            const totalVentas = result.rows.reduce((sum, pedido) => {
                return pedido.estado !== 'CANCELADO' ? sum + parseFloat(pedido.total) : sum;
            }, 0);
            res.json({ success: true, data: { pedidos: result.rows, resumen: { total_dia: totalVentas, cantidad_pedidos: result.rows.length } } });
        } catch (error) {
            console.error('Error al obtener historial:', error);
            res.status(500).json({ success: false, message: 'Error interno' });
        }
    },

    getPedidosCocina: async (req, res) => {
        try {
            const query = `
                SELECT 
                    p.id,
                    p.id AS id_local,
                    p.folio,
                    p.cliente_nombre,
                    p.estado,
                    p.tiempo_estimado_min,
                    p.inicio_preparacion,
                    p.alerta_retraso,
                    to_char(p.fecha_creacion, 'HH24:MI') AS hora_ingreso,
                    COALESCE(
                        json_agg(
                            json_build_object(
                                'tipo', CASE WHEN dp.paquete_id IS NOT NULL THEN 'PAQUETE' ELSE 'PRODUCTO_NORMAL' END,
                                'cantidad', dp.cantidad,
                                'nombre', COALESCE(paq.nombre, prod.nombre, 'Producto'),
                                'presentacion_nombre', COALESCE(tam.nombre, ''),
                                'sub_items', (
                                    SELECT COALESCE(
                                        json_agg(
                                            json_build_object(
                                                'cantidad', sub_dp.cantidad,
                                                'nombre', COALESCE(sub_prod.nombre, 'Producto'),
                                                'presentacion_nombre', COALESCE(sub_tam.nombre, '')
                                            )
                                        ),
                                        '[]'::json
                                    )
                                    FROM detalle_pedido sub_dp
                                    LEFT JOIN presentaciones sub_pres ON sub_dp.presentacion_id = sub_pres.id
                                    LEFT JOIN productos sub_prod ON sub_pres.producto_id = sub_prod.id
                                    LEFT JOIN tamanos sub_tam ON sub_pres.tamano_id = sub_tam.id
                                    WHERE sub_dp.parent_detalle_id = dp.id
                                )
                            )
                        ) FILTER (WHERE dp.id IS NOT NULL AND dp.parent_detalle_id IS NULL),
                        '[]'::json
                    ) AS items
                FROM pedidos p
                LEFT JOIN detalle_pedido dp ON p.id = dp.pedido_id AND dp.parent_detalle_id IS NULL
                LEFT JOIN paquetes paq ON dp.paquete_id = paq.id
                LEFT JOIN presentaciones pres ON dp.presentacion_id = pres.id
                LEFT JOIN productos prod ON pres.producto_id = prod.id
                LEFT JOIN tamanos tam ON pres.tamano_id = tam.id
                WHERE p.estado IN ('PENDIENTE', 'PREPARANDO', 'HORNEANDO', 'LISTO_ENTREGA')
                GROUP BY p.id
                ORDER BY p.fecha_creacion ASC
            `;
            const result = await db.query(query);
            res.json({ success: true, data: result.rows });
        } catch (error) {
            console.error('Error al cargar pedidos activos para KDS:', error);
            // Mandar el error detallado para ayudar al diagnóstico
            res.status(500).json({ success: false, message: error.message });
        }
    },

    actualizarEstadoPedido: async (req, res) => {
        try {
            const { id } = req.params;
            const { estado, motivo_cancelacion, alerta_retraso } = req.body;
            
            const estadosPermitidos = ['PENDIENTE', 'PREPARANDO', 'HORNEANDO', 'LISTO_ENTREGA', 'ENTREGADO', 'CANCELADO'];
            if (!estadosPermitidos.includes(estado)) {
                return res.status(400).json({ success: false, message: 'Estado inválido' });
            }

            // Construir la query dinámicamente según el estado
            let setClauses = ['estado = $1'];
            let values = [estado];
            let paramIdx = 2;

            // Si entra a PREPARANDO, registrar el timestamp de inicio
            if (estado === 'PREPARANDO') {
                setClauses.push(`inicio_preparacion = NOW()`);
                setClauses.push(`alerta_retraso = 'NORMAL'`);
            }

            // Si SALE de PREPARANDO → calcular tiempo real y excedido en SQL
            // (HORNEANDO es el siguiente paso; también aplica si pasa a CANCELADO)
            if (estado === 'HORNEANDO' || estado === 'CANCELADO') {
                setClauses.push(`
                    tiempo_real_min = CASE 
                        WHEN inicio_preparacion IS NOT NULL 
                        THEN ROUND(EXTRACT(EPOCH FROM (NOW() - inicio_preparacion)) / 60, 2)
                        ELSE NULL 
                    END
                `);
                setClauses.push(`
                    tiempo_excedido_min = CASE 
                        WHEN inicio_preparacion IS NOT NULL 
                        THEN GREATEST(0, ROUND(EXTRACT(EPOCH FROM (NOW() - inicio_preparacion)) / 60 - tiempo_estimado_min, 2))
                        ELSE NULL 
                    END
                `);
            }

            // Si entra a CANCELADO con motivo
            if (estado === 'CANCELADO' && motivo_cancelacion) {
                setClauses.push(`motivo_cancelacion = $${paramIdx}`);
                values.push(motivo_cancelacion);
                paramIdx++;
            }

            // Si viene un nivel de alerta a actualizar (desde el frontend timer)
            if (alerta_retraso && ['NORMAL','ADVERTENCIA','EXCEDIDO'].includes(alerta_retraso)) {
                setClauses.push(`alerta_retraso = $${paramIdx}`);
                values.push(alerta_retraso);
                paramIdx++;
            }

            values.push(id);
            const query = `UPDATE pedidos SET ${setClauses.join(', ')} WHERE id = $${paramIdx} RETURNING id, estado, folio, total`;

            let result;
            let client = null;
            
            try {
                if (estado === 'ENTREGADO') {
                    // Si es entrega, usamos transacción atómica
                    client = await db.pool.connect();
                    await client.query('BEGIN');
                    
                    result = await client.query(query, values);
                    
                    if (result.rowCount > 0) {
                        try {
                            await descontarStockPorPedido(id, client);
                        } catch (err) {
                            console.warn('⚠️ Error al descontar stock (puede faltar migración), el pedido se despachará de todos modos:', err.message);
                        }
                    }
                    
                    await client.query('COMMIT');
                } else {
                    // Actualización normal
                    result = await db.query(query, values);
                }
            } catch (queryErr) {
                if (client) await client.query('ROLLBACK');
                // 42703 = columna inexistente (migración pendiente)
                // 22P02 = tipo de dato incompatible (ej: guardar texto en columna boolean)
                if (queryErr.code === '42703' || queryErr.code === '22P02') {
                    console.warn(`⚠️  Error de schema (${queryErr.code}). Ejecutando UPDATE mínimo:`, queryErr.message);
                    result = await db.query(
                        'UPDATE pedidos SET estado = $1 WHERE id = $2 RETURNING id, estado, folio, total',
                        [estado, id]
                    );
                } else {
                    throw queryErr;
                }
            } finally {
                if (client) client.release();
            }

            if (result.rowCount === 0) {
                return res.status(404).json({ success: false, message: 'Pedido no encontrado' });
            }

            // Emitir socket
            const io = socketManager.getIO();
            if (io) {
                io.emit('estado_pedido_actualizado', { id, nuevo_estado: estado });
                
                if (estado === 'ENTREGADO') {
                    // Notificar al admin para re-cargar stock e historial en tiempo real
                    io.emit('stock_actualizado');
                    io.emit('pedido_entregado', result.rows[0]);
                }
            }

            res.json({ success: true, message: 'Estado actualizado', data: result.rows[0] });
        } catch (error) {
            console.error('Error al actualizar estado:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
};

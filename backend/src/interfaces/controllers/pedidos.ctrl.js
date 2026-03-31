/**
 * Controlador de Pedidos
 * Capa de Interfaces
 * 
 * Se encarga exclusivamente de mapear (req, res) e invocar
 * a la capa de Aplicación (Servicios).
 */

const { prepararPedidoUseCase } = require('../../application/services/pedido.service');
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
                SELECT id, folio, cliente_nombre, estado, total, fecha_creacion 
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
                    p.id, p.id as id_local, p.folio, p.cliente_nombre, p.estado, 
                    to_char(p.fecha_creacion, 'HH24:MI') as hora_ingreso,
                    COALESCE(
                        json_agg(
                            json_build_object(
                                'tipo', CASE WHEN dp.paquete_id IS NOT NULL THEN 'PAQUETE' ELSE 'PRODUCTO_NORMAL' END,
                                'cantidad', dp.cantidad,
                                'nombre', COALESCE(paq.nombre, prod.nombre),
                                'presentacion_nombre', pres.nombre,
                                'sub_items', (
                                    SELECT COALESCE(json_agg(
                                        json_build_object(
                                            'cantidad', sub_dp.cantidad,
                                            'nombre', sub_prod.nombre,
                                            'presentacion_nombre', sub_pres.nombre
                                        )
                                    ), '[]'::json)
                                    FROM detalle_pedido sub_dp
                                    LEFT JOIN presentaciones sub_pres ON sub_dp.presentacion_id = sub_pres.id
                                    LEFT JOIN productos sub_prod ON sub_pres.producto_id = sub_prod.id
                                    WHERE sub_dp.parent_detalle_id = dp.id
                                )
                            )
                        ) FILTER (WHERE dp.id IS NOT NULL AND dp.parent_detalle_id IS NULL), '[]'::json
                    ) as items
                FROM pedidos p
                LEFT JOIN detalle_pedido dp ON p.id = dp.pedido_id AND dp.parent_detalle_id IS NULL
                LEFT JOIN paquetes paq ON dp.paquete_id = paq.id
                LEFT JOIN presentaciones pres ON dp.presentacion_id = pres.id
                LEFT JOIN productos prod ON pres.producto_id = prod.id
                WHERE p.estado IN ('PENDIENTE', 'PREPARANDO', 'HORNEANDO', 'LISTO_ENTREGA')
                GROUP BY p.id
                ORDER BY p.fecha_creacion ASC;
            `;
            const result = await db.query(query);
            res.json({ success: true, data: result.rows });
        } catch (error) {
            console.error('Error al cargar pedidos activos para KDS:', error);
            res.status(500).json({ success: false, message: 'Error interno al cargar KDS' });
        }
    },

    actualizarEstadoPedido: async (req, res) => {
        try {
            const { id } = req.params;
            const { estado } = req.body;
            
            // Validar que el estado sea correcto
            const estadosPermitidos = ['PENDIENTE', 'PREPARANDO', 'HORNEANDO', 'LISTO_ENTREGA', 'ENTREGADO', 'CANCELADO'];
            if (!estadosPermitidos.includes(estado)) {
                return res.status(400).json({ success: false, message: 'Estado inválido' });
            }

            const query = `
                UPDATE pedidos 
                SET estado = $1 
                WHERE id = $2 
                RETURNING id, estado
            `;
            const result = await db.query(query, [estado, id]);

            if (result.rowCount === 0) {
                return res.status(404).json({ success: false, message: 'Pedido no encontrado' });
            }

            // Opcional: Emitir un socket para actualizar a todas las demás pantallas KDS
            const io = socketManager.getIO();
            if (io) {
                io.emit('estado_pedido_actualizado', { id, nuevo_estado: estado });
            }

            res.json({ success: true, message: 'Estado actualizado', data: result.rows[0] });
        } catch (error) {
            console.error('Error al actualizar estado:', error);
            res.status(500).json({ success: false, message: 'Error interno' });
        }
    }
};

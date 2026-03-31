const db = require('../../config/database');

const prepararPedidoUseCase = async (payload, io) => {
  const { cliente, pedido } = payload;
  const folio = 'PED-' + Math.floor(Date.now() / 1000);
  
  const client = await db.pool.connect();
  let pedido_id;
  try {
    await client.query('BEGIN');
    
    // 1. Insertar el Pedido principal
    const insertPedidoText = `
      INSERT INTO pedidos (folio, cliente_nombre, tipo_entrega, tiempo_estimado_min, total)
      VALUES ($1, $2, $3, $4, $5) RETURNING id
    `;
    const insertPedidoValues = [
      folio, 
      cliente.nombre, 
      cliente.tipo_entrega, 
      15, // tiempo_estimado_min estatico para prueba
      pedido.total_calculado
    ];
    
    const resPedido = await client.query(insertPedidoText, insertPedidoValues);
    pedido_id = resPedido.rows[0].id;
    
    // 2. Insertar items
    if (pedido.items && pedido.items.length > 0) {
      for (const item of pedido.items) {
        let parentId = null;
        if (item.tipo === 'PAQUETE') {
          const insertItemText = `
            INSERT INTO detalle_pedido (pedido_id, paquete_id, cantidad, precio_unitario, subtotal)
            VALUES ($1, $2, $3, $4, $5) RETURNING id
          `;
          const subtotalItem = item.cantidad * item.precio_unitario;
          const resItem = await client.query(insertItemText, [
            pedido_id, item.paquete_id, item.cantidad, item.precio_unitario, subtotalItem
          ]);
          parentId = resItem.rows[0].id;

          // 3. Insertar sub-items si existen
          if (item.sub_items && item.sub_items.length > 0) {
            for (const sub of item.sub_items) {
               const insertSubText = `
                 INSERT INTO detalle_pedido 
                 (pedido_id, presentacion_id, parent_detalle_id, es_mitad_y_mitad, sabor_a_id, sabor_b_id, cantidad, precio_unitario, subtotal)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
               `;
               const subtotalSub = sub.cantidad * sub.precio_unitario;
               await client.query(insertSubText, [
                 pedido_id,
                 sub.presentacion_id,
                 parentId,
                 sub.es_mitad_y_mitad || false,
                 sub.sabor_a_id || null,
                 sub.sabor_b_id || null,
                 sub.cantidad,
                 sub.precio_unitario,
                 subtotalSub
               ]);
            }
          }
        } else if (item.tipo === 'PRODUCTO_NORMAL') {
          // Si es un producto regular (Pizzas individuales, Refrescos)
          const insertItemText = `
            INSERT INTO detalle_pedido (pedido_id, presentacion_id, cantidad, precio_unitario, subtotal)
            VALUES ($1, $2, $3, $4, $5)
          `;
          const subtotalItem = item.cantidad * item.precio_unitario;
          await client.query(insertItemText, [
            pedido_id, item.presentacion_id, item.cantidad, item.precio_unitario, subtotalItem
          ]);
        }
      }
    }
    
    await client.query('COMMIT');
    
    // Lanzar evento websocket
    if (io) {
      console.log('🍕 Emite evento WebSocket a cocina');
      io.emit('nuevo_pedido_cocina', {
        pedido_id,
        folio,
        cliente,
        items: pedido.items,
        total: pedido.total_calculado
      });
    }

    return true;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

module.exports = { prepararPedidoUseCase };

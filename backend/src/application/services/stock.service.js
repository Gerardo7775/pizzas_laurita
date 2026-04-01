const db = require('../../config/database');

/**
 * Servicio encargado de descontar el inventario basándose en las recetas.
 * Debe ejecutarse dentro de la transacción principal del pedido para mantener ACID.
 * Modifica la tabla seguimiento_estados y pedidos.fecha_entrega
 */

const descontarStockPorPedido = async (pedido_id, client) => {
    // 1. Obtener todos los items del pedido (simples, en paquete y mitades)
    const { rows: items } = await client.query(`
        SELECT 
            dp.id, dp.paquete_id, dp.presentacion_id, dp.cantidad, 
            dp.parent_detalle_id, dp.es_mitad_y_mitad, dp.sabor_a_id, dp.sabor_b_id,
            dp.precio_unitario,
            (SELECT presentacion_id FROM detalle_pedido parent WHERE parent.id = dp.parent_detalle_id) as parent_presentacion_id
        FROM detalle_pedido dp
        WHERE dp.pedido_id = $1
    `, [pedido_id]);

    // Usaremos un mapa para acumular descuentos por ingrediente y hacer un solo UPDATE por ingrediente
    const descuentosPorIngrediente = {}; // { id: cantidad_total_a_descontar }

    // Función auxiliar para sumar al mapa
    const agregarDescuento = (ingrediente_id, cantidad_a_descontar) => {
        if (!descuentosPorIngrediente[ingrediente_id]) {
            descuentosPorIngrediente[ingrediente_id] = 0;
        }
        descuentosPorIngrediente[ingrediente_id] += cantidad_a_descontar;
    };

    // 2. Analizar cada item para extraer las cantidades de receta
    for (const item of items) {
        // Ignorar filas padres de paquetes (los descuentos salen de sus sub_items)
        if (item.paquete_id && !item.presentacion_id) continue;

        const cantidadItem = parseFloat(item.cantidad) || 1;
        let presentacionID = item.presentacion_id;

        // Si es un sub-item mitad_y_mitad o normal de combo, pero sin presentacion, 
        // usar la presentacion del padre (generalmente los subitems heredan el tamaño del padre en la BD en esta lógica)
        if (!presentacionID && item.parent_presentacion_id) {
            presentacionID = item.parent_presentacion_id;
        }

        if (presentacionID && !item.es_mitad_y_mitad) {
            // Producto completo: Buscar su receta estándar
            const { rows: recetaCompleta } = await client.query(`
                SELECT ingrediente_id, cantidad_requerida 
                FROM recetas 
                WHERE presentacion_id = $1
            `, [presentacionID]);

            for (const ing of recetaCompleta) {
                agregarDescuento(ing.ingrediente_id, parseFloat(ing.cantidad_requerida) * cantidadItem);
            }
        } 
        else if (item.es_mitad_y_mitad && presentacionID && item.sabor_a_id && item.sabor_b_id) {
            // Mitad y mitad: Buscar la receta de una presentación equivalente para cada sabor
            // Al ser mitad y mitad, descontamos el 50% de la receta normal de cada sabor.
            
            // Buscar una receta que asocie el sabor A al mismo tamaño (inferido por presentacion_id actual o del padre)
            const { rows: recetaSaborA } = await client.query(`
                SELECT r.ingrediente_id, r.cantidad_requerida 
                FROM recetas r
                JOIN presentaciones p ON r.presentacion_id = p.id
                WHERE p.producto_id = $1 AND p.nombre = (SELECT nombre FROM presentaciones WHERE id = $2)
            `, [item.sabor_a_id, presentacionID]);

            for (const ing of recetaSaborA) {
                // Descontar la mitad
                agregarDescuento(ing.ingrediente_id, (parseFloat(ing.cantidad_requerida) / 2.0) * cantidadItem);
            }

            // Mismo proceso para sabor B
            const { rows: recetaSaborB } = await client.query(`
                SELECT r.ingrediente_id, r.cantidad_requerida 
                FROM recetas r
                JOIN presentaciones p ON r.presentacion_id = p.id
                WHERE p.producto_id = $1 AND p.nombre = (SELECT nombre FROM presentaciones WHERE id = $2)
            `, [item.sabor_b_id, presentacionID]);

            for (const ing of recetaSaborB) {
                agregarDescuento(ing.ingrediente_id, (parseFloat(ing.cantidad_requerida) / 2.0) * cantidadItem);
            }
        }
    }

    // 3. Ejecutar los descuentos acumulados en la base de datos
    for (const [ingrediente_id, total_descontar] of Object.entries(descuentosPorIngrediente)) {
        await client.query(`
            UPDATE ingredientes 
            SET stock_actual = stock_actual - $1, ultima_actualizacion = CURRENT_TIMESTAMP
            WHERE id = $2
        `, [total_descontar, ingrediente_id]);
    }

    // 4. Actualizar fecha de entrega del pedido y registrar el evento histórico
    await client.query(`
        UPDATE pedidos SET fecha_entrega = NOW() WHERE id = $1
    `, [pedido_id]);

    await client.query(`
        INSERT INTO seguimiento_estados (pedido_id, estado_registrado) VALUES ($1, 'ENTREGADO')
    `, [pedido_id]);

    return true;
};

module.exports = { descontarStockPorPedido };

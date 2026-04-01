const db = require('../../config/database');

// 1. Obtener todos los paquetes y qué productos incluyen
const getPaquetes = async (req, res) => {
    try {
        const query = `
            SELECT 
                p.id as paquete_id, 
                p.nombre as paquete_nombre, 
                p.precio_paquete, 
                p.activo,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'presentacion_id', pd.presentacion_id,
                            'categoria_id', pd.categoria_id,
                            'tamano_id', pd.tamano_id,
                            'is_dinamico', pd.presentacion_id IS NULL,
                            'producto_nombre', CASE WHEN pd.presentacion_id IS NULL THEN 'Cualquier ' || cat.nombre ELSE prod.nombre END,
                            'presentacion_nombre', CASE WHEN pd.presentacion_id IS NULL THEN tam.nombre ELSE t.nombre END,
                            'cantidad', pd.cantidad
                        )
                    ) FILTER (WHERE pd.id IS NOT NULL), '[]'
                ) as items
            FROM paquetes p
            LEFT JOIN contenido_paquete pd ON p.id = pd.paquete_id
            LEFT JOIN presentaciones pres ON pd.presentacion_id = pres.id
            LEFT JOIN tamanos t ON pres.tamano_id = t.id
            LEFT JOIN productos prod ON pres.producto_id = prod.id
            LEFT JOIN categorias cat ON pd.categoria_id = cat.id
            LEFT JOIN tamanos tam ON pd.tamano_id = tam.id
            GROUP BY p.id
            ORDER BY p.nombre;
        `;
        const result = await db.query(query);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error al obtener paquetes:', error);
        res.status(500).json({ success: false, message: 'Error al obtener los combos' });
    }
};

// 2. Crear un nuevo paquete con sus items
const crearPaquete = async (req, res) => {
    const { nombre, descripcion, precio_paquete, items } = req.body; 

    try {
        await db.query('BEGIN'); // Iniciamos transacción

        // 1. Insertamos el paquete principal
        const insertPaquete = await db.query(
            `INSERT INTO paquetes (nombre, descripcion, precio_paquete, activo) 
             VALUES ($1, $2, $3, true) RETURNING id`,
            [nombre, descripcion, precio_paquete]
        );
        const nuevoPaqueteId = insertPaquete.rows[0].id;

        // 2. Insertamos el detalle (los productos que incluye)
        if (items && items.length > 0) {
            for (let item of items) {
                if (item.is_dinamico) {
                    await db.query(
                        `INSERT INTO contenido_paquete (paquete_id, categoria_id, tamano_id, cantidad) 
                         VALUES ($1, $2, $3, $4)`,
                        [nuevoPaqueteId, item.categoria_id, item.tamano_id, item.cantidad]
                    );
                } else {
                    await db.query(
                        `INSERT INTO contenido_paquete (paquete_id, presentacion_id, cantidad) 
                         VALUES ($1, $2, $3)`,
                        [nuevoPaqueteId, item.presentacion_id, item.cantidad]
                    );
                }
            }
        }

        await db.query('COMMIT'); // Confirmamos todo
        res.json({ success: true, message: 'Paquete creado con éxito' });

    } catch (error) {
        await db.query('ROLLBACK'); // Si algo falla, revertimos
        console.error('Error al crear paquete:', error);
        res.status(500).json({ success: false, message: 'Error al guardar el paquete' });
    }
};

// 3. Actualizar un paquete existente
const actualizarPaquete = async (req, res) => {
    const { id } = req.params;
    const { nombre, descripcion, precio_paquete, activo, items } = req.body;

    try {
        await db.query('BEGIN');

        // 1. Actualizar datos base del paquete
        await db.query(
            `UPDATE paquetes 
             SET nombre = $1, descripcion = $2, precio_paquete = $3, activo = COALESCE($4, activo)
             WHERE id = $5`,
            [nombre, descripcion, precio_paquete, activo, id]
        );

        // 2. Borrar contenido anterior (reconstrucción total)
        await db.query(`DELETE FROM contenido_paquete WHERE paquete_id = $1`, [id]);

        // 3. Insertar nuevos items
        if (items && items.length > 0) {
            for (let item of items) {
                if (item.is_dinamico) {
                    await db.query(
                        `INSERT INTO contenido_paquete (paquete_id, categoria_id, tamano_id, cantidad) 
                         VALUES ($1, $2, $3, $4)`,
                        [id, item.categoria_id, item.tamano_id, item.cantidad]
                    );
                } else {
                    await db.query(
                        `INSERT INTO contenido_paquete (paquete_id, presentacion_id, cantidad) 
                         VALUES ($1, $2, $3)`,
                        [id, item.presentacion_id, item.cantidad]
                    );
                }
            }
        }

        await db.query('COMMIT');
        res.json({ success: true, message: 'Paquete actualizado con éxito' });

    } catch (error) {
        await db.query('ROLLBACK');
        console.error('Error al actualizar paquete:', error);
        res.status(500).json({ success: false, message: 'Error al actualizar el paquete' });
    }
};

// 4. Eliminar un paquete (Soft delete o borrado físico)
const eliminarPaquete = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('BEGIN');
        // Usaremos borrado físico, dado que si un paquete desaparece ya no se vende
        await db.query('DELETE FROM contenido_paquete WHERE paquete_id = $1', [id]);
        await db.query('DELETE FROM paquetes WHERE id = $1', [id]);
        await db.query('COMMIT');

        res.json({ success: true, message: 'Paquete eliminado correctamente' });
    } catch (error) {
        await db.query('ROLLBACK');
        console.error('Error al eliminar paquete:', error);
        res.status(500).json({ success: false, message: 'Error al eliminar el paquete. Puede estar referenciado en otra tabla.' });
    }
};

module.exports = {
    getPaquetes,
    crearPaquete,
    actualizarPaquete,
    eliminarPaquete
};


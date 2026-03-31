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
                            'producto_nombre', prod.nombre,
                            'presentacion_nombre', pres.nombre,
                            'cantidad', pd.cantidad
                        )
                    ) FILTER (WHERE pd.id IS NOT NULL), '[]'
                ) as items
            FROM paquetes p
            LEFT JOIN contenido_paquete pd ON p.id = pd.paquete_id
            LEFT JOIN presentaciones pres ON pd.presentacion_id = pres.id
            LEFT JOIN productos prod ON pres.producto_id = prod.id
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
                await db.query(
                    `INSERT INTO contenido_paquete (paquete_id, presentacion_id, cantidad) 
                     VALUES ($1, $2, $3)`,
                    [nuevoPaqueteId, item.presentacion_id, item.cantidad]
                );
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

module.exports = {
    getPaquetes,
    crearPaquete
};

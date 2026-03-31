const db = require('../../config/database');

// 1. Obtener todos los productos, presentaciones y sus recetas armadas
const getProductosYRecetas = async (req, res) => {
    try {
        const query = `
            SELECT 
                p.id as producto_id, p.nombre as producto_nombre, c.nombre as categoria_nombre,
                pr.id as presentacion_id, pr.nombre as presentacion_nombre, pr.precio,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'ingrediente_id', i.id, 
                            'nombre', i.nombre, 
                            'cantidad_requerida', r.cantidad_requerida, 
                            'unidad_medida', i.unidad_medida
                        )
                    ) FILTER (WHERE r.id IS NOT NULL), '[]'
                ) as ingredientes
            FROM productos p
            JOIN categorias c ON p.categoria_id = c.id
            JOIN presentaciones pr ON p.id = pr.producto_id
            LEFT JOIN recetas r ON pr.id = r.presentacion_id
            LEFT JOIN ingredientes i ON r.ingrediente_id = i.id
            GROUP BY p.id, c.id, pr.id
            ORDER BY p.nombre, pr.precio;
        `;
        const result = await db.query(query);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error al obtener catálogo:', error);
        res.status(500).json({ success: false, message: 'Error al obtener catálogo' });
    }
};

// 2. Guardar/Actualizar la receta de una presentación específica
const guardarReceta = async (req, res) => {
    const { presentacion_id } = req.params;
    const { ingredientes } = req.body; // Array: [{ ingrediente_id: 1, cantidad: 200 }, ...]

    try {
        // Iniciamos una transacción SQL (Para que no se borre la receta si falla el insert)
        await db.query('BEGIN');

        // 1. Borramos la receta anterior de esta presentación
        await db.query('DELETE FROM recetas WHERE presentacion_id = $1', [presentacion_id]);

        // 2. Insertamos los nuevos ingredientes uno por uno
        if (ingredientes && ingredientes.length > 0) {
            for (let item of ingredientes) {
                await db.query(
                    'INSERT INTO recetas (presentacion_id, ingrediente_id, cantidad_requerida) VALUES ($1, $2, $3)',
                    [presentacion_id, item.ingrediente_id, item.cantidad]
                );
            }
        }

        // Confirmamos los cambios
        await db.query('COMMIT');
        res.json({ success: true, message: 'Receta actualizada con éxito' });

    } catch (error) {
        await db.query('ROLLBACK'); // Si algo falla, deshacemos todo
        console.error('Error al guardar receta:', error);
        res.status(500).json({ success: false, message: 'Error al guardar la receta' });
    }
};

module.exports = {
    getProductosYRecetas,
    guardarReceta
};

const db = require('../../config/database');

const getMenuCompleto = async (req, res) => {
    try {
        // 1. Obtenemos los productos regulares con sus presentaciones y precios
        const productosResult = await db.query(`
            SELECT 
                c.nombre AS categoria,
                p.id AS producto_id,
                p.nombre AS producto_nombre,
                p.es_mitad_mitad,
                pr.id AS presentacion_id,
                t.nombre AS presentacion_nombre,
                p.categoria_id,
                pr.tamano_id,
                pr.precio
            FROM categorias c
            JOIN productos p ON c.id = p.categoria_id
            JOIN presentaciones pr ON p.id = pr.producto_id
            JOIN tamanos t ON pr.tamano_id = t.id
            WHERE p.activo = true
              AND (
                p.es_mitad_mitad = true 
                OR LOWER(c.nombre) != 'pizza'
                OR EXISTS (SELECT 1 FROM recetas r WHERE r.presentacion_id = pr.id)
              )
            ORDER BY c.nombre, p.nombre, pr.precio ASC
        `);

        // 2. Obtenemos los paquetes/combos activos
        const paquetesResult = await db.query(`
            SELECT id, nombre, descripcion, precio_paquete 
            FROM paquetes 
            WHERE activo = true
        `);

        // Estructuramos la respuesta de forma limpia para React
        res.json({ 
            success: true, 
            data: {
                productos: productosResult.rows,
                paquetes: paquetesResult.rows
            }
        });
    } catch (error) {
        console.error('Error al obtener el menú:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};

module.exports = {
    getMenuCompleto
};

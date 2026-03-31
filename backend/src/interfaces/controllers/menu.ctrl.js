const db = require('../../config/database');

const getMenuCompleto = async (req, res) => {
    try {
        // 1. Obtenemos los productos regulares con sus presentaciones y precios
        const productosResult = await db.query(`
            SELECT 
                c.nombre AS categoria,
                p.id AS producto_id,
                p.nombre AS producto_nombre,
                pr.id AS presentacion_id,
                pr.nombre AS presentacion_nombre,
                pr.precio
            FROM categorias c
            JOIN productos p ON c.id = p.categoria_id
            JOIN presentaciones pr ON p.id = pr.producto_id
            WHERE p.activo = true
            ORDER BY c.id, p.nombre, pr.precio ASC
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

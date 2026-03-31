const db = require('../../config/database');

// Obtener todo el inventario (Para la tabla principal del Admin)
const getInventario = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM ingredientes ORDER BY nombre ASC');
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error al obtener inventario:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};

// Obtener SOLO los ingredientes en alerta (Para el banner rojo)
const getAlertasStock = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT id, nombre, stock_actual, stock_minimo, unidad_medida 
            FROM ingredientes 
            WHERE stock_actual <= stock_minimo 
            ORDER BY stock_actual ASC
        `);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error al obtener alertas de stock:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};

module.exports = {
    getInventario,
    getAlertasStock
};

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
        console.error('Error al obtener alertas:', error);
        res.status(500).json({ success: false, message: 'Error interno' });
    }
};

// 1. Dar de alta un nuevo ingrediente
const crearIngrediente = async (req, res) => {
    try {
        const { nombre, unidad_medida, stock_actual, stock_minimo, costo_unitario } = req.body;
        
        const result = await db.query(
            `INSERT INTO ingredientes (nombre, unidad_medida, stock_actual, stock_minimo, costo_unitario) 
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [nombre, unidad_medida, stock_actual, stock_minimo, costo_unitario || 0]
        );
        
        res.json({ success: true, data: result.rows[0], message: 'Ingrediente creado con éxito' });
    } catch (error) {
        console.error('Error al crear ingrediente:', error);
        res.status(500).json({ success: false, message: 'Error al guardar en la base de datos' });
    }
};

// 2. Ajustar el stock manualmente (Auditoría / Merma)
const ajustarStock = async (req, res) => {
    try {
        const { id } = req.params;
        const { nuevo_stock } = req.body;
        
        const result = await db.query(
            `UPDATE ingredientes SET stock_actual = $1, ultima_actualizacion = CURRENT_TIMESTAMP 
             WHERE id = $2 RETURNING *`,
            [nuevo_stock, id]
        );
        
        res.json({ success: true, data: result.rows[0], message: 'Stock actualizado' });
    } catch (error) {
        console.error('Error al ajustar stock:', error);
        res.status(500).json({ success: false, message: 'Error al actualizar el stock' });
    }
};

module.exports = {
    getInventario,
    getAlertasStock,
    crearIngrediente,
    ajustarStock
};

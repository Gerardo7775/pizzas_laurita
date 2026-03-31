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
            SELECT id, nombre, stock_actual, stock_minimo, unidad_receta
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

// 1. Dar de alta un nuevo ingrediente (Con UMC y UMI separadas)
const crearIngrediente = async (req, res) => {
    try {
        const { 
            nombre, 
            unidad_compra,       // USO del gerente: Barra, Caja, Bolsa
            unidad_receta,       // USO de la cocina: gr, ml, pza
            factor_conversion,   // Cuántas unidad_receta = 1 unidad_compra
            stock_actual_receta, // Stock inicial expresado YA en unidad_receta
            stock_minimo,        // Alerta expresada en unidad_receta
            costo_unitario       // Costo de 1 unidad_compra
        } = req.body;
        
        if (!nombre) {
            return res.status(400).json({ success: false, message: 'El nombre es obligatorio' });
        }

        const result = await db.query(
            `INSERT INTO ingredientes 
             (nombre, unidad_compra, unidad_receta, factor_conversion, stock_actual, stock_minimo, costo_unitario) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [
                nombre, 
                unidad_compra  || 'Pza', 
                unidad_receta  || 'pza', 
                parseFloat(factor_conversion) || 1, 
                parseFloat(stock_actual_receta) || 0, 
                parseFloat(stock_minimo) || 0, 
                parseFloat(costo_unitario) || 0
            ]
        );
        
        res.json({ success: true, data: result.rows[0], message: 'Ingrediente creado con éxito' });
    } catch (error) {
        console.error('Error al crear ingrediente:', error);
        res.status(500).json({ success: false, message: 'Error al guardar en la base de datos' });
    }
};

// 2. Registrar una Compra / Ingreso al Almacén (Convierte UMC → UMI automáticamente)
const registrarCompra = async (req, res) => {
    try {
        const { id } = req.params;
        const { cantidad_comprada } = req.body; // Cuántas unidades_compra recibió el gerente

        // Traemos el factor de conversión del ingrediente
        const { rows } = await db.query(
            'SELECT nombre, factor_conversion, unidad_compra, unidad_receta, stock_actual FROM ingredientes WHERE id = $1',
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Ingrediente no encontrado' });
        }

        const ing = rows[0];
        // LA MAGIA: convertimos las unidades de compra a unidades de receta
        const incremento = parseFloat(cantidad_comprada) * parseFloat(ing.factor_conversion);
        const nuevo_stock = parseFloat(ing.stock_actual) + incremento;

        await db.query(
            `UPDATE ingredientes SET stock_actual = $1, ultima_actualizacion = CURRENT_TIMESTAMP WHERE id = $2`,
            [nuevo_stock, id]
        );

        res.json({ 
            success: true, 
            message: `Stock actualizado: +${cantidad_comprada} ${ing.unidad_compra} = +${incremento} ${ing.unidad_receta}`,
            nuevo_stock,
            incremento
        });
    } catch (error) {
        console.error('Error al registrar compra:', error);
        res.status(500).json({ success: false, message: 'Error al registrar la compra' });
    }
};

// 3. Ajustar el stock manualmente (Auditoría / Merma)
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

// 4. Actualizar un ingrediente (nombre, unidades, factor de conversión, costo)
const actualizarIngrediente = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, unidad_compra, unidad_receta, factor_conversion, stock_minimo, costo_unitario } = req.body;

        if (!nombre) {
            return res.status(400).json({ success: false, message: 'El nombre es obligatorio' });
        }

        const result = await db.query(
            `UPDATE ingredientes 
             SET nombre = $1, unidad_compra = $2, unidad_receta = $3, 
                 factor_conversion = $4, stock_minimo = $5, costo_unitario = $6,
                 ultima_actualizacion = CURRENT_TIMESTAMP
             WHERE id = $7 RETURNING *`,
            [
                nombre,
                unidad_compra || 'Pza',
                unidad_receta || 'pza',
                parseFloat(factor_conversion) || 1,
                parseFloat(stock_minimo) || 0,
                parseFloat(costo_unitario) || 0,
                id
            ]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ success: false, message: 'Ingrediente no encontrado' });
        }

        res.json({ success: true, data: result.rows[0], message: 'Ingrediente actualizado correctamente' });
    } catch (error) {
        console.error('Error al actualizar ingrediente:', error);
        res.status(500).json({ success: false, message: 'Error al actualizar en la base de datos' });
    }
};

// 5. Eliminar un ingrediente
const eliminarIngrediente = async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar si está en uso en alguna receta
        const enUso = await db.query(`
            SELECT DISTINCT p.nombre, t.nombre as tamano 
            FROM productos p
            JOIN presentaciones pr ON p.id = pr.producto_id
            JOIN recetas r ON pr.id = r.presentacion_id
            JOIN tamanos t ON pr.tamano_id = t.id
            WHERE r.ingrediente_id = $1 LIMIT 5
        `, [id]);

        if (enUso.rows.length > 0) {
            const detalles = enUso.rows.map(r => `${r.nombre} (${r.tamano})`).join(', ');
            const suffix = enUso.rows.length === 5 ? ' y otras más...' : '.';
            return res.status(409).json({ 
                success: false, 
                message: `No se puede eliminar: primero retíralo de las recetas de ${detalles}${suffix}` 
            });
        }

        const result = await db.query('DELETE FROM ingredientes WHERE id = $1 RETURNING nombre', [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ success: false, message: 'Ingrediente no encontrado' });
        }

        res.json({ success: true, message: `Ingrediente "${result.rows[0].nombre}" eliminado correctamente` });
    } catch (error) {
        console.error('Error al eliminar ingrediente:', error);
        res.status(500).json({ success: false, message: 'Error al eliminar el ingrediente' });
    }
};

module.exports = {
    getInventario,
    getAlertasStock,
    crearIngrediente,
    registrarCompra,
    ajustarStock,
    actualizarIngrediente,
    eliminarIngrediente
};

const db = require('../../config/database');

// 1. Obtener todos los productos, presentaciones y sus recetas armadas
const getProductosYRecetas = async (req, res) => {
    try {
        const query = `
            SELECT 
                p.id as producto_id, p.nombre as producto_nombre, p.es_mitad_mitad, c.nombre as categoria_nombre,
                pr.id as presentacion_id, t.nombre as presentacion_nombre, t.id as tamano_id, pr.precio,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'ingrediente_id', i.id, 
                            'nombre', i.nombre, 
                            'cantidad_requerida', r.cantidad_requerida, 
                            'unidad_medida', i.unidad_receta
                        )
                    ) FILTER (WHERE r.id IS NOT NULL), '[]'
                ) as ingredientes
            FROM productos p
            JOIN categorias c ON p.categoria_id = c.id
            JOIN presentaciones pr ON p.id = pr.producto_id
            JOIN tamanos t ON pr.tamano_id = t.id
            LEFT JOIN recetas r ON pr.id = r.presentacion_id
            LEFT JOIN ingredientes i ON r.ingrediente_id = i.id
            GROUP BY p.id, c.id, pr.id, t.id
            ORDER BY p.nombre, pr.precio;
        `;
        const result = await db.query(query);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error al obtener catálogo:', error);
        res.status(500).json({ success: false, message: 'Error al obtener catálogo', details: error.message });
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

// 3. Obtener categorías para el dropdown
const getCategorias = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM categorias ORDER BY id ASC');
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error al obtener categorias:', error);
        res.status(500).json({ success: false, message: 'Error al buscar categorias' });
    }
};

// 3.5 Crear nueva categoría
const crearCategoria = async (req, res) => {
    const { nombre } = req.body;
    if (!nombre) return res.status(400).json({ success: false, message: 'El nombre es obligatorio' });
    
    try {
        const result = await db.query(
            'INSERT INTO categorias (nombre) VALUES ($1) RETURNING *',
            [nombre]
        );
        res.json({ success: true, data: result.rows[0], message: 'Categoría creada' });
    } catch (error) {
        console.error('Error al crear categoría:', error);
        res.status(500).json({ success: false, message: 'Error interno al crear categoría' });
    }
};

// 3.6 Eliminar categoría
const eliminarCategoria = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM categorias WHERE id = $1', [id]);
        res.json({ success: true, message: 'Categoría eliminada' });
    } catch (error) {
        if (error.code === '23503' || error.code === '23001') { // Foreign key constraint or Restrict violation
            try {
                const deps = await db.query('SELECT nombre FROM productos WHERE categoria_id = $1 LIMIT 5', [id]);
                const nombres = deps.rows.map(r => r.nombre).join(', ');
                const suffix = deps.rows.length === 5 ? ' y otros más...' : '.';
                return res.status(409).json({ success: false, message: `No puedes borrar esta categoría porque está ocupada por: ${nombres}${suffix}` });
            } catch (err2) {
                return res.status(500).json({ success: false, message: 'No se pudo eliminar la categoría porque hay productos asignados a ella.' });
            }
        }
        res.status(500).json({ success: false, message: 'Error general de base de datos' });
    }
};

const editarCategoria = async (req, res) => {
    const { id } = req.params;
    const { nombre } = req.body;
    if (!nombre) return res.status(400).json({ success: false, message: 'El nombre es obligatorio' });

    try {
        const result = await db.query(
            'UPDATE categorias SET nombre = $1 WHERE id = $2 RETURNING *',
            [nombre, id]
        );
        if (result.rowCount === 0) return res.status(404).json({ success: false, message: 'Categoría no encontrada' });
        res.json({ success: true, data: result.rows[0], message: 'Categoría actualizada' });
    } catch (error) {
        if (error.code === '23505') return res.status(409).json({ success: false, message: 'El nombre de categoría ya existe' });
        console.error('Error al editar categoría:', error);
        res.status(500).json({ success: false, message: 'Error interno al editar' });
    }
};

// 3.7 Obtener tamaños para dropdown
const getTamanos = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM tamanos ORDER BY id ASC');
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error al obtener tamaños:', error);
        res.status(500).json({ success: false, message: 'Error al buscar tamaños' });
    }
};

// 3.8 Crear nuevo tamaño
const crearTamano = async (req, res) => {
    const { nombre } = req.body;
    if (!nombre) return res.status(400).json({ success: false, message: 'El nombre es obligatorio' });
    
    try {
        const result = await db.query(
            'INSERT INTO tamanos (nombre) VALUES ($1) RETURNING *',
            [nombre]
        );
        res.json({ success: true, data: result.rows[0], message: 'Tamaño creado' });
    } catch (error) {
        if (error.code === '23505') { // Unique constraint violation
            return res.status(409).json({ success: false, message: 'El tamaño ya existe' });
        }
        res.status(500).json({ success: false, message: 'Error interno al crear tamaño' });
    }
};

// 3.9 Eliminar tamaño
const eliminarTamano = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM tamanos WHERE id = $1', [id]);
        res.json({ success: true, message: 'Tamaño eliminado' });
    } catch (error) {
        if (error.code === '23503' || error.code === '23001') { // FK or Restrict violation
            const deps = await db.query(`
                SELECT DISTINCT p.nombre 
                FROM productos p 
                JOIN presentaciones pr ON p.id = pr.producto_id 
                WHERE pr.tamano_id = $1 LIMIT 5
            `, [id]);
            const nombres = deps.rows.map(r => r.nombre).join(', ');
            const suffix = deps.rows.length === 5 ? ' y otros más...' : '.';
            return res.status(409).json({ success: false, message: `No puedes borrar este tamaño porque es parte de: ${nombres}${suffix}` });
        }
        res.status(500).json({ success: false, message: 'Error al eliminar el tamaño' });
    }
};

const editarTamano = async (req, res) => {
    const { id } = req.params;
    const { nombre } = req.body;
    if (!nombre) return res.status(400).json({ success: false, message: 'El nombre es obligatorio' });

    try {
        const result = await db.query(
            'UPDATE tamanos SET nombre = $1 WHERE id = $2 RETURNING *',
            [nombre, id]
        );
        if (result.rowCount === 0) return res.status(404).json({ success: false, message: 'Tamaño no encontrado' });
        res.json({ success: true, data: result.rows[0], message: 'Tamaño actualizado' });
    } catch (error) {
        if (error.code === '23505') return res.status(409).json({ success: false, message: 'El nombre del tamaño ya existe' });
        console.error('Error al editar tamaño:', error);
        res.status(500).json({ success: false, message: 'Error interno al editar' });
    }
};

// 4. Crear un Producto y su Presentación Inicial
const crearProducto = async (req, res) => {
    const { nombre, categoria_id, tamano_id, precio, es_mitad_mitad } = req.body;
    
    if (!nombre || !categoria_id || !tamano_id || precio === undefined) {
        return res.status(400).json({ success: false, message: 'Faltan campos obligatorios' });
    }

    try {
        await db.query('BEGIN');
        
        const prodRes = await db.query(
            'INSERT INTO productos (nombre, categoria_id, es_mitad_mitad) VALUES ($1, $2, $3) RETURNING id',
            [nombre, categoria_id, es_mitad_mitad || false]
        );
        
        await db.query(
            'INSERT INTO presentaciones (producto_id, tamano_id, precio) VALUES ($1, $2, $3)',
            [prodRes.rows[0].id, tamano_id, parseFloat(precio)]
        );

        await db.query('COMMIT');
        res.json({ success: true, message: 'Producto creado correctamente' });
    } catch (error) {
        await db.query('ROLLBACK');
        console.error('Error al crear producto:', error);
        res.status(500).json({ success: false, message: 'Error interno al crear producto' });
    }
};

const editarProducto = async (req, res) => {
    const { producto_id, presentacion_id } = req.params;
    const { nombre, categoria_id, tamano_id, precio, es_mitad_mitad } = req.body;
    
    try {
        await db.query('BEGIN');
        await db.query('UPDATE productos SET nombre = $1, categoria_id = $2, es_mitad_mitad = $3 WHERE id = $4', [nombre, categoria_id, es_mitad_mitad || false, producto_id]);
        await db.query('UPDATE presentaciones SET tamano_id = $1, precio = $2 WHERE id = $3', [tamano_id, parseFloat(precio), presentacion_id]);
        await db.query('COMMIT');
        res.json({ success: true, message: 'Producto actualizado' });
    } catch (error) {
        await db.query('ROLLBACK');
        if (error.code === '23505') return res.status(409).json({ success: false, message: 'Puede que el nombre de producto ya exista con esa combinación' });
        console.error('Error al editar producto', error);
        res.status(500).json({ success: false, message: 'Error al editar producto' });
    }
};

const eliminarProducto = async (req, res) => {
    const { producto_id, presentacion_id } = req.params;
    try {
        await db.query('BEGIN');
        await db.query('DELETE FROM presentaciones WHERE id = $1', [presentacion_id]);
        
        const remaining = await db.query('SELECT COUNT(*) FROM presentaciones WHERE producto_id = $1', [producto_id]);
        if (parseInt(remaining.rows[0].count) === 0) {
           await db.query('DELETE FROM productos WHERE id = $1', [producto_id]);
        }
        await db.query('COMMIT');
        res.json({ success: true, message: 'Producto eliminado del catálogo 🗑️' });
    } catch (error) {
        await db.query('ROLLBACK');
        if (error.code === '23503' || error.code === '23001') {
            return res.status(409).json({ success: false, message: 'No puedes eliminarlo: este producto ya está asociado a pedidos históricos o combos de promociones.' });
        }
        console.error('Error al eliminar producto', error);
        res.status(500).json({ success: false, message: 'Error al eliminar producto' });
    }
};

module.exports = {
    getProductosYRecetas,
    guardarReceta,
    getCategorias,
    crearCategoria,
    editarCategoria,
    eliminarCategoria,
    getTamanos,
    crearTamano,
    editarTamano,
    eliminarTamano,
    crearProducto,
    editarProducto,
    eliminarProducto
};

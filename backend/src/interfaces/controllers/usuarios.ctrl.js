const db = require('../../config/database');
const bcrypt = require('bcryptjs');

// 1. Obtener todos los usuarios (sin enviar el hash de la contraseña)
const getUsuarios = async (req, res) => {
    try {
        const result = await db.query(
            'SELECT id, nombre, usuario, rol, activo FROM usuarios ORDER BY id ASC'
        );
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};

// 2. Crear nuevo usuario
const crearUsuario = async (req, res) => {
    const { nombre, usuario, password, rol, activo } = req.body;

    if (!nombre || !usuario || !password || !rol) {
        return res.status(400).json({ success: false, message: 'Faltan campos obligatorios' });
    }

    try {
        // Encriptar la contraseña
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        const result = await db.query(
            'INSERT INTO usuarios (nombre, usuario, password_hash, rol, activo) VALUES ($1, $2, $3, $4, $5) RETURNING id, nombre, usuario, rol, activo',
            [nombre, usuario, password_hash, rol, activo !== undefined ? activo : true]
        );

        res.json({ success: true, data: result.rows[0], message: 'Usuario creado exitosamente' });
    } catch (error) {
        if (error.code === '23505') { // constraint unique_violation
            return res.status(409).json({ success: false, message: 'El nombre de usuario ya existe' });
        }
        console.error('Error al crear usuario:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};

// 3. Editar usuario (puede incluir o no actualización de contraseña)
const editarUsuario = async (req, res) => {
    const { id } = req.params;
    const { nombre, usuario, password, rol, activo } = req.body;

    if (!nombre || !usuario || !rol) {
        return res.status(400).json({ success: false, message: 'Faltan campos obligatorios' });
    }

    try {
        let query, params;

        if (password) {
            // Si mandan password, actualizar el hash
            const salt = await bcrypt.genSalt(10);
            const password_hash = await bcrypt.hash(password, salt);
            query = 'UPDATE usuarios SET nombre = $1, usuario = $2, password_hash = $3, rol = $4, activo = $5 WHERE id = $6 RETURNING id, nombre, usuario, rol, activo';
            params = [nombre, usuario, password_hash, rol, activo, id];
        } else {
            // Si no mandan password, no tocarlo
            query = 'UPDATE usuarios SET nombre = $1, usuario = $2, rol = $3, activo = $4 WHERE id = $5 RETURNING id, nombre, usuario, rol, activo';
            params = [nombre, usuario, rol, activo, id];
        }

        const result = await db.query(query, params);

        if (result.rowCount === 0) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        }

        res.json({ success: true, data: result.rows[0], message: 'Usuario actualizado' });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ success: false, message: 'El nombre de usuario ya existe' });
        }
        console.error('Error al actualizar usuario:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};

// 4. Eliminar / Deshabilitar usuario (soft delete)
const eliminarUsuario = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await db.query(
            'UPDATE usuarios SET activo = false WHERE id = $1 RETURNING id, nombre, usuario, rol, activo',
            [id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        }

        res.json({ success: true, message: 'Usuario deshabilitado correctamente' });
    } catch (error) {
        console.error('Error al deshabilitar usuario:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};

module.exports = {
    getUsuarios,
    crearUsuario,
    editarUsuario,
    eliminarUsuario
};

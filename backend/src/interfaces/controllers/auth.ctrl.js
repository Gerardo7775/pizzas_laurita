const db = require('../../config/database');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const login = async (req, res) => {
  const { usuario, password } = req.body;

  try {
    // 1. Buscamos al usuario en la base de datos
    const result = await db.query(
      'SELECT * FROM usuarios WHERE usuario = $1 AND activo = true',
      [usuario]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Usuario no encontrado' });
    }

    const user = result.rows[0];

    // 2. Comparamos la contraseña usando bcrypt (seguridad nivel experto)
    const passwordEsCorrecto = await bcrypt.compare(password, user.password_hash);
    
    if (!passwordEsCorrecto) {
      return res.status(401).json({ success: false, message: 'Contraseña incorrecta' });
    }

    // 3. Creamos el Token JWT (el "gafete VIP")
    const token = jwt.sign(
      { id: user.id, rol: user.rol, nombre: user.nombre },
      process.env.JWT_SECRET || 'MI_SECRETO_SUPER_SEGURO_123',
      { expiresIn: '8h' } // El turno dura 8 horas
    );

    res.json({
      success: true,
      token,
      usuario: { nombre: user.nombre, rol: user.rol }
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ success: false, message: 'Error en el servidor' });
  }
};

module.exports = { login };

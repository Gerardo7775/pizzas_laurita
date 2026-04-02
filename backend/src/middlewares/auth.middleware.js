const jwt = require('jsonwebtoken');

// Función auxiliar para mostrar un error bonito o un JSON según quién pregunte
const enviarError = (req, res, status, titulo, mensaje) => {
    // Si la petición viene directo de la barra del navegador, mostramos HTML
    if (req.accepts(['json', 'html']) === 'html') {
        return res.status(status).send(`
            <div style="display:flex; justify-content:center; align-items:center; height:100vh; background-color:#1e1e2f; font-family:sans-serif; text-align:center; color:white; margin:0;">
                <div style="background:#2a2a40; padding:50px; border-radius:15px; border-top: 5px solid #e74c3c; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
                    <span style="font-size:70px; display:block; margin-bottom:20px;">🛑</span>
                    <h1 style="color:#e74c3c; margin-top:0; font-size:40px;">${titulo}</h1>
                    <p style="font-size:20px; color:#dcdde1;">${mensaje}</p>
                    <p style="font-size:14px; color:#718093; margin-top:30px;">Sistema de Gestión de Pizzas Laurita • Seguridad Activa</p>
                </div>
            </div>
        `);
    }
    // Si viene de React (Axios), mandamos el JSON normal
    return res.status(status).json({ success: false, message: mensaje });
};

const verificarToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    
    if (!authHeader) {
        return enviarError(req, res, 401, 'ACCESO DENEGADO', 'No tienes autorización para ver esta zona del sistema.');
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
        return enviarError(req, res, 401, 'ERROR DE SEGURIDAD', 'El formato de tu gafete es inválido.');
    }

    try {
        const decodificado = jwt.verify(token, process.env.JWT_SECRET || 'MI_SECRETO_SUPER_SEGURO_123'); 
        req.usuario = decodificado;
        next(); 
    } catch (error) {
        return enviarError(req, res, 403, '¡TE HEMOS PILLADO!', 'Tu gafete es falso, ha sido alterado o ya caducó.');
    }
};

module.exports = verificarToken;

/**
 * Inicializador y manejador central de WebSockets
 * Pertenece a la capa de Infraestructura
 */

const jwt = require('jsonwebtoken');

let ioInstance = null;

module.exports = {
  init: (io) => {
    ioInstance = io;

    // 🛡️ Guardia de Seguridad para WebSockets
    // Intercepta la conexión antes de que ocurra (o la batea si no trae token)
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        const secret = process.env.JWT_SECRET || 'MI_SECRETO_SUPER_SEGURO_123';

        if (!token) {
            return next(new Error('Acceso denegado: Token no proporcionado'));
        }

        jwt.verify(token, secret, (err, decoded) => {
            if (err) {
                return next(new Error('Acceso denegado: Token inválido o expirado'));
            }
            socket.user = decoded; // Guardamos los datos (id, rol, nombre) en el socket
            next();
        });
    });

    io.on('connection', (socket) => {
      console.log(`🔌 Nueva pantalla conectada: ${socket.id}`);

      // Cuando una tablet de cocina se conecte, la metemos a una "sala" especial
      socket.on('unirse_cocina', () => {
        socket.join('room_cocina');
        console.log(`👨‍🍳 Dispositivo ${socket.id} se unió al KDS de la cocina`);
      });

      socket.on('disconnect', () => {
        console.log(`❌ Pantalla desconectada: ${socket.id}`);
      });
    });
  },
  getIO: () => ioInstance
};

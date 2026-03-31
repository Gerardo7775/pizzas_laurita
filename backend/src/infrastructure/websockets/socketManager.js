/**
 * Inicializador y manejador central de WebSockets
 * Pertenece a la capa de Infraestructura
 */

let ioInstance = null;

module.exports = {
  init: (io) => {
    ioInstance = io;
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

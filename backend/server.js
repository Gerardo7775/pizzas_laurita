const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

// Inicialización de la App
const app = express();
const server = http.createServer(app);

// Configuración de WebSockets (Socket.io)
const origenesPermitidos = process.env.FRONTEND_URL || '*';

const io = new Server(server, {
  cors: {
    origin: origenesPermitidos,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"]
  }
});

// Middlewares
app.use(cors({
  origin: origenesPermitidos
}));
app.use(express.json()); // Para poder leer los JSON que envíe React

// ==========================================
// IMPORTACIÓN DE RUTAS (Clean Architecture)
// ==========================================
// Aquí se inyectarán las dependencias de los controladores
app.use('/api/pedidos', require('./src/interfaces/routes/pedidos.routes'));
app.use('/api/inventario', require('./src/interfaces/routes/inventario.routes'));
app.use('/api/menu', require('./src/interfaces/routes/menu.routes'));
app.use('/api/catalogo', require('./src/interfaces/routes/catalogo.routes'));
app.use('/api/paquetes', require('./src/interfaces/routes/paquetes.routes'));
app.use('/api/estadisticas', require('./src/interfaces/routes/estadisticas.routes'));

// ==========================================
// RUTAS REST BÁSICAS (Prueba de vida)
// ==========================================
app.get('/api/health', (req, res) => {
  res.json({ estado: 'OK', mensaje: 'El cerebro de la pizzería está en línea 🍕' });
});

// ==========================================
// LÓGICA DE WEBSOCKETS (Tiempo Real)
// ==========================================
// Delegamos el control de sockets a nuestro SocketManager en Infraestructura
const socketManager = require('./src/infrastructure/websockets/socketManager');
socketManager.init(io);

// Hacemos que "io" esté disponible para usarlo en otros archivos si fuese necesario
app.set('socketio', io);

// ==========================================
// ARRANQUE DEL SERVIDOR
// ==========================================
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
});

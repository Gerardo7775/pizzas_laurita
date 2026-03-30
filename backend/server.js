const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

// Inicialización de la App
const app = express();
const server = http.createServer(app);

// Configuración de WebSockets (Socket.io)
const io = new Server(server, {
  cors: {
    origin: "*", // En producción, aquí pondremos la URL de tu app de React
    methods: ["GET", "POST"]
  }
});

// Middlewares
app.use(cors());
app.use(express.json()); // Para poder leer los JSON que envíe React

// ==========================================
// IMPORTACIÓN DE RUTAS (Clean Architecture)
// ==========================================
// Aquí se inyectarán las dependencias de los controladores
// app.use('/api/pedidos', require('./src/interfaces/routes/pedidos.routes'));

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

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Inicialización de la App
const app = express();
const server = http.createServer(app);

// Configuración de WebSockets (Socket.io)
// CORS Estricto: Solo acepta peticiones de URLs definidas o localhosts
const origenesPermitidos = process.env.FRONTEND_URL 
  ? process.env.FRONTEND_URL.split(',') 
  : ['http://localhost:5173', 'http://localhost:5174'];

const io = new Server(server, {
  cors: {
    origin: origenesPermitidos,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"]
  }
});

// Middlewares
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || origenesPermitidos.includes(origin) || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('Bloqueado por CORS Estricto. Origen no autorizado.'));
    }
  },
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE"]
}));
app.use(express.json()); // Para poder leer los JSON que envíe React

// 🛡️ Casco de Seguridad HTTP (Oculta información del servidor como "Express")
app.use(helmet());

// ⛔ Bloqueo de Fuerza Bruta (Límite general para evitar DoS)
const limiterGeneral = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 120, // Límite de peticiones por minuto por IP
  message: { success: false, message: 'Demasiadas peticiones. Por favor, intenta más tarde.' }
});
app.use(limiterGeneral);

// 🔒 Límite estricto para Login (Evita ataques de fuerza bruta adivinando contraseñas)
const loginLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 5, // Máximo 5 intentos por minuto
  message: { success: false, message: 'Demasiados intentos fallidos. IP bloqueada por 1 minuto.' }
});

// ==========================================
// MIDDLEWARES DE SEGURIDAD
// ==========================================
const verificarToken = require('./src/middlewares/auth.middleware');

// ==========================================
// IMPORTACIÓN DE RUTAS (Clean Architecture)
// ==========================================
// 🔓 RUTAS PÚBLICAS (Se le aplica el candado estricto al login)
app.use('/api/auth', loginLimiter, require('./src/interfaces/routes/auth.routes'));    // Login

// 🔐 RUTAS PROTEGIDAS (Requieren Gafete JWT)
app.use('/api/pedidos', verificarToken, require('./src/interfaces/routes/pedidos.routes'));
app.use('/api/inventario', verificarToken, require('./src/interfaces/routes/inventario.routes'));
app.use('/api/menu', verificarToken, require('./src/interfaces/routes/menu.routes'));
app.use('/api/catalogo', verificarToken, require('./src/interfaces/routes/catalogo.routes'));
app.use('/api/paquetes', verificarToken, require('./src/interfaces/routes/paquetes.routes'));
app.use('/api/estadisticas', verificarToken, require('./src/interfaces/routes/estadisticas.routes'));
app.use('/api/usuarios', verificarToken, require('./src/interfaces/routes/usuarios.routes'));

// ==========================================
// RUTAS REST BÁSICAS (Prueba de vida)
// ==========================================
app.get('/api/health', (req, res) => {
  res.json({ estado: 'OK', mensaje: 'El cerebro de la pizzería está en línea 🍕' });
});

// 💓 RUTA DE LATIDO (Health Check) para UptimeRobot
app.get('/api/ping', (req, res) => {
  res.status(200).json({ success: true, message: '¡El cerebro de Pizzas Laurita está despierto! 🧠' });
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

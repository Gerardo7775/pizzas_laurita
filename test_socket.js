const { io } = require('socket.io-client');
const socket = io('http://localhost:3000');

socket.on('connect', () => {
  console.log('Connected to socket server with ID:', socket.id);
  socket.emit('unirse_cocina');
});

socket.on('nuevo_pedido_cocina', (data) => {
  console.log('Received order via WebSocket:', data);
  process.exit(0);
});

console.log('Listening for WebSockets...');

// Timeout after 10s
setTimeout(() => {
  console.log('Timeout waiting for orders');
  process.exit(1);
}, 10000);

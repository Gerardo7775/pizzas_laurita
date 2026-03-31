const { io } = require('socket.io-client');

const payload = {
  cliente: { nombre: "Test", tipo_entrega: "LOCAL" },
  pedido: {
    total_calculado: 150,
    items: [{ tipo: "PRODUCTO_NORMAL", presentacion_id: 1, cantidad: 1, precio_unitario: 150, nombre: "Pepperoni Gde" }]
  }
};

const socket = io('http://localhost:3000');

socket.on('connect', () => {
  console.log('Connected WS:', socket.id);
  socket.emit('unirse_cocina');
  
  fetch('http://localhost:3000/api/pedidos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).then(res => res.text()).then(t => console.log('API POST:', t)).catch(console.error);
});

socket.on('nuevo_pedido_cocina', (data) => {
  console.log('REACHED KITCHEN:', data);
  process.exit(0);
});

setTimeout(() => {
  console.log('TIMEOUT. WebSocket event not received!!');
  process.exit(1);
}, 5000);

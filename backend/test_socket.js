const { io } = require('socket.io-client');
const axios = require('axios');

const socket = io('http://localhost:3000');

socket.on('connect', async () => {
  console.log('✅ TEST CLIENT CONNECTED');
  socket.emit('unirse_cocina');
  
  console.log('🚀 Enviando POST request...');
  try {
    await axios.post('http://localhost:3000/api/pedidos', {
      cliente: { nombre: 'TEST_CLI', tipo_entrega: 'LOCAL' },
      pedido: { total_calculado: 100, items: [] }
    });
    console.log('✅ POST Exitoso');
  } catch(e) {
    console.log('❌ POST Falló', e.message);
  }
});

socket.on('nuevo_pedido_cocina', (data) => {
  console.log('🎉 EVENTO WEBSOCKET RECIBIDO!!!', data);
  process.exit(0);
});

setTimeout(() => {
  console.log('❌ TIMEOUT: El evento nunca llegó.');
  process.exit(1);
}, 3000);

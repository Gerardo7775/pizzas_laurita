/**
 * DIAGNÓSTICO: Probar el endpoint PATCH de estado
 * Ejecutar con: node test_patch.js <id_pedido>
 * Ejemplo: node test_patch.js 23
 */
const http = require('http');

const idPedido = process.argv[2] || 23;
const body = JSON.stringify({ estado: 'PREPARANDO' });

const options = {
  hostname: 'localhost',
  port: 3000,
  path: `/api/pedidos/${idPedido}/estado`,
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body)
  }
};

console.log(`\n🔧 Probando PATCH /api/pedidos/${idPedido}/estado`);
console.log('📤 Body enviado:', body);

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('\n📥 STATUS:', res.statusCode);
    try {
      const parsed = JSON.parse(data);
      console.log('📥 Response:', JSON.stringify(parsed, null, 2));
      if (res.statusCode === 200) console.log('\n✅ UPDATE exitoso - debería persistir en BD');
      else console.log('\n❌ ERROR - el cambio NO se guardó en BD');
    } catch (e) {
      console.log('📥 Raw:', data);
    }
  });
});

req.on('error', (e) => console.error('❌ Error de conexión:', e.message));
req.write(body);
req.end();

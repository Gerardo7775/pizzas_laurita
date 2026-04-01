/**
 * DIAGNÓSTICO 2: Ver el error exacto de la query de cocina
 */
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/pedidos/cocina',
  method: 'GET'
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('STATUS:', res.statusCode);
    console.log('RAW RESPONSE:', data);
  });
});

req.on('error', (e) => {
  console.error('Error conectando:', e.message);
});

req.end();

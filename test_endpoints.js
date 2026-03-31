// No require needed for node 18+

async function runTests() {
  try {
    console.log('Testing /api/inventario/alertas');
    const resAlertas = await fetch('http://localhost:3000/api/inventario/alertas');
    console.log('Status Alertas:', resAlertas.status);
    console.log(await resAlertas.text());

    console.log('\nTesting /api/menu');
    const resMenu = await fetch('http://localhost:3000/api/menu');
    console.log('Status Menu:', resMenu.status);
    console.log(await resMenu.text());
  } catch (err) {
    console.error(err);
  }
}
runTests();

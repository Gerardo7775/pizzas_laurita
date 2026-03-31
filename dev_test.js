const payload = {
  cliente: {
    nombre: "Cliente Mostrador",
    tipo_entrega: "LOCAL"
  },
  pedido: {
    total_calculado: 180,
    items: [
      {
        tipo: "PAQUETE",
        paquete_id: 1,
        cantidad: 1,
        precio_unitario: 180,
        sub_items: [
          {
            tipo: "PRODUCTO_NORMAL",
            presentacion_id: 1,
            cantidad: 1,
            precio_unitario: 0,
            nombre: "Sabor A",
            presentacion_nombre: "Gde"
          }
        ]
      }
    ]
  }
};

fetch('http://localhost:3000/api/pedidos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
})
.then(async res => {
    console.log('Status:', res.status);
    console.log('Body:', await res.text());
})
.catch(err => console.error(err));

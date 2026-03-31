const express = require('express');
const router = express.Router();
const { getInventario, getAlertasStock, crearIngrediente, registrarCompra, ajustarStock, actualizarIngrediente, eliminarIngrediente } = require('../controllers/inventario.ctrl');

router.get('/', getInventario);
router.get('/alertas', getAlertasStock);

router.post('/', crearIngrediente);
router.post('/:id/compra', registrarCompra);
router.patch('/:id/ajuste', ajustarStock);
router.put('/:id', actualizarIngrediente);
router.delete('/:id', eliminarIngrediente);

module.exports = router;

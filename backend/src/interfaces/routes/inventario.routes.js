const express = require('express');
const router = express.Router();
const { getInventario, getAlertasStock, crearIngrediente, ajustarStock } = require('../controllers/inventario.ctrl');

router.get('/', getInventario);
router.get('/alertas', getAlertasStock);

// Nuestras dos nuevas rutas
router.post('/', crearIngrediente);
router.patch('/:id/ajuste', ajustarStock);

module.exports = router;

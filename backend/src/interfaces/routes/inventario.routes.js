const express = require('express');
const router = express.Router();
const inventarioController = require('../controllers/inventario.ctrl');

router.get('/alertas', inventarioController.obtenerAlertasInventario);

module.exports = router;

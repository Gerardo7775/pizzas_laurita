const express = require('express');
const router = express.Router();
const { getInventario, getAlertasStock } = require('../controllers/inventario.ctrl');

router.get('/', getInventario);
router.get('/alertas', getAlertasStock);

module.exports = router;

const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/estadisticas.ctrl');

router.get('/kpis', ctrl.getKpisGlobales);
router.get('/horario', ctrl.getDistribucionHoraria);
router.get('/top-productos', ctrl.getTopProductos);
router.get('/inventario', ctrl.getInventarioKpis);

module.exports = router;

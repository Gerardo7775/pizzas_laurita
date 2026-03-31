const express = require('express');
const router = express.Router();
const { getPaquetes, crearPaquete } = require('../controllers/paquetes.ctrl');

router.get('/', getPaquetes);
router.post('/', crearPaquete);

module.exports = router;

const express = require('express');
const router = express.Router();
const { getPaquetes, crearPaquete, actualizarPaquete, eliminarPaquete } = require('../controllers/paquetes.ctrl');

router.get('/', getPaquetes);
router.post('/', crearPaquete);
router.put('/:id', actualizarPaquete);
router.delete('/:id', eliminarPaquete);

module.exports = router;

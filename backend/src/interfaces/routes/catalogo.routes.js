const express = require('express');
const router = express.Router();
const { getProductosYRecetas, guardarReceta } = require('../controllers/catalogo.ctrl');

router.get('/', getProductosYRecetas);
router.post('/:presentacion_id/receta', guardarReceta);

module.exports = router;

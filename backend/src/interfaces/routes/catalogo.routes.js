const express = require('express');
const router = express.Router();
const { 
  getProductosYRecetas, 
  guardarReceta, 
  getCategorias, 
  crearCategoria, 
  editarCategoria,
  eliminarCategoria,
  getTamanos,
  crearTamano,
  editarTamano,
  eliminarTamano, 
  crearProducto,
  editarProducto,
  eliminarProducto
} = require('../controllers/catalogo.ctrl');

router.get('/', getProductosYRecetas);
router.post('/:presentacion_id/receta', guardarReceta);

router.get('/categorias', getCategorias);
router.post('/categorias', crearCategoria);
router.put('/categorias/:id', editarCategoria);
router.delete('/categorias/:id', eliminarCategoria);

router.get('/tamanos', getTamanos);
router.post('/tamanos', crearTamano);
router.put('/tamanos/:id', editarTamano);
router.delete('/tamanos/:id', eliminarTamano);

router.post('/productos', crearProducto);
router.put('/productos/:producto_id/presentaciones/:presentacion_id', editarProducto);
router.delete('/productos/:producto_id/presentaciones/:presentacion_id', eliminarProducto);

module.exports = router;

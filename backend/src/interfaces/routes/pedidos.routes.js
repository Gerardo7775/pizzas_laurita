/**
 * Rutas de Pedidos
 * Capa de Interfaces (Framework web)
 */
const express = require('express');
const router = express.Router();

const { crearPedido, getHistorialDia, getPedidosCocina, actualizarEstadoPedido } = require('../controllers/pedidos.ctrl');

// Rutas
router.post('/', crearPedido);
router.get('/historial', getHistorialDia);
router.get('/cocina', getPedidosCocina);
router.patch('/:id/estado', actualizarEstadoPedido);

module.exports = router;

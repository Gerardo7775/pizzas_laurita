const express = require('express');
const router = express.Router();
const { getUsuarios, crearUsuario, editarUsuario, eliminarUsuario } = require('../controllers/usuarios.ctrl');

// Endpoints para /api/usuarios
router.get('/', getUsuarios);
router.post('/', crearUsuario);
router.put('/:id', editarUsuario);
router.delete('/:id', eliminarUsuario);

module.exports = router;

const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menu.ctrl');

router.get('/', menuController.obtenerMenu);

module.exports = router;

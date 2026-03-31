const express = require('express');
const router = express.Router();
const { getMenuCompleto } = require('../controllers/menu.ctrl');

router.get('/', getMenuCompleto);

module.exports = router;

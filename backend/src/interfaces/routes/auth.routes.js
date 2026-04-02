const express = require('express');
const router = express.Router();
const { login } = require('../controllers/auth.ctrl');

router.post('/login', login);

module.exports = router;

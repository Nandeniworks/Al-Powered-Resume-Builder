const express = require('express');
const { register, login } = require('../controllers/authController');
const { validateRegister, validateLogin } = require('../middleware/validationMiddleware');

const router = express.Router();

// Public authentication routes required by PS
router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);

module.exports = router;

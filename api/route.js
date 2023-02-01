// add api routes
const express = require('express');
const router = express.Router();
const userHandler = require('./controllers/user.controller');
// user
router.post('/api/create/user', userHandler.register)
router.get('/api/get/user', userHandler.singIn)
module.exports = router
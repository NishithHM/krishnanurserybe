// add api routes
const express = require('express');
const router = express.Router();
const userHandler = require('./controllers/number.controller');
router.get('/api/number',userHandler.generateNumber )
module.exports = router
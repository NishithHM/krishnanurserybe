// add api routes
const express = require('express');
const router = express.Router();
const {register, singIn, getAllUsers} = require('./controllers/user.controller');
const {adminAuth, bodyValidator} = require('./middlewares/auth.middleware')
const {createUserSchema} = require('./validators/user.validators')
// user
router.post('/api/user/create',[adminAuth, bodyValidator(createUserSchema)], register)
router.get('/api/user/login', singIn)
router.get('/api/user/getAll', adminAuth, getAllUsers)
module.exports = router
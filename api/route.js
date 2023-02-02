// add api routes
const express = require('express');
const router = express.Router();
const {register, singIn, getAllUsers, deleteUserById} = require('./controllers/user.controller');
const {authWall, bodyValidator, paramsToBody} = require('./middlewares/auth.middleware')
const {createUserSchema, loginUserSchema, deleteUserSchema} = require('./validators/user.validators')
// user
router.post('/api/user/create/cmwcwec',[bodyValidator(createUserSchema)], register)
router.post('/api/user/create',[authWall('admin'), bodyValidator(createUserSchema)], register)
router.get('/api/user/login', [ bodyValidator(loginUserSchema)] ,singIn)
router.get('/api/user/getAll', [authWall('admin')], getAllUsers)
router.put('/api/user/delete/:id', [authWall('admin')], paramsToBody(['id'], 'params'), bodyValidator(deleteUserSchema), deleteUserById )
module.exports = router
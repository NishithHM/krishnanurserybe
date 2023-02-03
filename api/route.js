// add api routes
const express = require('express');
const router = express.Router();
const { register, singIn, getAllUsers, deleteUserById } = require('./controllers/user.controller');
const { authWall, bodyValidator, paramsToBody } = require('./middlewares/auth.middleware')
const { createUserSchema, loginUserSchema, deleteUserSchema, getUsersSchema } = require('./validators/user.validators')
const { createCategorySchema, deleteCategorySchema, getCategorySchema } = require('./validators/categories.validators')
const {createCategory, deleteCategoryById, getAllCategories} = require('./controllers/categories.controller')
// user
router.post('/api/user/create/cmwcwec', [bodyValidator(createUserSchema)], register)
router.post('/api/user/create', [authWall('admin'), bodyValidator(createUserSchema)], register)
router.get('/api/user/login', [bodyValidator(loginUserSchema)], singIn)
router.get('/api/user/getAll', [authWall('admin'), paramsToBody(['pageNumber', 'search', 'isCount'], 'query'), bodyValidator(getUsersSchema)], getAllUsers)
router.put('/api/user/delete/:id', [authWall('admin')], paramsToBody(['id'], 'params'), bodyValidator(deleteUserSchema), deleteUserById)

// categories
router.post('/api/category/create', [authWall('admin'), bodyValidator(createCategorySchema)], createCategory)
router.get('/api/category/getAll', [authWall('admin'), paramsToBody(['pageNumber', 'search', 'isCount', 'sortBy', 'sortType'], 'query'), bodyValidator(getCategorySchema)], getAllCategories)
router.put('/api/category/delete/:id', [authWall('admin')], paramsToBody(['id'], 'params'), bodyValidator(deleteCategorySchema), deleteCategoryById)
module.exports = router
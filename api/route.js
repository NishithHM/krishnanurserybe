// add api routes
const express = require('express');
const router = express.Router();
const { register, singIn, getAllUsers, deleteUserById } = require('./controllers/user.controller');
const { authWall, bodyValidator, paramsToBody } = require('./middlewares/auth.middleware')
const { createUserSchema, loginUserSchema, deleteUserSchema, getUsersSchema } = require('./validators/user.validators')
const { createCategorySchema, deleteCategorySchema, getCategorySchema } = require('./validators/categories.validators')
const {createCategory, deleteCategoryById, getAllCategories} = require('./controllers/categories.controller')
const {createProcurementSchema, updateProcurementSchema, getProcurementsSchema, getProcurementsHistorySchema, addVariantsSchema} = require('./validators/procurement.validators')
const {addNewProcurement, updateProcurement, getAllProcurements, getAllProcurementsHistory, addProcurementVariants} = require('./controllers/procurement.controller')
const {getVendorsSchema} = require('./validators/vendor.validators')
const {getVendorList} = require('./controllers/vendor.controller')
// user
router.post('/api/user/create/cmwcwec', [bodyValidator(createUserSchema)], register)
router.post('/api/user/create', [authWall(['admin']), bodyValidator(createUserSchema)], register)
router.get('/api/user/login', [bodyValidator(loginUserSchema)], singIn)
router.get('/api/user/getAll', [authWall(['admin']), paramsToBody(['pageNumber', 'search', 'isCount'], 'query'), bodyValidator(getUsersSchema)], getAllUsers)
router.put('/api/user/delete/:id', [authWall(['admin'])], paramsToBody(['id'], 'params'), bodyValidator(deleteUserSchema), deleteUserById)

// categories
router.post('/api/category/create', [authWall(['admin']), bodyValidator(createCategorySchema)], createCategory)
router.get('/api/category/getAll', [authWall(['admin']), paramsToBody(['pageNumber', 'search', 'isCount', 'sortBy', 'sortType'], 'query'), bodyValidator(getCategorySchema)], getAllCategories)
router.put('/api/category/delete/:id', [authWall(['admin'])], paramsToBody(['id'], 'params'), bodyValidator(deleteCategorySchema), deleteCategoryById)

// procurements
router.post('/api/procurements/create', [authWall(['procurement']), bodyValidator(createProcurementSchema)], addNewProcurement)
router.post('/api/procurements/update/:id', [authWall(['procurement']), paramsToBody(['id'], 'params'), bodyValidator(updateProcurementSchema)], updateProcurement)
router.get('/api/procurements/getAll', [authWall(['admin', 'procurement']), paramsToBody(['pageNumber', 'search', 'isCount', 'sortBy', 'sortType'], 'query'), bodyValidator(getProcurementsSchema)],getAllProcurements )
router.get('/api/procurements/getAllHistory', [authWall(['admin', 'procurement']), paramsToBody(['pageNumber', 'isCount', 'id', 'startDate', 'endDate'], 'query'), bodyValidator(getProcurementsHistorySchema)],getAllProcurementsHistory )
router.post('/api/procurements/variants/:id', [authWall(['admin']), paramsToBody(['id'], 'params'), bodyValidator(addVariantsSchema)], addProcurementVariants)

// vendors
router.get('/api/vendors/getAll', [authWall(['procurement']), paramsToBody(['search'], 'query'), bodyValidator(getVendorsSchema)],getVendorList )
module.exports = router
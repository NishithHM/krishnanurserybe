// add api routes
const express = require('express');
const router = express.Router();
const multer = require('multer')
const path = require('path');
const { register, singIn, getAllUsers, deleteUserById } = require('./controllers/user.controller');
const { authWall, bodyValidator, paramsToBody } = require('./middlewares/auth.middleware')
const { createUserSchema, loginUserSchema, deleteUserSchema, getUsersSchema } = require('./validators/user.validators')
const { createCategorySchema, deleteCategorySchema, getCategorySchema } = require('./validators/categories.validators')
const { createCategory, deleteCategoryById, getAllCategories } = require('./controllers/categories.controller')
const { createProcurementSchema, updateProcurementSchema, getProcurementsSchema, getProcurementsHistorySchema, addVariantsSchema, setProcurementMinQuantitySchema, getProcurementsLowSchema } = require('./validators/procurement.validators')
const { addNewProcurement, updateProcurement, getAllProcurements, getAllProcurementsHistory, addProcurementVariants, setMinimumQuantity, getLowProcurements } = require('./controllers/procurement.controller')
const { customerSchema, getCustomerSchema } = require('./validators/customer.validators')
const { addToCartSchema, updateCartSchema, confirmCartSchema, getCustomerCartSchema, getBillingHistory } = require('./validators/billing.validators')

const { customerRegister, getCustomerByNumber } = require('./controllers/customer.controller');
const { addToCart, updateCart, confirmCart, getCustomerCart, getAllBillingHistory } = require('./controllers/billings.controller');



const { getVendorsSchema } = require('./validators/vendor.validators')
const { getVendorList } = require('./controllers/vendor.controller');
const { testUpload, videoRender } = require('./controllers/test.contoller');
const { downloadFile } = require('./utils');

const fileStorageEngine = multer.diskStorage({
	destination:(req,file,cb) =>{
		cb(null,path.join(__dirname,'./uploads'))

	},
	filename:(req,file,cb)=>{
		cb(null,Date.now() + path.extname(file.originalname))

	}
})
const upload = multer({storage:fileStorageEngine})

// user
router.post('/api/user/create/cmwcwec', [bodyValidator(createUserSchema)], register)
router.post('/api/user/create', [authWall(['admin']), bodyValidator(createUserSchema)], register)
router.post('/api/user/login', [bodyValidator(loginUserSchema)], singIn)
router.get('/api/user/getAll', [authWall(['admin']), paramsToBody(['pageNumber', 'search', 'isCount'], 'query'), bodyValidator(getUsersSchema)], getAllUsers)
router.put('/api/user/delete/:id', [authWall(['admin'])], paramsToBody(['id'], 'params'), bodyValidator(deleteUserSchema), deleteUserById)

// categories
router.post('/api/category/create', [authWall(['admin']), bodyValidator(createCategorySchema)], createCategory)
router.get('/api/category/getAll', [authWall(['admin', 'procurement']), paramsToBody(['pageNumber', 'search', 'isCount', 'sortBy', 'sortType'], 'query'), bodyValidator(getCategorySchema)], getAllCategories)
router.put('/api/category/delete/:id', [authWall(['admin'])], paramsToBody(['id'], 'params'), bodyValidator(deleteCategorySchema), deleteCategoryById)

// procurements
router.post('/api/procurements/create', [authWall(['procurement']), upload.single('invoice'), paramsToBody(['body'], 'formData'), bodyValidator(createProcurementSchema)], addNewProcurement)
router.post('/api/procurements/update/:id', [authWall(['procurement']),  upload.single('invoice'), paramsToBody(['body'], 'formData'), paramsToBody(['id'], 'params'), bodyValidator(updateProcurementSchema)], updateProcurement)
router.get('/api/procurements/getAll', [authWall(['admin', 'procurement', 'sales', 'preSales']), paramsToBody(['pageNumber', 'search', 'isCount', 'sortBy', 'sortType'], 'query'), bodyValidator(getProcurementsSchema)], getAllProcurements)
router.get('/api/procurements/getAllHistory', [authWall(['admin', 'procurement']), paramsToBody(['pageNumber', 'isCount', 'id', 'startDate', 'endDate', 'isAverage'], 'query'), bodyValidator(getProcurementsHistorySchema)], getAllProcurementsHistory)
router.post('/api/procurements/variants/:id', [authWall(['admin']), paramsToBody(['id'], 'params'), bodyValidator(addVariantsSchema)], addProcurementVariants)
router.post('/api/procurements/minimumQuantity/:id', [authWall(['admin']), paramsToBody(['id'], 'params'), bodyValidator(setProcurementMinQuantitySchema)], setMinimumQuantity)
router.get('/api/procurements/low-quantity', [authWall(['procurement', 'admin']), paramsToBody(['pageNumber', 'isCount', 'sortBy', 'sortType'], 'query'), bodyValidator(getProcurementsLowSchema)], getLowProcurements)

// vendors
router.get('/api/vendors/getAll', [authWall(['procurement']), paramsToBody(['search'], 'query'), bodyValidator(getVendorsSchema)], getVendorList)

//customers
router.post('/api/customer/create', [bodyValidator(customerSchema)], customerRegister);
router.get('/api/customer/get-customer/:phoneNumber', [authWall(['sales', 'preSales']),paramsToBody(['phoneNumber'], "params"), bodyValidator(getCustomerSchema)], getCustomerByNumber);

//billing
router.post('/api/billing/addToCart', [authWall(['sales', 'preSales']), bodyValidator(addToCartSchema)], addToCart)
router.post('/api/billing/update-cart/:id', [authWall(['sales', 'preSales']),paramsToBody(['id'], "params"), bodyValidator(updateCartSchema)], updateCart)
router.post('/api/billing/confirm-cart/:id', [authWall(['sales']),paramsToBody(['id'], "params"), bodyValidator(confirmCartSchema)], confirmCart)
router.get('/api/billing/get-cart/:id', [authWall(['sales', 'preSales']),paramsToBody(['id'], "params"), bodyValidator(getCustomerCartSchema)], getCustomerCart)
router.get('/api/billing/history', [authWall(['admin']),paramsToBody(['pageNumber', 'isCount','startDate', 'endDate', 'sortBy', 'sortType', 'search'], 'query'), bodyValidator(getBillingHistory)], getAllBillingHistory)

// s3 test
router.get('/api/download',[authWall(['admin','procurement', 'sales', 'preSales']), paramsToBody(['path'], "query")], downloadFile)
// router.get('/video', videoRender)
module.exports = router
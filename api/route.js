// add api routes
const express = require('express');
const router = express.Router();
const multer = require('multer')
const path = require('path');
const uuid = require('uuid')
const { register, singIn, getAllUsers, deleteUserById } = require('./controllers/user.controller');
const { authWall, bodyValidator, paramsToBody } = require('./middlewares/auth.middleware')
const { createUserSchema, loginUserSchema, deleteUserSchema, getUsersSchema } = require('./validators/user.validators')
const { createCategorySchema, deleteCategorySchema, getCategorySchema } = require('./validators/categories.validators')
const { createCategory, deleteCategoryById, getAllCategories } = require('./controllers/categories.controller')
const { requestProcurementSchema, getProcurementsSchema, getProcurementsHistorySchema, addVariantsSchema, setProcurementMinQuantitySchema, getProcurementsLowSchema, getOrderIdSchema, placeOrderSchema, rejectProcurementSchema, verifyProcurementSchema, addInvoiceProcurementSchema, getOrdersProcurementSchema, updateDeliveryProcurementSchema, updateDamageProcurementSchema, getDamagesSchema, updateMaintenanceProcurementSchema, getProcurementIdSchema } = require('./validators/procurement.validators')
const { requestOrder, getAllProcurements, getAllProcurementsHistory, addProcurementVariants, setMinimumQuantity, getLowProcurements, placeOrder, rejectOrderRequest, verifyOrder, uploadInvoiceToOrder, getAllOrders, updateDeliveryDate, updateDamage, getDamageList, getProcurementById, updateMaintenance, getVendorPlacedOrders, getOrderIdDetails } = require('./controllers/procurement.controller')
const { customerSchema, getCustomerSchema } = require('./validators/customer.validators')
const { addToCartSchema, updateCartSchema, confirmCartSchema, getCustomerCartSchema, getBillingHistory, getBillApproveSchema } = require('./validators/billing.validators')

const { customerRegister, getCustomerByNumber } = require('./controllers/customer.controller');
const { addToCart, updateCart, confirmCart, getCustomerCart, getAllBillingHistory, approveBill } = require('./controllers/billings.controller');



const { getVendorSchema, getVendorByIdSchema } = require('./validators/vendor.validators')
const { getVendorList, getVendorById } = require('./controllers/vendor.controller');
const { testUpload, videoRender } = require('./controllers/test.contoller');
const { downloadFile, uploadAwsTest } = require('./utils');
const { addPaymentScheme, getPaymentHistorySchema, getPaymentInfoSchema } = require('./validators/payment.validators');
const { getBrokersSchema } = require('./validators/broker.validators');
const { getBrokerList } = require('./controllers/brokers.controller');
const { addPayment, getPaymentHistory, getPaymentInfo } = require('./controllers/payment.controller');
const { dailyCron } = require('../crons/dailyCron');
const { variantSchema, getAgriVariantSchema, deleteAgriVariantSchema, editVariantSchema, getVariantSchema } = require('./validators/agriVariants.validator');
const { addAgriVariant, getAgriVariants, getTypes, getTypesOptions, deleteAgriVariant, updateAgriVariant, getAgriVariant } = require('./controllers/agriVariants.controller');
const { requestAgriItemsSchema, placeAgriItemsSchema, getAgriOrdersSchema, verifyAgriOrderSchema, getAgriProcurementsSchema, agriHistorySchema, agriSetAmountsSchema, addInvoiceAgriSchema, getAgriOrderIdSchema, getAgriPlacedIdSchema, rejectAgriProcurementSchema } = require('./validators/agriOrderMgmt.validator');
const { requestAgriOrder, placeAgriOrder, agriOrderList, verifyAgriOrder, getAllAgriProcurements, getAllAgriProcurementsHistory, agriSetAmounts, uploadInvoiceToAgriOrder, getAgriOrderIdDetails, getAgriVendorPlacedOrders, rejectAgriOrderRequest } = require('./controllers/agriOrderMgmt.controller');
const { getAgriItemDetials, getAgriItemDetails, agriAddToCart, updateAgriCart, confirmAgriCart, getAgriCart } = require('./controllers/agriBilling.controller');
const { getAgriBillingDataSchema, agriAddToCartSchema, updateAgriCartSchema, confirmAgriCartSchema } = require('./validators/agriBilling.validator');
const { metaDataValidator, metaGraphValidator } = require('./validators/dashboard.validator');
const { dahboardMetaData, dahboardMetaGraph } = require('./controllers/dashboard.controller');
const { downloadBillingExcel, downloadWasteMgmtExcel, downloadOrderMgmtExcel, downloadPaymentExcel } = require('./controllers/excel.controller');
const { billingExcelValidator, wasteMgmtExcelValidator, orderMgmtExcelValidator, paymentExcelValidator } = require('./validators/excel.validator');

const fileStorageEngine = multer.diskStorage({
	destination:(req,file,cb) =>{
		cb(null,path.join(__dirname, './uploads'))

	},
	filename:(req,file,cb)=>{
		cb(null,uuid.v4() + path.extname(file.originalname))

	}
})
const uploadInvoice = multer({storage:fileStorageEngine, limits:{fileSize: 1000*1024*1024}});

// cron
dailyCron()


// user
router.post('/api/user/create/cmwcwec', [bodyValidator(createUserSchema)], register)
router.post('/api/user/create', [authWall(['admin']), bodyValidator(createUserSchema)], register)
router.post('/api/user/login', [bodyValidator(loginUserSchema)], singIn)
router.get('/api/user/getAll', [authWall(['admin']), paramsToBody(['pageNumber', 'search', 'isCount'], 'query'), bodyValidator(getUsersSchema)], getAllUsers)
router.put('/api/user/delete/:id', [authWall(['admin'])], paramsToBody(['id'], 'params'), bodyValidator(deleteUserSchema), deleteUserById)

// categories
router.post('/api/category/create', [authWall(['admin']), bodyValidator(createCategorySchema)], createCategory)
router.get('/api/category/getAll', [paramsToBody(['pageNumber', 'search', 'isCount', 'sortBy', 'sortType'], 'query'), bodyValidator(getCategorySchema)], getAllCategories)
router.put('/api/category/delete/:id', [authWall(['admin'])], paramsToBody(['id'], 'params'), bodyValidator(deleteCategorySchema), deleteCategoryById)

// procurements
router.post('/api/procurements/request-order', [authWall(['sales']), bodyValidator(requestProcurementSchema)], requestOrder)
router.post('/api/procurements/place-order', [authWall(['procurement']), bodyValidator(placeOrderSchema)], placeOrder)
router.post('/api/procurements/reject-order', [authWall(['procurement', 'admin']), bodyValidator(rejectProcurementSchema)], rejectOrderRequest)
router.post('/api/procurements/verify-order', [authWall(['sales']), uploadInvoice.array('images', 3), paramsToBody(['body'], 'formData'), bodyValidator(verifyProcurementSchema)], verifyOrder)
router.post('/api/procurements/add-invoice/:id', [authWall(['procurement', 'admin']), uploadInvoice.array('invoice', 1), paramsToBody(['body'], 'formData'), paramsToBody(['id'], 'params'), bodyValidator(addInvoiceProcurementSchema)], uploadInvoiceToOrder)
router.post('/api/procurements/get-orders', [authWall(['procurement', 'sales', 'admin']), bodyValidator(getOrdersProcurementSchema)], getAllOrders)
router.post('/api/procurements/update-delivery/:id', [authWall(['procurement']), bodyValidator(updateDeliveryProcurementSchema)], updateDeliveryDate)
router.get('/api/procurements/getAll', [authWall(['admin', 'procurement', 'sales', 'preSales']), paramsToBody(['pageNumber', 'search', 'isCount', 'sortBy', 'sortType', 'isAll', 'isList'], 'query'), bodyValidator(getProcurementsSchema)], getAllProcurements)
router.get('/api/procurements/getAllHistory', [authWall(['admin', 'procurement']), paramsToBody(['pageNumber', 'isCount', 'id', 'startDate', 'endDate', 'isAverage'], 'query'), bodyValidator(getProcurementsHistorySchema)], getAllProcurementsHistory)
router.post('/api/procurements/variants/:id', [authWall(['admin']), paramsToBody(['id'], 'params'), bodyValidator(addVariantsSchema)], addProcurementVariants)
router.post('/api/procurements/minimumQuantity/:id', [authWall(['admin']), paramsToBody(['id'], 'params'), bodyValidator(setProcurementMinQuantitySchema)], setMinimumQuantity)
router.get('/api/procurements/low-quantity', [authWall(['procurement', 'admin']), paramsToBody(['pageNumber', 'isCount', 'sortBy', 'sortType', 'search'], 'query'), bodyValidator(getProcurementsLowSchema)], getLowProcurements)
router.post('/api/procurements/report-damage/:id', [authWall(['sales']), uploadInvoice.array('images', 3), paramsToBody(['body'], 'formData'), paramsToBody(['id'], 'params'), bodyValidator(updateDamageProcurementSchema)], updateDamage)
router.get('/api/procurements/get-damages', [authWall(['admin', 'sales']), paramsToBody(['pageNumber', 'isCount','startDate', 'endDate', 'search'], 'query'), bodyValidator(getDamagesSchema)], getDamageList)
router.get('/api/procurements/report-maintenance/:id', [authWall(['sales']), paramsToBody(['id'], 'params'), paramsToBody(['count'], 'query'), bodyValidator(updateMaintenanceProcurementSchema)], updateMaintenance)
router.get('/api/procurements/:id', [authWall(['sales', 'procurement']), paramsToBody(['id'], 'params'), bodyValidator(getProcurementIdSchema)], getProcurementById)
router.get('/api/procurements/vendor-orders/:id', [authWall(['procurement']), paramsToBody(['id'], 'params'), bodyValidator(getProcurementIdSchema)], getVendorPlacedOrders)
router.get('/api/procurements/order/:id', [authWall(['procurement']), paramsToBody(['id'], 'params'),  paramsToBody(['page'], 'query'), bodyValidator(getOrderIdSchema)], getOrderIdDetails)


// vendors
router.get('/api/vendors/getAll', [authWall(['procurement', 'admin']), paramsToBody(['search', 'type'], 'query'), bodyValidator(getVendorSchema)], getVendorList)
router.get('/api/vendors/:id', [authWall(['procurement', 'admin']), paramsToBody(['id'], 'params'), bodyValidator(getVendorByIdSchema)], getVendorById)

//customers
router.post('/api/customer/create', [bodyValidator(customerSchema)], customerRegister);
router.get('/api/customer/get-customer/:phoneNumber', [authWall(['sales', 'preSales']),paramsToBody(['phoneNumber'], "params"), bodyValidator(getCustomerSchema)], getCustomerByNumber);

//billing
router.post('/api/billing/addToCart', [authWall(['sales', 'preSales']), bodyValidator(addToCartSchema)], addToCart)
router.post('/api/billing/update-cart/:id', [authWall(['sales', 'preSales']),paramsToBody(['id'], "params"), bodyValidator(updateCartSchema)], updateCart)
router.post('/api/billing/confirm-cart/:id', [authWall(['sales']),paramsToBody(['id'], "params"), bodyValidator(confirmCartSchema)], confirmCart)
router.get('/api/billing/get-cart/:id', [authWall(['sales', 'preSales']),paramsToBody(['id'], "params"), bodyValidator(getCustomerCartSchema)], getCustomerCart)
router.get('/api/billing/history', [authWall(['admin', 'sales']),paramsToBody(['pageNumber', 'isCount','startDate', 'endDate', 'sortBy', 'sortType', 'search', 'type'], 'query'), bodyValidator(getBillingHistory)], getAllBillingHistory)
router.get('/api/billing/approve/:id', [authWall(['admin']), paramsToBody(['id'], 'params'), bodyValidator(getBillApproveSchema)], approveBill)


// payments
router.post('/api/payments/addPayment', [authWall(['sales', 'procurement', 'admin']), bodyValidator(addPaymentScheme)], addPayment)
router.get('/api/payments/getAll', [authWall(['sales', 'procurement', 'admin']),paramsToBody(['pageNumber', 'isCount','startDate', 'endDate', 'sortBy', 'sortType', 'search', 'vendorId', 'businessType', 'type'], 'query', 'type'), bodyValidator(getPaymentHistorySchema)], getPaymentHistory)
router.get('/api/payments/get-info/:phoneNumber', [authWall(['sales', 'procurement', 'admin']), paramsToBody(['phoneNumber'], 'params'), bodyValidator(getPaymentInfoSchema)], getPaymentInfo )
// brokers
router.get('/api/brokers/getAll', [authWall(['procurement', 'admin', 'sales']), paramsToBody(['search'], 'query'), bodyValidator(getBrokersSchema)], getBrokerList)

// agri variants
router.post('/api/agri/variants', [authWall(['procurement', 'admin']), bodyValidator(variantSchema)], addAgriVariant )
router.post('/api/agri/variants/:id', [authWall(['procurement', 'admin']), paramsToBody(['id'], 'params'), bodyValidator(editVariantSchema)], updateAgriVariant )
router.get('/api/agri/variants/:id', [authWall(['procurement', 'admin', 'sales']), paramsToBody(['id'], 'params'), bodyValidator(getVariantSchema)], getAgriVariant )
router.get('/api/agri/variants', [authWall(['procurement', 'admin', 'sales']), paramsToBody(['pageNumber', 'search', 'isCount', 'type'], 'query'), bodyValidator(getAgriVariantSchema)], getAgriVariants )
router.get('/api/agri/types', [authWall(['procurement', 'admin', 'sales'])], getTypes )
router.get('/api/agri/type-options', [authWall(['procurement', 'admin', 'sales']), paramsToBody(['type', 'search'], 'query'), bodyValidator(getAgriVariantSchema)], getTypesOptions )
router.get('/api/agri/delete-variant/:id', [authWall(['procurement', 'admin']),paramsToBody(['id'], 'params'), bodyValidator(deleteAgriVariantSchema)], deleteAgriVariant )

//agri order-mgmt
router.post('/api/agri/request-order', [authWall(['sales']), bodyValidator(requestAgriItemsSchema)], requestAgriOrder)
router.post('/api/agri/place-order', [authWall(['procurement']), bodyValidator(placeAgriItemsSchema)], placeAgriOrder)
router.post('/api/agri/order-list', [authWall(['procurement', 'sales', 'admin']), bodyValidator(getAgriOrdersSchema)], agriOrderList)
router.post('/api/agri/verify-order/:id', [authWall(['sales']), uploadInvoice.array('images', 3), paramsToBody(['body'], 'formData'), paramsToBody(['id'], 'params'), bodyValidator(verifyAgriOrderSchema)], verifyAgriOrder)
router.get('/api/agri/getAll', [authWall(['admin', 'procurement']), paramsToBody(['pageNumber', 'search', 'isCount', 'sortBy', 'sortType', 'onlyLow'], 'query'), bodyValidator(getAgriProcurementsSchema)], getAllAgriProcurements)
router.get('/api/agri/getAllHistory', [authWall(['admin', 'procurement']), paramsToBody(['pageNumber', 'isCount', 'name', 'startDate', 'endDate', 'isAverage'], 'query'), bodyValidator(agriHistorySchema)], getAllAgriProcurementsHistory)
router.post('/api/agri/set-amounts/:id', [authWall(['admin']), paramsToBody(['id'], 'params'), bodyValidator(agriSetAmountsSchema)], agriSetAmounts)
router.post('/api/agri/add-invoice/:id', [authWall(['procurement']), uploadInvoice.array('invoice', 1), paramsToBody(['body'], 'formData'), paramsToBody(['id'], 'params'), bodyValidator(addInvoiceAgriSchema)], uploadInvoiceToAgriOrder)
router.get('/api/agri/order/:id', [authWall(['procurement']), paramsToBody(['id'], 'params'),  paramsToBody(['page'], 'query'), bodyValidator(getAgriOrderIdSchema)], getAgriOrderIdDetails)
router.get('/api/agri/vendor-orders/:id', [authWall(['procurement']), paramsToBody(['id'], 'params'), bodyValidator(getAgriPlacedIdSchema)], getAgriVendorPlacedOrders)
router.post('/api/agri/reject-order/:id', [authWall(['procurement']),  paramsToBody(['id'], 'params'), bodyValidator(rejectAgriProcurementSchema)], rejectAgriOrderRequest)

//agri billing
router.post('/api/agri/product-details', [authWall(['sales']), bodyValidator(getAgriBillingDataSchema)], getAgriItemDetails)
router.post('/api/agri/billing/addToCart', [authWall(['sales']), bodyValidator(agriAddToCartSchema)], agriAddToCart)
router.post('/api/agri/billing/update-cart/:id', [authWall(['sales']), paramsToBody(['id'], "params"), bodyValidator(updateAgriCartSchema)], updateAgriCart)
router.post('/api/agri/billing/confirm-cart/:id', [authWall(['sales']),paramsToBody(['id'], "params"), bodyValidator(confirmAgriCartSchema)], confirmAgriCart)
router.get('/api/agri/billing/get-cart/:id', [authWall(['sales', 'preSales']),paramsToBody(['id'], "params"), bodyValidator(getCustomerCartSchema)], getAgriCart)
// s3 test
router.post('/api/upload-large',[], uploadAwsTest)
router.get('/api/download',[authWall(['admin','procurement', 'sales', 'preSales']), paramsToBody(['path'], "query")], downloadFile)

// dashboard 
router.post('/api/dashboard/meta-data', [authWall(['admin']), bodyValidator(metaDataValidator)], dahboardMetaData)
router.post('/api/dashboard/meta-graph', [authWall(['admin']),bodyValidator(metaDataValidator)], dahboardMetaGraph)


// excel download
router.get('/api/excel/billing', [authWall(['admin', 'procurement', 'sales']), paramsToBody(['pageNumber', 'isCount', 'startDate', 'endDate'], 'query'), bodyValidator(billingExcelValidator)], downloadBillingExcel)
router.get('/api/excel/waste-mgmt', [authWall(['admin', 'procurement', 'sales']), paramsToBody(['pageNumber', 'isCount', 'startDate', 'endDate'], 'query'), bodyValidator(wasteMgmtExcelValidator)], downloadWasteMgmtExcel)
router.get('/api/excel/order-mgmt', [authWall(['admin', 'procurement', 'sales']), paramsToBody(['pageNumber', 'isCount', 'startDate', 'endDate'], 'query'), bodyValidator(orderMgmtExcelValidator)], downloadOrderMgmtExcel)
router.get('/api/excel/payments', [authWall(['admin', 'procurement', 'sales']), paramsToBody(['pageNumber', 'isCount', 'startDate', 'endDate', 'type'], 'query'), bodyValidator(paymentExcelValidator)], downloadPaymentExcel)



// router.get('/video', videoRender)
module.exports = router
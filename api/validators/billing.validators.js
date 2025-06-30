const Joi = require('joi');

exports.addToCartSchema = Joi.object().keys({
    customerId: Joi.string(),
    customerNumber: Joi.string().min(10).max(10).required(),
    customerName: Joi.string().pattern(new RegExp(/[A-Za-z]/)).required(),
    customerDob: Joi.date(),
    items: Joi.array().items(Joi.object().keys({
        procurementId: Joi.string().required(),
        variantId: Joi.string().required(),
        quantity: Joi.number().min(0).required(),
        price: Joi.number().min(0).required(),
        isInfoSheet: Joi.boolean().default(false)
    })),
    isWholeSale: Joi.boolean().default(false),
});

exports.updateCartSchema = Joi.object().keys({
    id: Joi.string().required(),
    items: Joi.array().items(Joi.object().keys({
        procurementId: Joi.string().required(),
        variantId: Joi.string().required(),
        quantity: Joi.number().min(0).required(),
        price: Joi.number().min(0).required(),
        isInfoSheet: Joi.boolean().default(false)
    })),
    isWholeSale: Joi.boolean().default(false),
});

exports.confirmCartSchema = Joi.object().keys({
    id: Joi.string().required(),
    roundOff: Joi.number().min(0).max(500).default(0),
    paymentType: Joi.string().required().valid('CASH', 'ONLINE', 'BOTH'),
    paymentInfo: Joi.string().allow(null, ''),
    cashAmount: Joi.number().min(0).required(),
    onlineAmount: Joi.number().min(0).required(),
});

exports.getCustomerCartSchema = Joi.object().keys({
    id: Joi.string().required(),
});

exports.getBillApproveSchema = Joi.object().keys({
    id: Joi.string().required(),
});

exports.getBillingHistory = Joi.object().keys({
    pageNumber: Joi.number(),
    isCount: Joi.boolean(),
    startDate : Joi.string().pattern(new RegExp(/\d{4}-\d{2}-\d{2}/)),
    endDate : Joi.string().pattern(new RegExp(/\d{4}-\d{2}-\d{2}/)),
    sortBy: Joi.string().valid('updatedAt', 'totalPrice', 'billedDate'),
    sortType: Joi.number().valid(-1, 1).default(1),
    search: Joi.string().pattern(new RegExp(/[A-Za-z0-9]/)),
    type: Joi.string().valid('NURSERY', 'AGRI')
});

exports.returnInvoiceSchema = Joi.object().keys(
    {
        invoiceId: Joi.string(),
        items: Joi.array()
    }
)
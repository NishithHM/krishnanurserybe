const Joi = require("joi");

exports.getAgriBillingDataSchema = Joi.object().keys({
    name: Joi.string().pattern(new RegExp(/[A-Za-z]/)).required(),
    type: Joi.string().required(),
    variant: Joi.array().items(Joi.object().keys({
        optionName: Joi.string().required(),
        optionValue: Joi.string().required()
    })),
})
exports.agriAddToCartSchema = Joi.object().keys({
    customerId: Joi.string(),
    customerNumber: Joi.string().min(10).max(10).required(),
    customerName: Joi.string().pattern(new RegExp(/[A-Za-z]/)).required(),
    customerDob: Joi.date(),
    customerGst: Joi.string(),
    customerAddress: Joi.string(),
    shippingAddress: Joi.string(),
    items: Joi.array().items(Joi.object().keys({
        procurementId: Joi.string().required(),
        quantity: Joi.number().min(0).required(),
        price: Joi.number().min(0).required(),
    })),
});

exports.updateAgriCartSchema = Joi.object().keys({
    id: Joi.string().required(),
    items: Joi.array().items(Joi.object().keys({
        procurementId: Joi.string().required(),
        quantity: Joi.number().min(0).required(),
        price: Joi.number().min(0).required(),
    })),
});

exports.confirmAgriCartSchema = Joi.object().keys({
    id: Joi.string().required(),
    roundOff: Joi.number().min(0).max(1).default(0),
    paymentType: Joi.string().required().valid('CASH', 'ONLINE'),
    paymentInfo: Joi.string().allow(null, '')
});
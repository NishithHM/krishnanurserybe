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
    })),
});

exports.updateCartSchema = Joi.object().keys({
    id: Joi.string().required(),
    items: Joi.array().items(Joi.object().keys({
        procurementId: Joi.string().required(),
        variantId: Joi.string().required(),
        quantity: Joi.number().min(0).required(),
        price: Joi.number().min(0).required(),
    })),
});

exports.confirmCartSchema = Joi.object().keys({
    id: Joi.string().required(),
    roundOff: Joi.number().min(0).max(500).default(0)
});

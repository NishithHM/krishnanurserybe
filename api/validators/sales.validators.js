const Joi = require('joi');

exports.addToCartSchema = Joi.object().keys({
    customer_id: Joi.string(),
    customerNumber: Joi.string().min(10).max(10).required(),
    customerName: Joi.string().pattern(new RegExp(/[A-Za-z]/)).required(),
    customerdob: Joi.date(),
    ItemsInCart: Joi.array().items(Joi.object().keys({
        procurement_id: Joi.string().required(),
        Variants_id: Joi.string().required(),
        quantity: Joi.number().min(0).required(),
        price: Joi.number().min(0).required(),
    })),
    total:Joi.number().required()
});

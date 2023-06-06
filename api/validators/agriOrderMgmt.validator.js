const Joi = require("joi");

exports.requestAgriItemsSchema = Joi.object().keys({
    orders: Joi.array().items(Joi.object().keys({
        totalQuantity: Joi.number().required(),
        type: Joi.string().required(),
        name: Joi.string().required(),
        variant: Joi.array().items(Joi.object().keys({
            optionName: Joi.string().required(),
            optionValue: Joi.string().required()
        }))
    })),
    descrption : Joi.string().max(200)
});

exports.placeAgriItemsSchema = Joi.object().keys({
    orders: Joi.array().items(Joi.object().keys({
        totalQuantity: Joi.number().required(),
        type: Joi.string().required(),
        name: Joi.string().required(),
        variant: Joi.array().items(Joi.object().keys({
            optionName: Joi.string().required(),
            optionValue: Joi.string().required()
        })),
        id: Joi.string(),
        totalPrice: Joi.number().required()
    })),
    descrption : Joi.string().max(200),
    currentPaidAmount: Joi.number().required(),
    orderId: Joi.number().required(),
    vendorName: Joi.string().required(),
    vendorContact: Joi.string().min(10).max(10),
    expectedDeliveryDate: Joi.string().pattern(new RegExp(/\d{4}-\d{2}-\d{2}/)),
    vendorId: Joi.string(),
});
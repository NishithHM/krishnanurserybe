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
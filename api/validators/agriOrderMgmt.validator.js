const Joi = require("joi");

exports.requestAgriItemsSchema = Joi.object().keys({
    orders: Joi.array(Joi.object().keys({
        totalQuantity: Joi.number().required(),
        type: Joi.string().required(),
        name: Joi.string().required(),
        variant: Joi.array(Joi.object().keys({
            optionName: Joi.string().required(),
            optionValues: Joi.array(Joi.string()).max(1)
        }))
    }))
});
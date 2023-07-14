const Joi = require("joi");

exports.getAgriBillingDataSchema = Joi.object().keys({
    name: Joi.string().pattern(new RegExp(/[A-Za-z]/)).required(),
    type: Joi.string().required(),
    variant: Joi.array().items(Joi.object().keys({
        optionName: Joi.string().required(),
        optionValue: Joi.string().required()
    })),
})
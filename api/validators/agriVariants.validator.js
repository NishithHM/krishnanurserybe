const Joi = require('joi')

exports.variantSchema = Joi.object().keys({
    name: Joi.string().pattern(new RegExp(/[A-Za-z]/)).required(),
    type: Joi.string().required(),
    options: Joi.array().items(Joi.object().keys({
        optionName: Joi.string().required(),
        optionValues: Joi.array().items(Joi.string().required())
    }))
});

exports.getAgriVariantSchema = Joi.object().keys({
    search: Joi.string().pattern(new RegExp(/[A-Za-z]/)),
    pageNumber: Joi.number(),
    isCount: Joi.boolean(),
    type: Joi.string()
})

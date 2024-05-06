const Joi = require('joi')

exports.variantSchema = Joi.object().keys({
    name: Joi.string().pattern(new RegExp(/[A-Za-z0-9]/)).required(),
    type: Joi.string().required(),
    options: Joi.array().items(Joi.object().keys({
        optionName: Joi.string().required(),
        optionValues: Joi.array().items(Joi.string().required())
    })),
    gst: Joi.number().required().max(30),
    hsnCode: Joi.string().required()
});

exports.editVariantSchema = Joi.object().keys({
    options: Joi.array().items(Joi.object().keys({
        optionName: Joi.string().required(),
        optionValues: Joi.array().items(Joi.string().required())
    })),
    id: Joi.string().required(),
    gst: Joi.number().required().max(30),
    hsnCode: Joi.string().required()
});

exports.getVariantSchema = Joi.object().keys({
    id: Joi.string().required()
});

exports.getAgriVariantSchema = Joi.object().keys({
    search: Joi.string().pattern(new RegExp(/[A-Za-z0-9]/)),
    pageNumber: Joi.number(),
    isCount: Joi.boolean(),
    type: Joi.string()
})

exports.getAgriTypeOptions = Joi.object().keys({
    type: Joi.string().required()
})

exports.deleteAgriVariantSchema = Joi.object().keys({
    id: Joi.string().required()
})

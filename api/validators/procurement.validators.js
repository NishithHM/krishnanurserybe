const Joi = require('joi')

exports.createProcurementSchema = Joi.object().keys({
    nameInEnglish: Joi.string().pattern(new RegExp(/[A-Za-z]/)).required(),
    nameInKannada: Joi.string().required(),
    vendorName: Joi.string().required(),
    vendorContact: Joi.string().min(10).max(10),
    totalQuantity: Joi.number().required(),
    totalPrice: Joi.number().required(),
    description: Joi.string(),
    vendorId: Joi.string(),
    categories: Joi.array().items(Joi.object().keys({
        _id:Joi.string().required(),
        name: Joi.string().required()
    }))
});

exports.updateProcurementSchema = Joi.object().keys({
    id: Joi.string().required(),
    vendorName: Joi.string().required(),
    vendorContact: Joi.string().min(10).max(10).required(),
    totalQuantity: Joi.number().required(),
    totalPrice: Joi.number().required(),
    description: Joi.string(),
    vendorId: Joi.string(),
    categories: Joi.array().items(Joi.object().keys({
        _id:Joi.string().required(),
        name: Joi.string().required()
    }))
});

exports.getProcurementsSchema = Joi.object().keys({
    search: Joi.string().pattern(new RegExp(/[A-Za-z]/)),
    pageNumber: Joi.number(),
    isCount: Joi.boolean(),
    sortBy: Joi.string().valid('lastProcuredOn', 'plantName'),
    sortType: Joi.number().valid(-1, 1).default(1)
});

exports.getProcurementsHistorySchema = Joi.object().keys({
    pageNumber: Joi.number(),
    isCount: Joi.boolean(),
    id: Joi.string().required(),
    startDate : Joi.string().pattern(new RegExp(/\d{4}-\d{2}-\d{2}/)).required(),
    endDate : Joi.string().pattern(new RegExp(/\d{4}-\d{2}-\d{2}/)).required()
});

exports.addVariantsSchema = Joi.object().keys({
    id: Joi.string().required(),
    variants: Joi.array().items(Joi.object().keys({
        variantNameInEnglish: Joi.string().pattern(new RegExp(/[A-Za-z]/)).required(),
        variantNameInKannada: Joi.string().required(),
        minPrice: Joi.number().required(),
        maxPrice: Joi.number().required()
    })),
})

exports.setProcurementMinQuantitySchema = Joi.object().keys({
    id: Joi.string().required(),
    minimumQuantity: Joi.number().required()
})

exports.getProcurementsLowSchema = Joi.object().keys({
    pageNumber: Joi.number(),
    isCount: Joi.boolean(),
    sortBy: Joi.string().valid('minimumQuantity'),
    sortType: Joi.number().valid(-1, 1).default(1)
});
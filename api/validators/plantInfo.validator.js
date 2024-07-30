const Joi = require('joi')

const addPlantInfoValidator = Joi.object({
    procurementId: Joi.string().required(),
    sellingPrice: Joi.number().required(),
    discountedSellingPrice: Joi.number().required().max(Joi.ref('sellingPrice')),    
    coverImages: Joi.array().items(Joi.string()).required(),
    tips: Joi.array().items(Joi.string()),
    moreInfo: Joi.string().required(),
    tags: Joi.array().items(Joi.string()),
    sections: Joi.array().items(
        Joi.object({
            image: Joi.string(),
            text: Joi.string()
        })
    ).required(),
    nameForCustomer: Joi.string(),
    status: Joi.string().valid('DRAFT', 'PUBLISH'),
})

const getPlantByIdValidator = Joi.object({
    id: Joi.string().required()
})

const getPlantValidator = Joi.object({
    search: Joi.string(),
    pageNumber: Joi.number().default(1),
    tags: Joi.array().items(Joi.string()),
    type: Joi.valid('search', 'list'),
    limit: Joi.number().max(20)
})


module.exports = {addPlantInfoValidator, getPlantByIdValidator, getPlantValidator}

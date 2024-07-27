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

module.exports = {addPlantInfoValidator, getPlantByIdValidator}

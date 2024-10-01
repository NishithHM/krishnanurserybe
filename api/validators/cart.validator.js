const Joi = require('joi')

const addCartValidator = Joi.object({
  cart: Joi.array().items(items(Joi.object().keys({
    plantId: Joi.string().required(),
    qty: Joi.number().required()
}))).required(),
  uuid: Joi.number(),
  offerId: Joi.string()
})
module.exports ={
    addCartValidator
}

const Joi = require('joi')

const addOfferValidator = Joi.object({
  plants: Joi.array().items(Joi.string()),
  ordersAbove: Joi.number(),
  percentageOff: Joi.number().required(),
  upto: Joi.number().required(),
  minPurchaseQty: Joi.number(),
  image: Joi.string().required(),
  offerCode: Joi.string().required(),
  stack: Joi.number().required(),
}).custom((obj, helpers) => {
  if (obj.ordersAbove === undefined && obj.minPurchaseQty === undefined) {
    return helpers.error('custom.bothEmpty', { message: 'Either ordersAbove or minPurchaseQty must be provided' })
  }
  return obj
}, 'Validate ordersAbove and minPurchaseQty')

module.exports ={
    addOfferValidator
}

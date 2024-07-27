const Joi = require('joi')

const addSectionValidator = Joi.object({
  type: Joi.string().valid('TYPE1', 'TYPE2').required(),
  name: Joi.string().required(),
  stack: Joi.number().required().strict(),
  plants: Joi.array().items(Joi.string()),
})

module.exports = {addSectionValidator}

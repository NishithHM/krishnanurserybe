// const Joi = require('joi')

// const addCartValidator = Joi.object({
//   cart: Joi.array().items(items(Joi.object().keys({
//     plantId: Joi.string().required(),
//     qty: Joi.number().required()
// }))).required(),
//   uuid: Joi.number(),
//   offerId: Joi.string()
// })
// module.exports ={
//     addCartValidator
// }
const Joi = require('joi');

const addCartValidator = Joi.object({
  cart: Joi.array().items(
    Joi.object().keys({
      plantId: Joi.string().required().label('Plant ID'),
      qty: Joi.number().integer().min(1).required().label('Quantity')
    })
  ).min(1).required().label('Cart Items'),
  
  uuid: Joi.string().optional().label('UUID'),  // UUID should be a string, not a number
  
  offerId: Joi.string().optional().label('Offer ID')  // Optional offer ID if provided
});

module.exports = {
  addCartValidator
};

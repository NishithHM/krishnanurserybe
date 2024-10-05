
const Joi = require('joi');

const addCartValidator = Joi.object({
 
  cart: Joi.array().items(
    Joi.object().keys({
      plantId: Joi.string().required().label('Plant ID'),
      qty: Joi.number().integer().min(1).required().label('Quantity')
    })
  ).min(1).required().label('Cart Items'),

 
  uuid: Joi.string().optional().label('UUID'),

 
  offerId: Joi.string().optional().label('Offer ID'),

  customer: Joi.object().keys({
    name: Joi.string().required().label('Customer Name'),
    phone: Joi.string().pattern(/^[0-9]{10}$/).required().label('10-Digit Mobile Number'),
    pinCode: Joi.string().length(6).pattern(/^[0-9]+$/).required().label('Pin Code'),
    address: Joi.string().required().label('Address'),
    locality: Joi.string().required().label('Locality'),
    city: Joi.string().required().label('City'),
    state: Joi.string().required().label('State')
  }).required().label('Customer Details'),

 
  couponCode: Joi.string().optional().label('Coupon Code'),


  status: Joi.string().valid('cart', 'placed').default('cart').label('Status')
});

module.exports = {
  addCartValidator
};

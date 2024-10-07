const Joi = require('joi');

const checkoutCartValidator = Joi.object({
    uuid: Joi.string().required().label('UUID'), // UUID is required 

    customer: Joi.object({
        name: Joi.string().required().label('Customer Name'),
        phone: Joi.number().integer().min(1000000000).max(9999999999).required().label('10-Digit Mobile Number'), 
        pinCode: Joi.number().integer().min(100000).max(999999).required().label('Pin Code'), 
        address: Joi.string().required().label('Address'),
        locality: Joi.string().required().label('Locality'),
        city: Joi.string().required().label('City'),
        state: Joi.string().required().label('State'),
        landmark: Joi.string().optional().label('Landmark'), 
        alternateMobileNumber: Joi.number().integer().min(1000000000).max(9999999999).optional().label('Alternate Mobile Number') 
    }).required().label('Customer Details'),

    couponCode: Joi.string().optional().label('Coupon Code'), 
    status: Joi.string().valid('cart', 'placed').default('cart').label('Status') 
});



module.exports = {
    checkoutCartValidator 
};

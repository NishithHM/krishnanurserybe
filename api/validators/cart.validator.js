const Joi = require('joi');

const addToCartValidator = Joi.object({
    uuid: Joi.string().optional().label('UUID'),
    
    cart: Joi.array().items(
        Joi.object({
            plantId: Joi.string().required().label('Plant ID'), 
            qty: Joi.number().integer().min(1).required().label('Quantity') 
        })
    ).min(1).required().label('Cart Items'), 
    
    offerId: Joi.string().optional().label('Offer ID'), 
});

module.exports = {
    addToCartValidator
};

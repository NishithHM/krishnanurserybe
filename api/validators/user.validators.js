const Joi = require('joi')

exports.createUserSchema = Joi.object().keys({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    phoneNumber: Joi.string().min(10).max(10).required(),
    password: Joi.string().min(7).required(),
    role: Joi.string().valid('admin', 'sales', 'procurement').required()
});
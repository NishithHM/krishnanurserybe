const Joi = require('joi')

exports.getVendorsSchema = Joi.object().keys({
    search: Joi.string().min(3).required()
});
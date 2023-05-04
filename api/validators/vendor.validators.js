const Joi = require('joi')

exports.getVendorByIdSchema = Joi.object().keys({
    id: Joi.string().required()
});
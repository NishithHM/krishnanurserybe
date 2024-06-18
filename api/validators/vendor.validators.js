const Joi = require('joi')

exports.getVendorByIdSchema = Joi.object().keys({
    id: Joi.string().required()
});

exports.getVendorSchema = Joi.object().keys({
    search: Joi.string().pattern(new RegExp(/[A-Za-z0-9]/)),
    type: Joi.string().valid('AGRI', 'NURSERY')
});
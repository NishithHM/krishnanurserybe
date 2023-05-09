const Joi = require('joi')


exports.getBrokersSchema = Joi.object().keys({
    search: Joi.string().pattern(new RegExp(/[A-Za-z0-9]/)),
});
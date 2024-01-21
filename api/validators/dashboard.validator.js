const Joi = require("joi");

exports.metaDataValidator = Joi.object().keys({
    startDate: Joi.string().required(),
    endDate: Joi.string().required(),
    categories: Joi.array().items(Joi.string()),
    plants: Joi.array().items(Joi.string())
});
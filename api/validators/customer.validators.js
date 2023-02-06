const Joi = require('joi')

exports.customerSchema = Joi.object().keys({
    name: Joi.string().pattern(new RegExp(/[A-Za-z]/)).required(),
    phoneNumber: Joi.string().min(10).max(10).required(),
    dob: Joi.date().required(),
    categoryList: Joi.array().items(Joi.object().keys({
        id: Joi.string().required(),
        CategoryNameInEnglish: Joi.string().pattern(new RegExp(/[A-Za-z]/)).required(),
        CategoryNameInKannada: Joi.string().required(),
    }))
});

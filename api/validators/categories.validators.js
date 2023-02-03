const Joi = require('joi')

exports.createCategorySchema = Joi.object().keys({
    nameInEnglish: Joi.string().pattern(new RegExp(/[A-Za-z]/)).required(),
    nameInKannada: Joi.string().required(),
});



exports.deleteCategorySchema = Joi.object().keys({
    id: Joi.string().required()
});

exports.getCategorySchema = Joi.object().keys({
    search: Joi.string().pattern(new RegExp(/[A-Za-z]/)),
    pageNumber: Joi.number(),
    isCount: Joi.boolean(),
    sortBy: Joi.string().valid('categoryName'),
    sortType: Joi.number().valid(-1, 1).default(1)
})
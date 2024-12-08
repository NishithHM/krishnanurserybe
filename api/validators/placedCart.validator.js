const Joi = require('joi');

const placedCartValidator = Joi.object({
    startDate: Joi.string().isoDate().label('Start Date'),
    endDate: Joi.string().isoDate().label('End Date'),
    sortBy: Joi.string().valid('updatedAt', 'totalAmount').default('updatedAt').label('Sort By'),
    sortType: Joi.number().valid(1, -1).default(-1).label('Sort Type'),
    search: Joi.string(),
    pageNumber: Joi.number().min(1),
    isCount: Joi.string().valid('true', 'false').default('false')
});

module.exports = {
    placedCartValidator
};

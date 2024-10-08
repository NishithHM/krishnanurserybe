const Joi = require('joi');

const placedCartValidator = Joi.object({
    startDate: Joi.string().isoDate().required().label('Start Date'),
    endDate: Joi.string().isoDate().required().label('End Date'),
    sortBy: Joi.string().valid('createdOn', 'totalPrice').required().label('Sort By'),
    sortType: Joi.number().valid(1, -1).required().label('Sort Type')
});

module.exports = {
    placedCartValidator
};

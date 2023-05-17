const Joi = require('joi');

exports.addPaymentScheme = Joi.object().keys({
    brokerName: Joi.string().pattern(new RegExp(/[A-Za-z]/)),
    invoiceId: Joi.string(),
    brokerId: Joi.string(),
    brokerNumber: Joi.string(),
    empName: Joi.string().pattern(new RegExp(/[A-Za-z]/)),
    amount: Joi.number().required(),
    type: Joi.string().valid('BROKER', 'OTHERS', 'SALARY')
});

exports.getPaymentHistorySchema = Joi.object().keys({
    pageNumber: Joi.number(),
    isCount: Joi.boolean(),
    startDate : Joi.string().pattern(new RegExp(/\d{4}-\d{2}-\d{2}/)),
    endDate : Joi.string().pattern(new RegExp(/\d{4}-\d{2}-\d{2}/)),
    sortBy: Joi.string().valid('updatedAt').default('updatedAt'),
    sortType: Joi.number().valid(-1, 1).default(1),
    search: Joi.string().pattern(new RegExp(/[A-Za-z0-9]/)),
    type: Joi.string().valid('BROKER', 'OTHERS', 'SALARY')
});
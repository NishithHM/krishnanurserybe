const Joi = require('joi');

exports.addPaymentScheme = Joi.object().keys({
    brokerName: Joi.string().pattern(new RegExp(/[A-Za-z]/)),
    invoiceId: Joi.string(),
    brokerId: Joi.string(),
    brokerNumber: Joi.string(),
    empName: Joi.string().pattern(new RegExp(/[A-Za-z]/)),
    amount: Joi.number().required(),
    type: Joi.string().valid('BROKER', 'OTHERS', 'SALARY', 'VENDOR', 'CAPITAL'),
    transferType: Joi.string().valid('CASH', 'ONLINE', 'BOTH'),
    businessType: Joi.string().valid('AGRI', 'NURSERY').required(),
    phoneNumber: Joi.string().length(10),
    accountNumber: Joi.string(),
    ifscCode: Joi.string(),
    bankName: Joi.string(),
    comment: Joi.string(),
    cashAmount: Joi.number(),
    onlineAmount: Joi.number(),
    vendorId: Joi.string()
});

exports.getPaymentHistorySchema = Joi.object().keys({
    pageNumber: Joi.number(),
    isCount: Joi.boolean(),
    startDate : Joi.string().pattern(new RegExp(/\d{4}-\d{2}-\d{2}/)),
    endDate : Joi.string().pattern(new RegExp(/\d{4}-\d{2}-\d{2}/)),
    sortBy: Joi.string().valid('updatedAt').default('updatedAt'),
    sortType: Joi.number().valid(-1, 1).default(1),
    search: Joi.string().pattern(new RegExp(/[A-Za-z0-9]/)),
    type: Joi.string().valid('BROKER', 'OTHERS', 'SALARY', 'VENDOR', 'CAPITAL'),
    businessType: Joi.string().valid('AGRI', 'NURSERY').required(),
    vendorId: Joi.string()
    
});

exports.getPaymentInfoSchema = Joi.object().keys({
    phoneNumber: Joi.string().length(10)
});
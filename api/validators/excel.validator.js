const Joi = require("joi");

exports.billingExcelValidator = Joi.object().keys({
    startDate: Joi.string().required(),
    endDate: Joi.string().required(),
    isCount: Joi.number(),
    type: Joi.string().optional(),
    pageNumber: Joi.string().optional(),
    isCount: Joi.number(),
    search: Joi.string().optional() 
});

exports.wasteMgmtExcelValidator = Joi.object().keys({
    startDate: Joi.string().required(),
    endDate: Joi.string().required(),
    pageNumber: Joi.string().required(),
    isCount: Joi.number()
});

exports.orderMgmtExcelValidator = Joi.object().keys({
    startDate: Joi.string().required(),
    endDate: Joi.string().required(),
    pageNumber: Joi.string().required(),
    isCount: Joi.number()
});

exports.paymentExcelValidator = Joi.object().keys({
    startDate: Joi.string().required(),
    endDate: Joi.string().required(),
    pageNumber: Joi.string().required(),
    isCount: Joi.number(),
    type: Joi.string().required().valid('NURSERY', 'AGRI')
});
const Joi = require("joi");

exports.billingExcelValidator = Joi.object().keys({
    startDate: Joi.string().required(),
    endDate: Joi.string().required(),
    pageNumber: Joi.string().required(),
    isCount: Joi.number()
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
const Joi = require('joi')

exports.customerSchema = Joi.object().keys({
    name: Joi.string().pattern(new RegExp(/[A-Za-z]/)).required(),
    phoneNumber: Joi.string().min(10).max(10).required(),
    dob: Joi.date().required(),
    categoryList: Joi.array().items(Joi.object().keys({
        id: Joi.string().required(),
        categoryNameInEnglish: Joi.string().pattern(new RegExp(/[A-Za-z]/)).required(),
        categoryNameInKannada: Joi.string().required(),
    }))
});

exports.getCustomerSchema = Joi.object().keys({
    phoneNumber: Joi.string().required().min(10).max(10)
});


exports.pincodeSchema = Joi.object().keys({
    pincode: Joi.number().max(999999)
})

exports.customerListSchema = Joi.object().keys({
    pageNumber: Joi.number().max(999999),
    search: Joi.string().pattern(new RegExp(/[A-Za-z]/)),
    pageNumber: Joi.number(),
    isCount: Joi.boolean(),
    type: Joi.string().valid('BUSINESS', 'REGULAR').required(),
    
})

exports.businessCustomerSchema = Joi.object().keys({
    name: Joi.string().pattern(new RegExp(/[A-Za-z]/)).required(),
    businessName: Joi.string().pattern(new RegExp(/[A-Za-z]/)).required(),
    phoneNumber: Joi.string().min(10).max(10).required(),
    dob: Joi.date(),
    categoryList: Joi.array().items(Joi.object().keys({
        id: Joi.string().required(),
        categoryNameInEnglish: Joi.string().pattern(new RegExp(/[A-Za-z]/)).required(),
        categoryNameInKannada: Joi.string().required(),
    })),
    customerAddressLine1:Joi.string(),
    customerAddressLine2: Joi.string().optional().default(''),
    customerAddressPinCode: Joi.number().max(999999).min(100000),
    customerAddressPinCodeDetails: Joi.string(),
    shippingAddressPinCodeDetails: Joi.string(),
    gstNumber:Joi.string(),
    shippingAddressLine1: Joi.string(),
    shippingAddressLine2: Joi.string().optional().default(''),
    shippingAddressPinCode: Joi.string(),
    latitude: Joi.number(),
    longitude: Joi.number()
});


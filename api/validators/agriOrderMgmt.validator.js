const Joi = require("joi");

exports.requestAgriItemsSchema = Joi.object().keys({
    orders: Joi.array().items(Joi.object().keys({
        totalQuantity: Joi.number().required(),
        type: Joi.string().required(),
        name: Joi.string().required(),
        variant: Joi.array().items(Joi.object().keys({
            optionName: Joi.string().required(),
            optionValue: Joi.string().required()
        }))
    })),
    description : Joi.string().max(200)
});

exports.placeAgriItemsSchema = Joi.object().keys({
    orders: Joi.array().items(Joi.object().keys({
        totalQuantity: Joi.number().required(),
        type: Joi.string().required(),
        name: Joi.string().required(),
        variant: Joi.array().items(Joi.object().keys({
            optionName: Joi.string().required(),
            optionValue: Joi.string().required()
        })),
        id: Joi.string(),
        totalPrice: Joi.number().required()
    })),
    description : Joi.string().max(200),
    currentPaidAmount: Joi.number().required(),
    orderId: Joi.number().required(),
    vendorName: Joi.string().required(),
    vendorContact: Joi.string().min(10).max(10),
    expectedDeliveryDate: Joi.string().pattern(new RegExp(/\d{4}-\d{2}-\d{2}/)),
    vendorId: Joi.string(),
});

exports.getAgriOrdersSchema = Joi.object().keys({
    pageNumber: Joi.number(),
    isCount: Joi.boolean(),
    startDate : Joi.string().pattern(new RegExp(/\d{4}-\d{2}-\d{2}/)),
    endDate : Joi.string().pattern(new RegExp(/\d{4}-\d{2}-\d{2}/)),
    sortBy: Joi.string().valid('createdAt', 'names').default("createdAt"),
    sortType: Joi.number().valid(-1, 1).default(-1),
    search: Joi.string().pattern(new RegExp(/[A-Za-z0-9]/)).allow(""),
    status: Joi.array().items(Joi.string().valid('REJECTED', 'REQUESTED', 'PLACED', 'VERIFIED')),
    vendors: Joi.array().items(Joi.string()),
});

exports.verifyAgriOrderSchema = Joi.object().keys({
    id: Joi.string().required(),
    quantity: Joi.number().required()
});

exports.getAgriProcurementsSchema = Joi.object().keys({
    search: Joi.string().pattern(new RegExp(/[A-Za-z0-9\u0C82\u0C83\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBC-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CDE\u0CE0-\u0CE3\u0CE6-\u0CEF\u0CF1\u0CF2]/)),
    pageNumber: Joi.number(),
    isCount: Joi.boolean(),
    sortBy: Joi.string().valid('lastProcuredOn', 'names'),
    sortType: Joi.number().valid(-1, 1).default(1),
});

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

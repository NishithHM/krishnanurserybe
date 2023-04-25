const Joi = require('joi')

exports.requestProcurementSchema = Joi.object().keys({
    nameInEnglish: Joi.string().pattern(new RegExp(/[A-Za-z]/)).required(),
    totalQuantity: Joi.number().required(),
    id: Joi.string(),
    descriptionSales: Joi.string().max(1000).required()
});

exports.rejectProcurementSchema = Joi.object().keys({
    id: Joi.string().required(),
    description: Joi.string().max(1000).required()
});

exports.verifyProcurementSchema = Joi.object().keys({
    id: Joi.string().required(),
    quantity: Joi.number().required()
});

exports.addInvoiceProcurementSchema = Joi.object().keys({
    id: Joi.string().required(),
});

exports.getOrdersProcurementSchema = Joi.object().keys({
    pageNumber: Joi.number(),
    isCount: Joi.boolean(),
    startDate : Joi.string().pattern(new RegExp(/\d{4}-\d{2}-\d{2}/)),
    endDate : Joi.string().pattern(new RegExp(/\d{4}-\d{2}-\d{2}/)),
    sortBy: Joi.string().valid('createdAt', 'plantName'),
    sortType: Joi.number().valid(-1, 1).default(1),
    search: Joi.string().pattern(new RegExp(/[A-Za-z]/)),
    statuses: Joi.array().items(Joi.string().valid('REJECTED', 'REQUESTED', 'PLACED', 'VERIFIED'))
});

exports.updateDeliveryProcurementSchema = Joi.object().keys({
    id: Joi.string().required(),
    expectedDeliveryDate: Joi.string().pattern(new RegExp(/\d{4}-\d{2}-\d{2}/))
});

exports.placeOrderSchema = Joi.object().keys({
    nameInEnglish: Joi.string().pattern(new RegExp(/[A-Za-z]/)).required(),
    nameInKannada: Joi.string().required(),
    vendorName: Joi.string().required(),
    vendorContact: Joi.string().min(10).max(10),
    totalQuantity: Joi.number().required(),
    totalPrice: Joi.number().required(),
    description: Joi.string(),
    vendorId: Joi.string(),
    categories: Joi.array().items(Joi.object().keys({
        _id:Joi.string().required(),
        name: Joi.string().required()
    })),
    expectedDeliveryDate: Joi.string().pattern(new RegExp(/\d{4}-\d{2}-\d{2}/)),
    id: Joi.string(),
    procurementId: Joi.string().required(),
    currentPaidAmount: Joi.number().required(),

});

exports.updateProcurementSchema = Joi.object().keys({
    id: Joi.string().required(),
    vendorName: Joi.string().required(),
    vendorContact: Joi.string().min(10).max(10).required(),
    totalQuantity: Joi.number().required(),
    totalPrice: Joi.number().required(),
    description: Joi.string(),
    vendorId: Joi.string(),
    categories: Joi.array().items(Joi.object().keys({
        _id:Joi.string().required(),
        name: Joi.string().required()
    }))
});

exports.getProcurementsSchema = Joi.object().keys({
    search: Joi.string().pattern(new RegExp(/[A-Za-z]/)),
    pageNumber: Joi.number(),
    isCount: Joi.boolean(),
    sortBy: Joi.string().valid('lastProcuredOn', 'plantName'),
    sortType: Joi.number().valid(-1, 1).default(1),
    isAll: Joi.string().default("false"),
    isList: Joi.string().default("false")
});

exports.getProcurementsHistorySchema = Joi.object().keys({
    pageNumber: Joi.number(),
    isCount: Joi.boolean(),
    id: Joi.string().required(),
    startDate : Joi.string().pattern(new RegExp(/\d{4}-\d{2}-\d{2}/)).required(),
    endDate : Joi.string().pattern(new RegExp(/\d{4}-\d{2}-\d{2}/)).required(),
    isAverage: Joi.boolean()
});

exports.addVariantsSchema = Joi.object().keys({
    id: Joi.string().required(),
    variants: Joi.array().items(Joi.object().keys({
        variantNameInEnglish: Joi.string().pattern(new RegExp(/[A-Za-z]/)).required(),
        variantNameInKannada: Joi.string().required(),
        minPrice: Joi.number().required(),
        maxPrice: Joi.number().required()
    })),
})

exports.setProcurementMinQuantitySchema = Joi.object().keys({
    id: Joi.string().required(),
    minimumQuantity: Joi.number().required()
})

exports.getProcurementsLowSchema = Joi.object().keys({
    pageNumber: Joi.number(),
    isCount: Joi.boolean(),
    sortBy: Joi.string().valid('minimumQuantity'),
    sortType: Joi.number().valid(-1, 1).default(1),
    search: Joi.string().pattern(new RegExp(/[A-Za-z]/)),
});

exports.updateDamageProcurementSchema = Joi.object().keys({
    id: Joi.string().required(),
    damagedQuantity: Joi.string().required()
});

exports.updateMaintenanceProcurementSchema = Joi.object().keys({
    id: Joi.string().required(),
    count: Joi.string().required()
});

exports.getProcurementIdSchema = Joi.object().keys({
    id: Joi.string().required(),
});

exports.getDamagesSchema = Joi.object().keys({
    startDate : Joi.string().pattern(new RegExp(/\d{4}-\d{2}-\d{2}/)),
    endDate : Joi.string().pattern(new RegExp(/\d{4}-\d{2}-\d{2}/)),
    search: Joi.string(),
    isCount: Joi.string(),
    pageNumber: Joi.number(),
});
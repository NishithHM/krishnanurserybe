const Joi = require('joi')

// update the new schema for request order .

exports.requestProcurementSchema = Joi.object({
  plants: Joi.array().items(
    Joi.object({
      nameInEnglish: Joi.string().pattern(new RegExp(/[A-Za-z]/)).required(),
      totalQuantity: Joi.number().min(0).required(),
      id: Joi.string().optional(),
    })
  ).min(1).required(), // must have at least one plant
  descriptionSales: Joi.string().max(1000).required(),
  ownProduction: Joi.boolean().default(false)
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
    orderData: Joi.object(),
    finalAmountPaid: Joi.number().required(),
    cashAmount: Joi.number().required(),
    onlineAmount: Joi.number().required(),
    comments: Joi.string().required()
});

exports.getOrdersProcurementSchema = Joi.object().keys({
    pageNumber: Joi.number(),
    isCount: Joi.boolean(),
    startDate : Joi.string().pattern(new RegExp(/\d{4}-\d{2}-\d{2}/)),
    endDate : Joi.string().pattern(new RegExp(/\d{4}-\d{2}-\d{2}/)),
    sortBy: Joi.string().valid('createdAt', 'plantName').default("createdAt"),
    sortType: Joi.number().valid(-1, 1).default(-1),
    search: Joi.string().pattern(new RegExp(/[A-Za-z0-9]/)).allow(""),
    status: Joi.array().items(Joi.string().valid('REJECTED', 'REQUESTED', 'PLACED', 'VERIFIED')),
    vendors: Joi.array().items(Joi.string()),
});

exports.updateDeliveryProcurementSchema = Joi.object().keys({
    id: Joi.string().required(),
    expectedDeliveryDate: Joi.string().pattern(new RegExp(/\d{4}-\d{2}-\d{2}/))
});


// updated the new schema for the placeorder as well .

exports.placeOrderSchema = Joi.object({
  plants: Joi.array().items(
    Joi.object({
      nameInEnglish: Joi.string().pattern(new RegExp(/[A-Za-z]/)).required(),
      nameInKannada: Joi.string().allow("").optional(),
      totalQuantity: Joi.number().min(1).required(),
      totalPrice: Joi.number().min(0).required(),
      categories: Joi.array().items(
        Joi.object({
          _id: Joi.string().required(),
          name: Joi.string().required()
        })
      ).default([]),
      procurementId: Joi.string().optional()
    })
  ).min(1).required(),

  vendorName: Joi.string().optional(),
  vendorContact: Joi.string()
    .pattern(/^[0-9]{10}$/) 
    .required(),
  vendorId: Joi.string().optional(),
  description: Joi.string().max(1000).required(),
  currentPaidAmount: Joi.number().min(0).required(),
  expectedDeliveryDate: Joi.string()
    .isoDate() 
    .required(),
  orderId: Joi.number().optional(), 
  totalPrice: Joi.number().min(0).optional(), 
  totalQuantity: Joi.number().min(0).optional(),
  id: Joi.string().optional(),
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
    search: Joi.string().pattern(new RegExp(/[A-Za-z0-9\u0C82\u0C83\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBC-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CDE\u0CE0-\u0CE3\u0CE6-\u0CEF\u0CF1\u0CF2]/)),
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

exports.uploadPamphletSchema = Joi.object().keys({
    id: Joi.string().required(),
});

exports.getProcurementsLowSchema = Joi.object().keys({
    pageNumber: Joi.number(),
    isCount: Joi.boolean(),
    sortBy: Joi.string().valid('minimumQuantity'),
    sortType: Joi.number().valid(-1, 1).default(1),
    search: Joi.string().pattern(new RegExp(/[A-Za-z0-9]/)),
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

exports.getProcurementVendorOrderIdSchema = Joi.object().keys({
    id: Joi.string().required(),
});

exports.getDamagesSchema = Joi.object().keys({
    startDate : Joi.string().pattern(new RegExp(/\d{4}-\d{2}-\d{2}/)),
    endDate : Joi.string().pattern(new RegExp(/\d{4}-\d{2}-\d{2}/)),
    search: Joi.string().pattern(new RegExp(/[A-Za-z0-9]/)),
    isCount: Joi.string(),
    pageNumber: Joi.number(),
});

exports.getOrderIdSchema = Joi.object().keys({
    id: Joi.number(),
    page: Joi.string().valid('placeOrder', 'orders')
});
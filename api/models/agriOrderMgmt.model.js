const mongoose = require('mongoose')
const AgriOrders = new mongoose.Schema({
    names: {
        required: true,
        type: String,
        lowercase: true
    },
    requestedBy: {
        name: {
            type: String,
            lowercase: true,
        },
        _id: {
            type: mongoose.Schema.Types.ObjectId,
        }
    },
    placedBy: {
        name: {
            type: String,
            lowercase: true,
        },
        _id: {
            type: mongoose.Schema.Types.ObjectId,
        }
    },
    requestedQuantity: {
        type: Number,
        required: true
    },
    totalPrice: {
        type: Number,
        default: 0
    },
    gst: {
        type: Number,
        default: 0
    },
    totalPriceWithoutGst: {
        type: Number,
        default: 0
    },
    currentPaidAmount: {
        type: Number,
        default: 0
    },
    vendorName:{
        type: String,
        default: ''
    },
    vendorContact:{
        type: String,
        default: ''
    },
    descriptionSales:{
        type: String,
        default: ''
    },
    descriptionProc:{
        type: String
    },
    vendorId:{
        type: String,
    },
    invoice:{
        type: String,
        default: ''
    },
    status:{
        type: String,
        enum: ['REQUESTED', 'PLACED', 'VERIFIED', 'REJECTED']
    },
    quantity: {
        type: Number,
        default: 0
    },
    orderedQuantity: {
        type: Number,
        default: 0
    },
    expectedDeliveryDate:{
        type: Date
    },
    orderId: {
        type: Number,
    },
    images: [{ type: String}],
    variant:{
        type:[{
            optionName:{
                type:String,
                lowercase: true
            },
            optionValue:{
                type: String,
                lowercase: true
            }
        }]
    },
    type:{
        type: String
    },
    typeName:{
        type: String
    },
    invoiceId:{
        type: String
    }
}, {
    timestamps: true
})


module.exports = mongoose.model("agri_orders", AgriOrders)